import { db } from "../db/index.js";
import { classes } from "../db/schema/app.js";
import { generateInviteCode } from "../utils/utils.js";
import { CreateClassInput } from "../validation/classes.validation.js";

export const classesRepository = {
  /* -------------------------------------------------------------------------- */
  /* Create class                                                                */
  /* -------------------------------------------------------------------------- */

  async createClass(input: CreateClassInput) {
    const [created] = await db
      .insert(classes)
      .values({
        ...input,
        inviteCode: generateInviteCode(),
        schedules: [],
      })
      .returning({ id: classes.id });

    if (!created) throw new Error("Insert returned no row");
    return created;
  },
};
