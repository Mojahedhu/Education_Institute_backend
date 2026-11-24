import {
  and,
  count,
  desc,
  eq,
  exists,
  getTableColumns,
  ilike,
  or,
  sql,
  SQL,
} from "drizzle-orm";
import { user } from "../db/schema/auth.js";
import { escapeLike, isMemberRole, totalOf } from "../utils/utils.js";
import { db } from "../db/index.js";
import {
  classes,
  departments,
  enrollments,
  subjects,
} from "../db/schema/app.js";

export const userRepository = {
  /* -------------------------------------------------------------------------- */
  /* Users                                                                      */
  /* -------------------------------------------------------------------------- */
  async findManyWithFilters({
    search,
    role,
    limit,
    offset,
  }: Page & { search?: string | undefined; role?: UserRole | undefined }) {
    const conditions: (SQL | undefined)[] = [];

    if (search) {
      const pattern = `%${escapeLike(search)}%`;
      conditions.push(
        or(ilike(user.name, pattern), ilike(user.email, pattern)),
      );
    }

    if (role) {
      conditions.push(eq(user.role, role));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    // The page and the total are independent, so run them concurrently.
    const [rows, totalRows] = await Promise.all([
      db
        .select()
        .from(user)
        .where(where)
        // id is a tie-breaker so pages never overlap or skip rows
        .orderBy(desc(user.createdAt), desc(user.id))
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(user).where(where),
    ]);

    return { rows, total: totalOf(totalRows) };
  },

  /* -------------------------------------------------------------------------- */
  /* User details                                                               */
  /* -------------------------------------------------------------------------- */
  /** Returns null when the user does not exist. */
  async findOneById(userId: string) {
    const [record] = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    return record ?? null;
  },

  /* -------------------------------------------------------------------------- */
  /* Departments / subjects a user is associated with                           */
  /* -------------------------------------------------------------------------- */

  // "Associated with" is expressed as EXISTS (a semi-join). Compared to a
  // left-join chain + GROUP BY <every column> + COUNT(DISTINCT), it never
  // multiplies rows, needs no de-duplication, and stops at the first match.
  //
  //   teacher: teaches at least one class in it
  //   student: is enrolled in at least one class in it

  /** Returns null when the user does not exist. */
  async listUserDepartments(userId: string, { limit, offset }: Page) {
    const role = await findUserRole(userId);
    if (!role) return null;

    // Other roles (e.g. admin) aren't tied to departments through classes.
    if (!isMemberRole(role)) return { rows: [], total: 0 };

    const where = departmentsOfUser(role, userId);

    const [rows, totalRows] = await Promise.all([
      db
        .select()
        .from(departments)
        .where(where)
        .orderBy(desc(departments.createdAt), desc(departments.id))
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(departments).where(where),
    ]);

    return { rows, total: totalOf(totalRows) };
  },

  /** Returns null when the user does not exist. */
  async listUserSubjects(userId: string, { limit, offset }: Page) {
    const role = await findUserRole(userId);
    if (!role) return null;

    if (!isMemberRole(role)) return { rows: [], total: 0 };

    const where = subjectsOfUser(role, userId);

    const [rows, totalRows] = await Promise.all([
      db
        .select({
          ...getTableColumns(subjects),
          department: getTableColumns(departments),
        })
        .from(subjects)
        // Use innerJoin here if subjects.departmentId is NOT NULL.
        .leftJoin(departments, eq(subjects.departmentId, departments.id))
        .where(where)
        .orderBy(desc(subjects.createdAt), desc(subjects.id))
        .limit(limit)
        .offset(offset),
      // the count doesn't need the departments join
      db.select({ total: count() }).from(subjects).where(where),
    ]);

    return { rows, total: totalOf(totalRows) };
  },
};

// Only the role is needed to decide which relation to follow.
async function findUserRole(userId: string) {
  const [record] = await db
    .select({ role: user.role })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  return record?.role ?? null;
}

function departmentsOfUser(role: MemberRole, userId: string) {
  return exists(
    role === "teacher"
      ? db
          .select({ one: sql`1` })
          .from(subjects)
          .innerJoin(classes, eq(classes.subjectId, subjects.id))
          .where(
            and(
              eq(subjects.departmentId, departments.id),
              eq(classes.teacherId, userId),
            ),
          )
      : db
          .select({ one: sql`1` })
          .from(subjects)
          .innerJoin(classes, eq(classes.subjectId, subjects.id))
          .innerJoin(enrollments, eq(enrollments.classId, classes.id))
          .where(
            and(
              eq(subjects.departmentId, departments.id),
              eq(enrollments.studentId, userId),
            ),
          ),
  );
}

function subjectsOfUser(role: MemberRole, userId: string) {
  return exists(
    role === "teacher"
      ? db
          .select({ one: sql`1` })
          .from(classes)
          .where(
            and(
              eq(classes.subjectId, subjects.id),
              eq(classes.teacherId, userId),
            ),
          )
      : db
          .select({ one: sql`1` })
          .from(classes)
          .innerJoin(enrollments, eq(enrollments.classId, classes.id))
          .where(
            and(
              eq(classes.subjectId, subjects.id),
              eq(enrollments.studentId, userId),
            ),
          ),
  );
}
