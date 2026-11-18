import { Request, Response } from "express";
import {
  classParams,
  createClassBody,
  listClassesQuery,
} from "../validation/classes.validation.js";
import {
  findOneWithClassId,
  insertClass,
} from "../services/classes.service.js";

import { listClasses } from "../services/classes.service.js";
import { buildPagination } from "../utils/utils.js";
import { HttpError } from "../middleware/error-handler.js";

export async function getClasses(req: Request, res: Response) {
  const { page, limit, search, subject, teacher } = listClassesQuery.parse(
    req.query,
  );

  const { rows, total } = await listClasses({
    page,
    limit,
    search,
    subject,
    teacher,
  });

  res
    .status(200)
    .json({ data: rows, pagination: buildPagination(page, limit, total) });
}

// Get class details (with subject, department and teacher)
export async function getClassDetails(req: Request, res: Response) {
  const { id } = classParams.parse(req.params);

  const details = await findOneWithClassId(id);
  if (!details) throw new HttpError(404, "Class not found");

  return res.status(200).json({
    data: details,
  });
}

export async function createClass(req: Request, res: Response) {
  const input = createClassBody.parse(req.body);

  const created = await insertClass({ ...input });

  res.status(201).json({ data: created });
}
