import { Request, Response } from "express";
import { createClassBody } from "../validation/classes.validation.js";
import { insertClass } from "../services/classes.service.js";

export async function createClass(req: Request, res: Response) {
  const input = createClassBody.parse(req.body);

  const created = await insertClass({ ...input });

  res.status(201).json({ data: created });
}
