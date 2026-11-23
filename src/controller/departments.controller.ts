import { Request, Response } from "express";
import {
  createDepartmentBody,
  departmentParams,
  listDepartmentsQuery,
  listDepartmentUsersQuery,
} from "../validation/departments.validation.js";
import {
  getDepartmentWithId,
  insertOne,
  listDepartmentClasses,
  listDepartments,
  listDepartmentSubjects,
  listDepartmentUsers,
} from "../services/departments.service.js";
import { buildPagination, getOffset } from "../utils/utils.js";
import { HttpError } from "../middleware/error-handler.js";
import { paginationQuery } from "../validation/common.validation.js";

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

// Create department
export async function createDepartment(req: Request, res: Response) {
  const input = createDepartmentBody.parse(req.body);

  const created = await insertOne(input);

  return res.status(201).json({ data: created });
}

// Get department details with counts
export async function getDepartmentDetails(req: Request, res: Response) {
  const { id } = departmentParams.parse(req.params);

  const details = await getDepartmentWithId(id);
  if (!details) throw new HttpError(404, "Department not found");

  res.status(200).json({ data: details });
}

// List subjects in a department with pagination
export async function getDepartmentSubjects(req: Request, res: Response) {
  const { id } = departmentParams.parse(req.params);
  const { page, limit } = paginationQuery.parse(req.query);

  const { rows, pagination } = await listDepartmentSubjects({
    id,
    page,
    limit,
  });

  res.status(200).json({
    data: rows,
    pagination,
  });
}

// List classes in a department with pagination
export async function getDepartmentClasses(req: Request, res: Response) {
  const { id } = departmentParams.parse(req.params);
  const { page, limit } = paginationQuery.parse(req.query);

  const { rows, pagination } = await listDepartmentClasses({ page, limit, id });

  res.status(200).json({
    data: rows,
    pagination,
  });
}

// List users in a department by role with pagination
export async function getDepartmentUsers(req: Request, res: Response) {
  const { id } = departmentParams.parse(req.params);
  const { role, page, limit } = listDepartmentUsersQuery.parse(req.query);

  const { rows, pagination } = await listDepartmentUsers({
    role,
    id,
    page,
    limit,
  });

  res.status(200).json({
    data: rows,
    pagination,
  });
}
