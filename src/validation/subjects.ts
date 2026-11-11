import { z } from "zod";

const pagination = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
};

// Trimmed string where "" counts as "not provided".
const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined);

export const subjectParams = z.object({
  id: z.coerce.number().int().positive(),
});

export const paginationQuery = z.object(pagination);

export const listSubjectsQuery = z.object({
  ...pagination,
  search: optionalText,
  department: optionalText,
});

export const listUsersQuery = z.object({
  ...pagination,
  role: z.enum(["teacher", "student"]),
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
