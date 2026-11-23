import {
  and,
  count,
  countDistinct,
  desc,
  eq,
  exists,
  getTableColumns,
  ilike,
  or,
  sql,
} from "drizzle-orm";
import { escapeLike, totalOf } from "../utils/utils.js";
import {
  classes,
  departments,
  enrollments,
  subjects,
} from "../db/schema/app.js";
import { db } from "../db/index.js";
import { user } from "../db/schema/auth.js";
import { CreateDepartmentInput } from "../validation/departments.validation.js";

export const departmentRepository = {
  /* -------------------------------------------------------------------------- */
  /* Departments                                                                */
  /* -------------------------------------------------------------------------- */

  async listDepartments({
    search,
    limit,
    offset,
  }: Page & { search?: string | undefined }) {
    const pattern = search ? `%${escapeLike(search)}%` : undefined;
    const where = pattern
      ? or(ilike(departments.name, pattern), ilike(departments.code, pattern))
      : undefined;

    // The page and the total are independent, so run them concurrently.
    const [rows, totalRows] = await Promise.all([
      db
        .select({
          ...getTableColumns(departments),
          totalSubjects: count(subjects.id),
        })
        .from(departments)
        .leftJoin(subjects, eq(subjects.departmentId, departments.id))
        .where(where)
        .groupBy(departments.id)
        // id is a tie-breaker so pages never overlap or skip rows
        .orderBy(desc(departments.createdAt), desc(departments.id))
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(departments).where(where),
    ]);

    return { rows, total: totalOf(totalRows) };
  },

  /* -------------------------------------------------------------------------- */
  /* Create department                                                                */
  /* -------------------------------------------------------------------------- */

  async createDepartment(input: CreateDepartmentInput) {
    const [created] = await db
      .insert(departments)
      .values(input)
      .returning({ id: departments.id });

    if (!created) throw new Error("Insert returned no row");
    return created;
  },

  /* -------------------------------------------------------------------------- */
  /* Get department details with counts                                                                */
  /* -------------------------------------------------------------------------- */

  /** Returns null when the department does not exist. */
  async getDepartmentDetails(departmentId: number) {
    // The department row and its totals don't depend on each other: fetch both
    // at once. All three counts come from ONE query that walks
    // subjects -> classes -> enrollments a single time (instead of three queries,
    // one of which scanned the whole user table).
    const [departmentRows, totalsRows] = await Promise.all([
      db
        .select()
        .from(departments)
        .where(eq(departments.id, departmentId))
        .limit(1),
      db
        .select({
          subjects: countDistinct(subjects.id),
          classes: countDistinct(classes.id),
          enrolledStudents: countDistinct(enrollments.studentId),
        })
        .from(subjects)
        .leftJoin(classes, eq(classes.subjectId, subjects.id))
        .leftJoin(enrollments, eq(enrollments.classId, classes.id))
        .where(eq(subjects.departmentId, departmentId)),
    ]);

    const department = departmentRows[0];
    if (!department) return null;

    return {
      department,
      totals: totalsRows[0] ?? { subjects: 0, classes: 0, enrolledStudents: 0 },
    };
  },
  /* -------------------------------------------------------------------------- */
  /* Subjects                                                                   */
  /* -------------------------------------------------------------------------- */

  async listDepartmentSubjects(departmentId: number, { limit, offset }: Page) {
    const where = eq(subjects.departmentId, departmentId);

    const [rows, totalRows] = await Promise.all([
      db
        .select()
        .from(subjects)
        .where(where)
        .orderBy(desc(subjects.createdAt), desc(subjects.id))
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(subjects).where(where),
    ]);

    return { rows, total: totalOf(totalRows) };
  },

  /* -------------------------------------------------------------------------- */
  /* Classes                                                                    */
  /* -------------------------------------------------------------------------- */

  async listDepartmentClasses(departmentId: number, { limit, offset }: Page) {
    const where = eq(subjects.departmentId, departmentId);

    const [rows, totalRows] = await Promise.all([
      db
        .select({
          ...getTableColumns(classes),
          subject: getTableColumns(subjects),
          teacher: getTableColumns(user),
        })
        .from(classes)
        // inner join: the WHERE on subjects made the old left join an inner join anyway
        .innerJoin(subjects, eq(classes.subjectId, subjects.id))
        .leftJoin(user, eq(classes.teacherId, user.id))
        .where(where)
        .orderBy(desc(classes.createdAt), desc(classes.id))
        .limit(limit)
        .offset(offset),
      // the count doesn't need the user join
      db
        .select({ total: count() })
        .from(classes)
        .innerJoin(subjects, eq(classes.subjectId, subjects.id))
        .where(where),
    ]);

    return { rows, total: totalOf(totalRows) };
  },

  /* -------------------------------------------------------------------------- */
  /* Users (teachers / students)                                                */
  /* -------------------------------------------------------------------------- */

  async listDepartmentUsers(
    departmentId: number,
    role: MemberRole | undefined,
    { limit, offset }: Page,
  ) {
    // Built once and shared by the page query and the count query.
    const where = usersInDepartment(role, departmentId);

    const [rows, totalRows] = await Promise.all([
      db
        .select(getTableColumns(user))
        .from(user)
        .where(where)
        .orderBy(desc(user.createdAt), desc(user.id))
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(user).where(where),
    ]);

    return { rows, total: totalOf(totalRows) };
  },
};

// "Belongs to the department" is expressed as EXISTS (a semi-join). Compared to
// join + GROUP BY <every user column> + COUNT(DISTINCT), it never multiplies
// rows, needs no de-duplication, and stops at the first match per user.
function usersInDepartment(role: MemberRole | undefined, departmentId: number) {
  const teacherSubquery = db
    .select({ one: sql`1` })
    .from(classes)
    .innerJoin(subjects, eq(classes.subjectId, subjects.id))
    .where(
      and(
        eq(classes.teacherId, user.id),
        eq(subjects.departmentId, departmentId),
      ),
    );
  const studentSubquery = db
    .select({ one: sql`1` })
    .from(enrollments)
    .innerJoin(classes, eq(enrollments.classId, classes.id))
    .innerJoin(subjects, eq(classes.subjectId, subjects.id))
    .where(
      and(
        eq(enrollments.studentId, user.id),
        eq(subjects.departmentId, departmentId),
      ),
    );

  if (role === "teacher") {
    return and(eq(user.role, "teacher"), exists(teacherSubquery));
  }
  if (role === "student") {
    return and(eq(user.role, "student"), exists(studentSubquery));
  }

  return or(
    and(eq(user.role, "teacher"), exists(teacherSubquery)),
    and(eq(user.role, "student"), exists(studentSubquery)),
  );
}
