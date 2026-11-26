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
import { escapeLike, generateInviteCode, totalOf } from "../utils/utils.js";
import { CreateClassInput } from "../validation/classes.validation.js";
import { user } from "../db/schema/auth.js";

const userColumns = {
  id: user.id,
  name: user.name,
  email: user.email,
  emailVerified: user.emailVerified,
  image: user.image,
  role: user.role,
  imageCldPubId: user.imageCldPubId,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
};

export const classesRepository = {
  /* -------------------------------------------------------------------------- */
  /* Get classes                                                                */
  /* -------------------------------------------------------------------------- */

  async findManyWithFilter({
    search,
    subject,
    teacher,
    limit,
    offset,
  }: Page & {
    search?: string | undefined;
    subject?: string | undefined;
    teacher?: string | undefined;
  }) {
    const conditions: (SQL | undefined)[] = [];

    if (search) {
      const pattern = `%${escapeLike(search)}%`;
      conditions.push(
        or(ilike(classes.name, pattern), ilike(classes.inviteCode, pattern)),
      );
    }

    // Filtering by subject / teacher name uses semi-joins (IN subquery) instead
    // of WHERE on joined tables. The filters live in one shared WHERE, and the
    // count query reads `classes` alone instead of joining subjects and user.
    if (subject) {
      conditions.push(
        inArray(
          classes.subjectId,
          db
            .select({ id: subjects.id })
            .from(subjects)
            .where(ilike(subjects.name, `%${escapeLike(subject)}%`)),
        ),
      );
    }

    if (teacher) {
      const pattern = `%${escapeLike(teacher)}%`;
      conditions.push(
        inArray(
          classes.teacherId,
          db
            .select({ id: user.id })
            .from(user)
            .where(ilike(user.name, pattern)),
        ),
      );
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    // The page and the total are independent, so run them concurrently.
    const [rows, totalRows] = await Promise.all([
      db
        .select({
          ...getTableColumns(classes),
          subject: getTableColumns(subjects),
          // teacher: getTableColumns(user),
          teacher: { id: user.id, name: user.name, image: user.image },
        })
        .from(classes)
        // Use innerJoin for either of these if the FK column is NOT NULL.
        .leftJoin(subjects, eq(classes.subjectId, subjects.id))
        .leftJoin(user, eq(classes.teacherId, user.id))
        .where(where)
        // id is a tie-breaker so pages never overlap or skip rows
        .orderBy(desc(classes.createdAt), desc(classes.id))
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(classes).where(where),
    ]);
    return { rows, total: totalOf(totalRows) };
  },

  /* -------------------------------------------------------------------------- */
  /* Get class Details                                                          */
  /* -------------------------------------------------------------------------- */

  // Return null when the class does not exist
  async findOneWithClassId(classId: number) {
    const [record] = await db
      .select({
        ...getTableColumns(classes),
        subject: getTableColumns(subjects),
        department: getTableColumns(departments),
        teacher: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        },
      })
      .from(classes)
      .leftJoin(subjects, eq(classes.subjectId, subjects.id))
      .leftJoin(departments, eq(subjects.departmentId, departments.id))
      .leftJoin(user, eq(classes.teacherId, user.id))
      .where(eq(classes.id, classId))
      .limit(1);

    return record ?? null;
  },

  /* -------------------------------------------------------------------------- */
  /* Create class                                                                */
  /* -------------------------------------------------------------------------- */

  async createClass(input: CreateClassInput) {
    const { schedules, ...rest } = input;
    const [created] = await db
      .insert(classes)
      .values({
        ...rest,
        inviteCode: generateInviteCode(),
        schedules: schedules ?? [],
      })
      .returning({ id: classes.id });

    if (!created) throw new Error("Insert returned no row");
    return created;
  },
  /* -------------------------------------------------------------------------- */
  /* Users (teacher / students) of a class                                      */
  /* -------------------------------------------------------------------------- */

  // "Belongs to the class" is expressed as EXISTS (a semi-join). Compared to
  // join + GROUP BY <every user column> + COUNT(DISTINCT), it never multiplies
  // rows and needs no de-duplication.
  async listClassUsers(
    classId: number,
    role: MemberRole,
    { limit, offset }: Page,
  ) {
    // Built once and shared by the page query and the count query.
    const where = usersInClass(role, classId);

    const [rows, totalRows] = await Promise.all([
      db
        .select(userColumns)
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

function usersInClass(role: MemberRole, classId: number) {
  const teacherMembership = db
    .select({ one: sql`1` })
    .from(classes)
    .where(and(eq(classes.teacherId, user.id), eq(classes.id, classId)));
  const studentMembership = db
    .select({ one: sql`1` })
    .from(enrollments)
    .where(
      and(eq(enrollments.studentId, user.id), eq(enrollments.classId, classId)),
    );

  if (role === "teacher") {
    return and(eq(user.role, "teacher"), exists(teacherMembership));
  }
  if (role === "student") {
    return and(eq(user.role, "student"), exists(studentMembership));
  }

  return or(
    and(eq(user.role, "teacher"), exists(teacherMembership)),
    and(eq(user.role, "student"), exists(studentMembership)),
  );
}
