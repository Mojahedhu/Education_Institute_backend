import express from "express";
import { createClass, getClasses } from "../controller/classes.controller.js";

const classRouter = express.Router();

classRouter.get("/", getClasses);

classRouter.post("/", createClass);

export default classRouter;
