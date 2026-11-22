import { z } from "zod";
import { optionalText, pagination } from "./common.validation.js";

export const subjectParams = z.object({
  id: z.coerce.number().int().positive(),
});

export const listSubjectsQuery = z.object({
  ...pagination,
  search: optionalText,
  department: optionalText,
});

export const listSubjectUsersQuery = z.object({
  ...pagination,
  role: z.enum(["student", "teacher"]).optional(),
});
// Adjust the max lengths to match your column definitions.
export const createSubjectBody = z.object({
  departmentId: z.coerce.number().int().positive(),
  code: z.string().trim().min(1).max(50),
  name: z.string().trim().min(1).max(255),
  description: z.string().trim().optional(),
});

export type CreateSubjectInput = z.infer<typeof createSubjectBody>;

export type GetSubjectsArgs = z.infer<typeof listSubjectsQuery>;
