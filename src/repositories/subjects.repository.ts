// src/repositories/subjects.repository.ts
import {
  and,
  count,
  desc,
  eq,
  exists,
  getTableColumns,
  ilike,
  inArray,
  or,
  sql,
  SQL,
} from "drizzle-orm";
import { db } from "../db/index.js";
import {
  classes,
  departments,
  enrollments,
  subjects,
} from "../db/schema/app.js";
import { escapeLike, totalOf } from "../utils/utils.js";
import { user } from "../db/schema/auth.js";
import { CreateSubjectInput } from "../validation/subjects.validation.js";

export const subjectRepository = {
  async findManyWithDepartment({
    search,
    department,
    limit,
    offset,
  }: Page & {
    search?: string | undefined;
    department?: string | undefined;
  }) {
    const conditions: (SQL | undefined)[] = [];

    if (search) {
      const pattern = `%${escapeLike(search)}%`;
      conditions.push(
        or(ilike(subjects.name, pattern), ilike(subjects.code, pattern)),
      );
    }

    if (department) {
      // Filtering by department name is a semi-join (IN subquery) rather than a
      // WHERE on a joined table. That way the filter lives in one shared WHERE,
      // and the count query doesn't need to join departments at all.
      //   This specific snippet is a Drizzle ORM expression that generates an SQL IN subquery filter. It checks whether a subject's department ID matches any department whose name contains the search term.
      //   inArray(column, subquery):
      conditions.push(
        inArray(
          subjects.departmentId,
          db
            .select({ id: departments.id })
            .from(departments)
            .where(ilike(departments.name, `%${escapeLike(department)}%`)),
        ),
      );
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    // The page and the total are independent, so run them concurrently.
    const [rows, totalResult] = await Promise.all([
      db
        .select({
          ...getTableColumns(subjects),
          department: getTableColumns(departments),
        })
        .from(subjects)
        // Use innerJoin here if subjects.departmentId is NOT NULL.
        .leftJoin(departments, eq(subjects.departmentId, departments.id))
        .where(where)
        // id is a tie-breaker so pages never overlap or skip rows
        .orderBy(desc(subjects.createdAt), desc(subjects.id))
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(subjects).where(where),
    ]);

    return {
      rows,
      total: totalOf(totalResult),
    };
  },

  /* -------------------------------------------------------------------------- */
  /* Subject details and it's classes count                                     */
  /* -------------------------------------------------------------------------- */

  /** Returns null when the subject does not exist. */
  async findById(subjectId: number) {
    // The subject row and its class count don't depend on each other: fetch both
    // at once instead of one after the other.
    const [subjectRows, classesRows] = await Promise.all([
      db
        .select({
          ...getTableColumns(subjects),
          department: getTableColumns(departments),
        })
        .from(subjects)
        .leftJoin(departments, eq(subjects.departmentId, departments.id))
        .where(eq(subjects.id, subjectId))
        .limit(1),

      db
        .select({ total: count() })
        .from(classes)
        .where(eq(classes.subjectId, subjectId)),
    ]);

    const subject = subjectRows[0];
    if (!subject) return null;
    return { subject, totals: { classes: totalOf(classesRows) } };
  },

  /* -------------------------------------------------------------------------- */
  /* Classes details and it's count per subject                                      */
  /* -------------------------------------------------------------------------- */

  async listSubjectClasses(subjectId: number, { limit, offset }: Page) {
    const where = eq(classes.subjectId, subjectId);

    const [rows, totalRows] = await Promise.all([
      db
        .select({
          ...getTableColumns(classes),
          teacher: getTableColumns(user),
        })
        .from(classes)
        .leftJoin(user, eq(classes.teacherId, user.id))
        .where(where)
        .orderBy(desc(classes.createdAt), desc(classes.id))
        .limit(limit)
        .offset(offset),
      // the count doesn't need the user join
      db.select({ total: count() }).from(classes).where(where),
    ]);

    return { rows, total: totalOf(totalRows) };
  },

  /* -------------------------------------------------------------------------- */
  /* Create subject                                                 */
  /* -------------------------------------------------------------------------- */

  async createSubject(input: CreateSubjectInput) {
    const [created] = await db
      .insert(subjects)
      .values(input)
      .returning({ id: subjects.id });

    if (!created) throw new Error("Insert returned no row");
    return created;
  },

  /* -------------------------------------------------------------------------- */
  /* Users per role per subject                                                 */
  /* -------------------------------------------------------------------------- */

  async listSubjectUsers(
    subjectId: number,
    role: MemberRole | undefined,
    { limit, offset }: Page,
  ) {
    // Built once and shared by the page query and the count query.
    const where = usersInSubject(role, subjectId);

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

/* -------------------------------------------------------------------------- */
/* Users (teachers / students)                                                */
/* -------------------------------------------------------------------------- */

// "Belongs to the subject" is expressed as EXISTS (a semi-join). Compared to
// join + GROUP BY <every user column> + COUNT(DISTINCT), it never multiplies
// rows, needs no de-duplication, and stops at the first match per user.

function usersInSubject(role: MemberRole | undefined, subjectId: number) {
  const teacherSubquery = db
    .select({ one: sql`1` })
    .from(classes)
    .where(
      and(eq(classes.teacherId, user.id), eq(classes.subjectId, subjectId)),
    );

  const studentSubquery = db
    .select({ one: sql`1` })
    .from(enrollments)
    .innerJoin(classes, eq(enrollments.classId, classes.id))
    .where(
      and(eq(enrollments.studentId, user.id), eq(classes.subjectId, subjectId)),
    );
  if (role === "teacher") {
    return and(eq(user.role, "teacher"), exists(teacherSubquery));
  }
  if (role === "student") {
    return and(eq(user.role, "student"), exists(studentSubquery));
  }

  // When no role is specified, return anyone who is a teacher OR a student in this subject
  return or(
    and(eq(user.role, "teacher"), exists(teacherSubquery)),
    and(eq(user.role, "student"), exists(studentSubquery)),
  );
}
