import { Request, Response } from "express";
import {
  createSubjectBody,
  listSubjectsQuery,
  listSubjectUsersQuery,
  subjectParams,
} from "../validation/subjects.validation.js";
import { buildPagination, getOffset } from "../utils/utils.js";
import {
  getSubjectById,
  insertNewSubject,
  listSubjectClasses,
  listSubjects,
  listSubjectUsers,
} from "../services/subjects.service.js";
import { HttpError } from "../middleware/error-handler.js";
import { paginationQuery } from "../validation/common.validation.js";

// Get all subjects with optional search, filter, and pagination
export async function getSubjects(req: Request, res: Response) {
  const { page, limit, search, department } = listSubjectsQuery.parse(
    req.query,
  );

  const { rows, total } = await listSubjects({
    search,
    department,
    limit,
    offset: getOffset(page, limit),
  });

  res.status(200).json({
    data: rows,
    pagination: buildPagination(page, limit, total),
  });
}

// Create Subject
export async function createSubject(req: Request, res: Response) {
  const input = createSubjectBody.parse(req.body);

  const created = await insertNewSubject(input);

  res.status(201).json({ data: created });
}

// Get subject details with counts
export async function getSubjectDetails(req: Request, res: Response) {
  const { id } = subjectParams.parse(req.params);

  const details = await getSubjectById(id);
  if (!details) throw new HttpError(404, "Subject not found");

  return res.status(200).json({ data: details });
}

// List classes in a subject with pagination
export async function getSubjectClasses(req: Request, res: Response) {
  const { id } = subjectParams.parse(req.params);
  const { page, limit } = paginationQuery.parse(req.query);

  const { rows, total } = await listSubjectClasses(id, { page, limit });

  return res
    .status(200)
    .json({ data: rows, pagination: buildPagination(page, limit, total) });
}

// List users in a subject by role with pagination
export async function getSubjectUsers(req: Request, res: Response) {
  const { id } = subjectParams.parse(req.params);
  const { role, page, limit } = listSubjectUsersQuery.parse(req.query);

  const { rows, total } = await listSubjectUsers(id, role as MemberRole, {
    page,
    limit,
  });

  res
    .status(200)
    .json({ data: rows, pagination: buildPagination(page, limit, total) });
}
