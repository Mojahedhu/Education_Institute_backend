import { Request, Response } from "express";
import { listUsersQuery, userParams } from "../validation/users.validation.js";
import { getUserById, listUsers } from "../services/users.service.js";
import { buildPagination, getOffset } from "../utils/utils.js";
import { HttpError } from "../middleware/error-handler.js";

export async function getUsers(req: Request, res: Response) {
  const { page, limit, search, role } = listUsersQuery.parse(req.query);
  const offset = getOffset(page, limit);
  const { rows, total } = await listUsers({ search, role, limit, offset });
  res
    .status(200)
    .json({ data: rows, pagination: buildPagination(page, limit, total) });
}

export async function getUserDetails(req: Request, res: Response) {
  const { id } = userParams.parse(req.params);

  const record = await getUserById(id);

  if (!record) throw new HttpError(404, "User not found");

  return res.status(200).json({ data: record });
}
