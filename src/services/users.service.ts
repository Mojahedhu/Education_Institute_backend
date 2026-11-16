import { userRepository } from "../repositories/users.repository.js";
import { GetUsersArgs } from "../validation/users.validation.js";

type ListUsersArgs = Omit<GetUsersArgs, "page"> & { offset: number };

/* -------------------------------------------------------------------------- */
/* Users                                                                   */
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
