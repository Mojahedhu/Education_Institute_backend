import express from "express";
import { getSubjects } from "../controller/subjects.js";

const subjectRouter = express.Router();

subjectRouter.get("/", getSubjects);

export default subjectRouter;
