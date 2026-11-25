import express from "express";

import * as controller from "../controller/enrollments.controller.js";

const router = express.Router();

router.post("/", controller.createEnrollment);
router.post("/join", controller.joinClass);

export default router;
