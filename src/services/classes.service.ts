import { classesRepository } from "../repositories/classes.repository.js";
import { CreateClassInput } from "../validation/classes.validation.js";

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
