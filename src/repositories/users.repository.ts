import { and, count, desc, eq, ilike, or, SQL } from "drizzle-orm";
import { user } from "../db/schema/auth.js";
import { escapeLike, totalOf } from "../utils/utils.js";
import { db } from "../db/index.js";

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
  /** Returns null when the user does not exist. */
  async findUserById(userId: string) {
    const [record] = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    return record ?? null;
  },
};
