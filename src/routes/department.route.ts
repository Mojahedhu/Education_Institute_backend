import express from "express";
import { getDepartments } from "../controller/departments.controller.js";

const departmentRouter = express.Router();

departmentRouter.get("/", getDepartments);

export { departmentRouter };
