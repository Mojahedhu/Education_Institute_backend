import { count, desc, eq, getTableColumns, ilike, or } from "drizzle-orm";
import { escapeLike, totalOf } from "../utils/utils.js";
import { departments, subjects } from "../db/schema/app.js";
import { db } from "../db/index.js";

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
};
