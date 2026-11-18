import express from "express";
import {
  createClass,
  getClassDetails,
  getClasses,
} from "../controller/classes.controller.js";

const classRouter = express.Router();

classRouter.get("/", getClasses);
classRouter.get("/:id", getClassDetails);

classRouter.post("/", createClass);

export default classRouter;
