export function getOffset(page: number, limit: number) {
  return (page - 1) * limit;
}

export function buildPagination(page: number, limit: number, total: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * `count()` from drizzle maps the bigint Postgres returns to a JS number.
 */

export const totalOf = (rows: { total: number }[]) => rows[0]?.total ?? 0;

/** Escapes %, _ and \ so user input is matched literally inside LIKE / ILIKE. */
export const escapeLike = (value: string) => value.replace(/[\\%_]/g, "\\$&");
