import { Request, Response } from "express";
import { listDepartmentsQuery } from "../validation/departments.validation.js";
import { listDepartments } from "../services/departments.service.js";
import { buildPagination, getOffset } from "../utils/utils.js";

// Get all departments
export async function getDepartments(req: Request, res: Response) {
  const { search, limit, page } = listDepartmentsQuery.parse(req.query);

  const { rows, total } = await listDepartments({
    search,
    limit,
    offset: getOffset(page, limit),
  });

  res
    .status(200)
    .json({ data: rows, pagination: buildPagination(page, limit, total) });
}
