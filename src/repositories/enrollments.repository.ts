import { and, eq, getTableColumns, SQL } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  classes,
  departments,
  enrollments,
  subjects,
} from "../db/schema/app.js";
import { user } from "../db/schema/auth.js";
import { HttpError } from "../middleware/error-handler.js";

export const enrollmentsRepository = {
  /* -------------------------------------------------------------------------- */
  /* Enrollment details                                                         */
  /* -------------------------------------------------------------------------- */
  // `enrollments` has no id column: its primary key is the pair
  // (student_id, class_id), so a row is identified by that pair.
  async getEnrollmentDetails(classId: number, studentId: string) {
    const [record] = await db
      .select({
        ...getTableColumns(enrollments),
        class: getTableColumns(classes),
        subject: getTableColumns(subjects),
        department: getTableColumns(departments),
        teacher: getTableColumns(user),
      })
      .from(enrollments)
      .leftJoin(classes, eq(enrollments.classId, classes.id))
      .leftJoin(subjects, eq(classes.subjectId, subjects.id))
      .leftJoin(departments, eq(subjects.departmentId, departments.id))
      .leftJoin(user, eq(classes.teacherId, user.id))
      .where(
        and(
          eq(enrollments.classId, classId),
          eq(enrollments.studentId, studentId),
        ),
      )
      .limit(1);

    if (!record) {
      throw new Error(
        `Enrollment (class ${classId}, student ${studentId}) not found right after insert`,
      );
    }
    return record;
  },

  /* -------------------------------------------------------------------------- */
  /* Enroll in class using class ID                                             */
  /* -------------------------------------------------------------------------- */
  enrollStudentInClass(classId: number, studentId: string) {
    return enroll(eq(classes.id, classId), studentId);
  },

  /* -------------------------------------------------------------------------- */
  /* Enroll in class using invite code                                          */
  /* -------------------------------------------------------------------------- */

  enrollStudentByInviteCode(inviteCode: string, studentId: string) {
    return enroll(eq(classes.inviteCode, inviteCode), studentId);
  },
};

// Shared by both entry points; they differ only in how the class is found.
async function enroll(classFilter: SQL, studentId: string) {
  // One query answers all three questions the old code asked separately
  // (class exists? student exists? already enrolled?): the class row is the
  // anchor, and the student and any existing enrollment are left-joined on.
  // The enrollment lookup is a primary-key hit on (student_id, class_id).
  const [found] = await db
    .select({
      classId: classes.id,
      existingStudentId: user.id,
      studentRole: user.role,
      existingEnrollmentClassId: enrollments.classId,
    })
    .from(classes)
    .leftJoin(user, eq(user.id, studentId))
    .leftJoin(
      enrollments,
      and(
        eq(enrollments.classId, classes.id),
        eq(enrollments.studentId, studentId),
      ),
    )
    .where(classFilter)
    .limit(1);

  // Same order of checks (and messages) as before.
  if (!found) throw new HttpError(404, "Class not found");
  if (!found.existingStudentId) throw new HttpError(404, "Student not found");
  if (found.studentRole !== "student") {
    throw new HttpError(403, "Only students can enroll in a class");
  }
  if (found.existingEnrollmentClassId !== null) {
    throw new HttpError(409, "Student already enrolled in class");
  }

  // The checks above can't see a request that is still in flight. The
  // composite primary key makes the insert itself the source of truth:
  // ON CONFLICT DO NOTHING returns no row if another request won the race.
  const [created] = await db
    .insert(enrollments)
    .values({ classId: found.classId, studentId })
    .onConflictDoNothing()
    .returning({ classId: enrollments.classId });

  if (!created) throw new HttpError(409, "Student already enrolled in class");

  return enrollmentsRepository.getEnrollmentDetails(found.classId, studentId);
}
