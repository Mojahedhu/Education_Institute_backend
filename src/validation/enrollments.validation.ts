import { z } from "zod";

// User ids are strings (not numbers like the other tables).
const studentId = z.string().trim().min(1);

export const createEnrollmentBody = z.object({
  classId: z.coerce.number().int().positive(),
  studentId,
});

export const joinClassBody = z.object({
  inviteCode: z.string().trim().min(1).max(64),
  studentId,
});
