import { Request, Response } from "express";
import { listUsersQuery, userParams } from "../validation/users.validation.js";
import {
  getUserById,
  listUserDepartments,
  listUsers,
  listUserSubjects,
} from "../services/users.service.js";
import { buildPagination, getOffset } from "../utils/utils.js";
import { HttpError } from "../middleware/error-handler.js";
import { paginationQuery } from "../validation/common.validation.js";

// Users list
export async function getUsers(req: Request, res: Response) {
  const { page, limit, search, role } = listUsersQuery.parse(req.query);
  const offset = getOffset(page, limit);
  const { rows, total } = await listUsers({ search, role, limit, offset });
  res
    .status(200)
    .json({ data: rows, pagination: buildPagination(page, limit, total) });
}

// User details
export async function getUserDetails(req: Request, res: Response) {
  const { id } = userParams.parse(req.params);

  const record = await getUserById(id);

  if (!record) throw new HttpError(404, "User not found");

  return res.status(200).json({ data: record });
}

// List departments associated with a user
export async function getUserDepartments(req: Request, res: Response) {
  const { id } = userParams.parse(req.params);
  const { page, limit } = paginationQuery.parse(req.query);

  const result = await listUserDepartments({
    id,
    page,
    limit,
  });
  if (!result) throw new HttpError(404, "User not found");

  res.status(200).json({
    data: result.rows,
    pagination: buildPagination(page, limit, result.total),
  });
}

// List subjects associated with a user
export async function getUserSubjects(req: Request, res: Response) {
  const { id } = userParams.parse(req.params);
  const { page, limit } = paginationQuery.parse(req.query);

  const result = await listUserSubjects({
    id,
    page,
    limit,
  });
  if (!result) throw new HttpError(404, "User not found");

  res.status(200).json({
    data: result.rows,
    pagination: buildPagination(page, limit, result.total),
  });
}
