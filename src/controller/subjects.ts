import { Request, Response } from "express";

// Get all subjects with optional search, filter, and pagination

import { listSubjectsQuery } from "../validation/subjects.js";
import { buildPagination, getOffset } from "../utils/utils.js";
import { listSubjects } from "../services/subjects.js";

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
