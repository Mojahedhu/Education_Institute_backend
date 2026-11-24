import express from "express";
import {
  getUserDepartments,
  getUserDetails,
  getUsers,
  getUserSubjects,
} from "../controller/users.controller.js";

const userRouter = express.Router();

// Get all users with optional search, role filter, and pagination.
userRouter.get("/", getUsers);
userRouter.get("/:id", getUserDetails);
userRouter.get("/:id/departments", getUserDepartments);
userRouter.get("/:id/subjects", getUserSubjects);
export default userRouter;
