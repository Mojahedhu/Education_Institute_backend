import {
  CreateSubjectInput,
  GetSubjectsArgs,
} from "../validation/subjects.validation.js";

import { subjectRepository } from "../repositories/subjects.repository.js";
import { getOffset } from "../utils/utils.js";

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

/* -------------------------------------------------------------------------- */
/* Subject details and Classes count per subject                              */
/* -------------------------------------------------------------------------- */
export async function insertNewSubject(input: CreateSubjectInput) {
  return await subjectRepository.createSubject(input);
}

/* -------------------------------------------------------------------------- */
/* Subject details and Classes count per subject                              */
/* -------------------------------------------------------------------------- */

export async function getSubjectById(subjectId: number) {
  return await subjectRepository.findById(subjectId);
}

/* -------------------------------------------------------------------------- */
/* List classes in a subject with pagination                                  */
/* -------------------------------------------------------------------------- */
export async function listSubjectClasses(
  subjectId: number,
  { page, limit }: PageQuery,
) {
  return await subjectRepository.listSubjectClasses(subjectId, {
    limit,
    offset: getOffset(page, limit),
  });
}

/* -------------------------------------------------------------------------- */
/* List users in a subject by role with pagination                                  */
/* -------------------------------------------------------------------------- */

export async function listSubjectUsers(
  subjectId: number,
  role: MemberRole | undefined,
  { page, limit }: PageQuery,
) {
  return await subjectRepository.listSubjectUsers(subjectId, role, {
    limit,
    offset: getOffset(page, limit),
  });
}
