import { z } from "zod";
import { optionalText, pagination } from "./common.validation.js";

export const subjectParams = z.object({
  id: z.coerce.number().int().positive(),
});

export const paginationQuery = z.object(pagination);

export const listSubjectsQuery = z.object({
  ...pagination,
  search: optionalText,
  department: optionalText,
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
