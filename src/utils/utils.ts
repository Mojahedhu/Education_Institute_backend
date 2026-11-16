import { randomInt } from "node:crypto";

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

export const isMemberRole = (role: string): role is MemberRole =>
  role === "teacher" || role === "student";

// Invite codes grant access to a class, so they come from a cryptographically
// secure generator (Math.random is predictable). Same format as before:
// 7 lowercase alphanumeric characters.
const INVITE_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

export const generateInviteCode = (length = 7) => {
  return Array.from(
    { length },
    () => INVITE_ALPHABET[randomInt(INVITE_ALPHABET.length)],
  ).join("");
};
