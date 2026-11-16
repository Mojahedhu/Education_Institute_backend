import { z } from "zod";

// Spread into a z.object() together with endpoint-specific fields.
export const pagination = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
};

export const paginationQuery = z.object(pagination);

// Trimmed string where "" counts as "not provided".
export const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => value || undefined);
