import { classesRepository } from "../repositories/classes.repository.js";
import { getOffset } from "../utils/utils.js";
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
