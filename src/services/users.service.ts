import { HttpError } from "../middleware/error-handler.js";
import { userRepository } from "../repositories/users.repository.js";
import { getOffset } from "../utils/utils.js";
import { GetUsersArgs } from "../validation/users.validation.js";

type ListUsersArgs = Omit<GetUsersArgs, "page"> & { offset: number };

/* -------------------------------------------------------------------------- */
/* Users                                                                      */
/* -------------------------------------------------------------------------- */
export async function listUsers({
  search,
  role,
  limit,
  offset,
}: ListUsersArgs) {
  return await userRepository.findManyWithFilters({
    search,
    role,
    limit,
    offset,
  });
}

/* -------------------------------------------------------------------------- */
/* User details by Id                                                         */
/* -------------------------------------------------------------------------- */

export async function getUserById(userId: string) {
  return await userRepository.findOneById(userId);
}

/* -------------------------------------------------------------------------- */
/* List departments associated with a user                                    */
/* -------------------------------------------------------------------------- */

export async function listUserDepartments({
  id,
  page,
  limit,
}: {
  id: string;
  page: number;
  limit: number;
}) {
  return await userRepository.listUserDepartments(id, {
    limit,
    offset: getOffset(page, limit),
  });
}

/* -------------------------------------------------------------------------- */
/* List subjects associated with a user                                       */
/* -------------------------------------------------------------------------- */

export async function listUserSubjects({
  id,
  page,
  limit,
}: {
  id: string;
  page: number;
  limit: number;
}) {
  return await userRepository.listUserSubjects(id, {
    limit,
    offset: getOffset(page, limit),
  });
}
