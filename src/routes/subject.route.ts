import express from "express";
import { getSubjects } from "../controller/subjects.controller.js";

const subjectRouter = express.Router();

// Get all subjects with optional search, department filer, and pagination.
subjectRouter.get("/", getSubjects);

export default subjectRouter;
