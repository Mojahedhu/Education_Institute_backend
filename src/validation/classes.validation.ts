import { z } from "zod";

import { classes } from "../db/schema/index.js";
import { optionalText, pagination } from "./common.validation.js";

export const classParams = z.object({
  id: z.coerce.number().int().positive(),
});

export const listClassesQuery = z.object({
  ...pagination,
  search: optionalText,
  subject: optionalText,
  teacher: optionalText,
});

export const listUsersQuery = z.object({
  ...pagination,
  role: z.enum(["teacher", "student"]),
});

const scheduleSchema = z.object({
  day: z.string().min(1, "Day is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
});

// Adjust the limits to match your column definitions (and add .url() to
// bannerUrl if it must always be a full URL).
export const createClassBody = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Class name must be at least 2 characters")
    .max(50, "Class name must be at most 50 characters"),
  description: z
    .string("Description is required")
    .min(5, "Description must be at least 5 characters"),
  subjectId: z.coerce
    .number("Subject id is required")
    .min(1, "Subject id must be at least 1 token"),
  teacherId: z.string().trim().min(1, "Teacher id must be at least 1"),
  capacity: z.coerce
    .number("Capacity is required")
    .min(1, "Capacity must be at least 1"),
  status: z.enum(["active", "inactive"]),
  bannerUrl: z.url(),

  // .string( "Class banner is required" )
  // .min(1, "Class banner must be at least 1"),
  bannerCldPubId: z
    .string("Banner reference is required")
    .min(1, "Banner reference must be at least 1"),
  inviteCode: z.string().optional(),
  schedules: z.array(scheduleSchema).optional(),
});

export type CreateClassInput = z.infer<typeof createClassBody>;
