import { classesRepository } from "../repositories/classes.repository.js";
import { buildPagination, getOffset } from "../utils/utils.js";
import {
  CreateClassInput,
  ListClassArgs,
} from "../validation/classes.validation.js";

/* -------------------------------------------------------------------------- */
/* List class                                                               */
/* -------------------------------------------------------------------------- */
export async function listClasses({
  teacher,
  subject,
  search,
  page,
  limit,
}: ListClassArgs) {
  return classesRepository.findManyWithFilter({
    teacher,
    subject,
    search,
    offset: getOffset(page, limit),
    limit,
  });
}

/* -------------------------------------------------------------------------- */
/* get class with id                                                          */
/* -------------------------------------------------------------------------- */

export async function findOneWithClassId(classId: number) {
  return classesRepository.findOneWithClassId(classId);
}

/* -------------------------------------------------------------------------- */
/* Create class                                                               */
/* -------------------------------------------------------------------------- */

export async function insertClass({
  name,
  teacherId,
  subjectId,
  status,
  capacity,
  description,
  bannerUrl,
  bannerCldPubId,
  schedules,
}: CreateClassInput) {
  return classesRepository.createClass({
    name,
    teacherId,
    subjectId,
    status,
    capacity,
    description,
    bannerUrl,
    bannerCldPubId,
    schedules,
  });
}

/* -------------------------------------------------------------------------- */
/* List users in a class by role with pagination                              */
/* -------------------------------------------------------------------------- */

export async function listClassUsers({
  classId,
  role,
  page,
  limit,
}: {
  classId: number;
  role: MemberRole;
  page: number;
  limit: number;
}) {
  const { rows, total } = await classesRepository.listClassUsers(
    classId,
    role,
    {
      limit,
      offset: getOffset(page, limit),
    },
  );

  return {
    rows,
    pagination: buildPagination(page, limit, total),
  };
}
