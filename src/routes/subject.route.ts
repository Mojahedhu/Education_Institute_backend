import express from "express";
import {
  createSubject,
  getSubjectClasses,
  getSubjectDetails,
  getSubjects,
  getSubjectUsers,
} from "../controller/subjects.controller.js";

const subjectRouter = express.Router();

// Get all subjects with optional search, department filer, and pagination.
subjectRouter.get("/", getSubjects);
subjectRouter.post("/", createSubject);
subjectRouter.get("/:id", getSubjectDetails);
subjectRouter.get("/:id/classes", getSubjectClasses);
subjectRouter.get("/:id/users", getSubjectUsers);

export default subjectRouter;

// Public / General discovery
// subjectRouter.get("/", getSubjects);
// subjectRouter.get("/:id", getSubjectDetails);
// Protected: Only authenticated institute members can see rosters and class details
// subjectRouter.get("/:id/classes", requireAuth, getSubjectClasses);
// subjectRouter.get("/:id/users", requireAuth, getSubjectUsers);
// Protected: Only admins can create subjects
// subjectRouter.post("/", requireAuth, requireRole("admin"), createSubject);
