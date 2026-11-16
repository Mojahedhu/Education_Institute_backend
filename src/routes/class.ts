import express from "express";
import { createClass } from "../controller/classes.controller.js";

const classRouter = express.Router();

classRouter.post("/", createClass);

export default classRouter;
