import express from "express";
import {
  createDepartment,
  getDepartmentClasses,
  getDepartmentDetails,
  getDepartments,
  getDepartmentSubjects,
  getDepartmentUsers,
} from "../controller/departments.controller.js";

const departmentRouter = express.Router();

departmentRouter.get("/", getDepartments);

departmentRouter.post("/", createDepartment);
departmentRouter.get("/:id", getDepartmentDetails);
departmentRouter.get("/:id/subjects", getDepartmentSubjects);
departmentRouter.get("/:id/classes", getDepartmentClasses);
departmentRouter.get("/:id/users", getDepartmentUsers);

export { departmentRouter };
