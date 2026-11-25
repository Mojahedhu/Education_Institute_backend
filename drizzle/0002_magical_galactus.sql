ALTER TABLE "enrollments" DROP CONSTRAINT IF EXISTS "enrollments_student_id_class_id_unique";--> statement-breakpoint
DROP INDEX IF EXISTS "enrollments_student_id_idx";