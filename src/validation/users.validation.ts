import { z } from "zod";

import { user } from "../db/schema/index.js";
import { optionalText, pagination } from "./common.validation.js";

// Derived from the schema so the accepted roles can't drift from the DB enum.
// (Assumes user.role is an enum column, as the old `role as UserRoles` cast
// suggests. If it isn't, replace this with an explicit z.enum([...]).)
const roles = user.role.enumValues;

// User ids are strings (not numbers like the other tables).
export const userParams = z.object({
  id: z.string().trim().min(1, "id is required"),
});

export const listUsersQuery = z.object({
  ...pagination,
  search: optionalText,
  role: z.enum(roles).optional(),
});

export type GetUsersArgs = z.infer<typeof listUsersQuery>;
