import express from "express";
import { getUserDetails, getUsers } from "../controller/users.controller.js";

const userRouter = express.Router();

// Get all users with optional search, role filter, and pagination.
userRouter.get("/", getUsers);
userRouter.get("/:id", getUserDetails);
export default userRouter;
