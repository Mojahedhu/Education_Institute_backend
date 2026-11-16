import { Request, Response } from "express";
import { listUsersQuery } from "../validation/users.validation.js";
import { listUsers } from "../services/users.service.js";
import { buildPagination, getOffset } from "../utils/utils.js";

export async function getUsers(req: Request, res: Response) {
  const { page, limit, search, role } = listUsersQuery.parse(req.query);
  const offset = getOffset(page, limit);
  const { rows, total } = await listUsers({ search, role, limit, offset });
  res
    .status(200)
    .json({ data: rows, pagination: buildPagination(page, limit, total) });
}
