// src/repositories/subjects.repository.ts
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
import { departments, subjects } from "../db/schema/app.js";
import { escapeLike, totalOf } from "../utils/utils.js";

export interface FindSubjectsFilter {
  search?: string | undefined;
  department?: string | undefined;
  limit: number;
  offset: number;
}

export const subjectRepository = {
  async findManyWithDepartment({
    search,
    department,
    limit,
    offset,
  }: FindSubjectsFilter) {
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

  async findById(id: number) {
    const [row] = await db
      .select()
      .from(subjects)
      .where(eq(subjects.id, id))
      .limit(1);
    return row ?? null;
  },
};
