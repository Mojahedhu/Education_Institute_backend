import { Request, Response } from "express";
import {
  createClassBody,
  listClassesQuery,
} from "../validation/classes.validation.js";
import { insertClass } from "../services/classes.service.js";

import { listClasses } from "../services/classes.service.js";
import { buildPagination } from "../utils/utils.js";

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

export async function createClass(req: Request, res: Response) {
  const input = createClassBody.parse(req.body);

  const created = await insertClass({ ...input });

  res.status(201).json({ data: created });
}
