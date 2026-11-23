import { departmentRepository } from "../repositories/departments.repository.js";
import { buildPagination, getOffset } from "../utils/utils.js";
import { CreateDepartmentInput } from "../validation/departments.validation.js";

/* -------------------------------------------------------------------------- */
/* Departments                                                                */
/* -------------------------------------------------------------------------- */
export async function listDepartments({
  search,
  limit,
  offset,
}: {
  search?: string | undefined;
  limit: number;
  offset: number;
}) {
  return departmentRepository.listDepartments({ search, limit, offset });
}

/* -------------------------------------------------------------------------- */
/* Department details with counts                                     */
/* -------------------------------------------------------------------------- */
export async function getDepartmentWithId(departmentId: number) {
  return departmentRepository.getDepartmentDetails(departmentId);
}

/* -------------------------------------------------------------------------- */
/* Create department                                                          */
/* -------------------------------------------------------------------------- */
export async function insertOne(input: CreateDepartmentInput) {
  return departmentRepository.createDepartment(input);
}

/* -------------------------------------------------------------------------- */
/* List subjects in a department with pagination                              */
/* -------------------------------------------------------------------------- */

export async function listDepartmentSubjects({
  id,
  page,
  limit,
}: {
  id: number;
  page: number;
  limit: number;
}) {
  const { rows, total } = await departmentRepository.listDepartmentSubjects(
    id,
    { limit, offset: getOffset(page, limit) },
  );

  return { rows, pagination: buildPagination(page, limit, total) };
}

/* -------------------------------------------------------------------------- */
/* List classes in a department with pagination                               */
/* -------------------------------------------------------------------------- */

export async function listDepartmentClasses({
  id,
  page,
  limit,
}: {
  id: number;
  page: number;
  limit: number;
}) {
  const { rows, total } = await departmentRepository.listDepartmentClasses(id, {
    limit,
    offset: getOffset(page, limit),
  });

  return { rows, pagination: buildPagination(page, limit, total) };
}

/* -------------------------------------------------------------------------- */
/* List users in a department by role with pagination                               */
/* -------------------------------------------------------------------------- */

export async function listDepartmentUsers({
  id,
  role,
  page,
  limit,
}: {
  id: number;
  role?: MemberRole | undefined;
  page: number;
  limit: number;
}) {
  const { rows, total } = await departmentRepository.listDepartmentUsers(
    id,
    role,
    {
      limit,
      offset: getOffset(page, limit),
    },
  );

  return { rows, pagination: buildPagination(page, limit, total) };
}
