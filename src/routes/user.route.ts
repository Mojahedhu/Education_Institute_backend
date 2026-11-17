import express from "express";
import { getUsers } from "../controller/users.controller.js";

const userRouter = express.Router();

// Get all users with optional search, role filter, and pagination.
userRouter.get("/", getUsers);

export default userRouter;
