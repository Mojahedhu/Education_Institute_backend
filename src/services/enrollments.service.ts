import { enrollmentsRepository } from "../repositories/enrollments.repository.js";

// Create enrollment
export async function insertEnrollment({
  classId,
  studentId,
}: {
  classId: number;
  studentId: string;
}) {
  return await enrollmentsRepository.enrollStudentInClass(classId, studentId);
}

// Join class by invite code
export async function joinClassService({
  inviteCode,
  studentId,
}: {
  inviteCode: string;
  studentId: string;
}) {
  return enrollmentsRepository.enrollStudentByInviteCode(inviteCode, studentId);
}
