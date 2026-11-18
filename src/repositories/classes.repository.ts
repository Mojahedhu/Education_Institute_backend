import {
  and,
  count,
  desc,
  eq,
  getTableColumns,
  ilike,
  inArray,
  or,
  SQL,
} from "drizzle-orm";
import { db } from "../db/index.js";
import { classes, departments, subjects } from "../db/schema/app.js";
import { escapeLike, generateInviteCode, totalOf } from "../utils/utils.js";
import { CreateClassInput } from "../validation/classes.validation.js";
import { user } from "../db/schema/auth.js";

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
};
