import { departmentRepository } from "../repositories/departments.repository.js";

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
