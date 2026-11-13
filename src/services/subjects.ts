import { GetSubjectsArgs } from "../validation/subjects.js";

import { subjectRepository } from "../repositories/subjects.repository.js";

type ListSubjectArgs = Omit<GetSubjectsArgs, "page"> & { offset: number };

/* -------------------------------------------------------------------------- */
/* Subjects                                                                   */
/* -------------------------------------------------------------------------- */

export async function listSubjects({
  search,
  department,
  limit,
  offset,
}: ListSubjectArgs) {
  const { rows, total } = await subjectRepository.findManyWithDepartment({
    search,
    department,
    limit,
    offset,
  });

  return { rows, total };
}
