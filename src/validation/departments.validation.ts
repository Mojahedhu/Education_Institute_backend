import { z } from "zod";
import { pagination } from "./common.validation.js";

export const departmentParams = z.object({
  id: z.coerce.number().int().positive(),
});

export const paginationQuery = z.object(pagination);

export const listDepartmentsQuery = z.object({
  ...pagination,
  search: z
    .string()
    .trim()
    .optional()
    .transform((value) => value || undefined),
});

export const listDepartmentUsersQuery = z.object({
  ...pagination,
  role: z.enum(["teacher", "student"]),
});

// Adjust the max lengths to match your column definitions.
export const createDepartmentBody = z.object({
  code: z.string().trim().min(1).max(50),
  name: z.string().trim().min(1).max(255),
  description: z.string().trim().optional(),
});

export type CreateDepartmentInput = z.infer<typeof createDepartmentBody>;
