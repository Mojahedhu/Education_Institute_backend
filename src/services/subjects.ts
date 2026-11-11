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
import { escapeLike, totalOf } from "../utils/utils.js";
import { GetSubjectsArgs } from "../validation/subjects.js";
import { departments, subjects } from "../db/schema/schema.js";

type Page = { limit: number; offset: number };
type ListSubjectArgs = Omit<GetSubjectsArgs, "page"> & { offset: number };

/* -------------------------------------------------------------------------- */
/* Subjects                                                                   */
/* -------------------------------------------------------------------------- */

export async function listSubjects({
  search,
  department,
  limit,
  offset,
}: ListSubjectArgs) {
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
      // id is a tie-breaker so pages never overlap or skip rows
      .orderBy(desc(subjects.createdAt), desc(subjects.id))
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(subjects).where(where),
  ]);

  return { rows, total: totalOf(totalRows) };
}
