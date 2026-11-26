import express from "express";
import {
  createClass,
  getClassDetails,
  getClasses,
  getClassUsers,
} from "../controller/classes.controller.js";

const classRouter = express.Router();

classRouter.get("/", getClasses);
classRouter.get("/:id", getClassDetails);

classRouter.post("/", createClass);
classRouter.get("/:id/users", getClassUsers);

export default classRouter;
