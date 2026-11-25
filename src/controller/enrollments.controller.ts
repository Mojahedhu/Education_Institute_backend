import type { Request, Response } from "express";

import {
  createEnrollmentBody,
  joinClassBody,
} from "../validation/enrollments.validation.js";
import {
  insertEnrollment,
  joinClassService,
} from "../services/enrollments.service.js";

// Create enrollment
export async function createEnrollment(req: Request, res: Response) {
  const { classId, studentId } = createEnrollmentBody.parse(req.body);

  const enrollment = await insertEnrollment({ classId, studentId });

  res.status(201).json({ data: enrollment });
}

// Join class by invite code
export async function joinClass(req: Request, res: Response) {
  const { inviteCode, studentId } = joinClassBody.parse(req.body);

  const enrollment = await joinClassService({ inviteCode, studentId });

  res.status(201).json({ data: enrollment });
}
