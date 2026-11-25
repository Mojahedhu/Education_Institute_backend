import apminsight from "apminsight";
apminsight.config();

import "dotenv/config";
import express from "express";
import cors from "cors";
import { errorHandler } from "./middleware/error-handler.js";
import subjectRouter from "./routes/subject.route.js";
import securityMiddleware from "./middleware/security.js";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";
import userRouter from "./routes/user.route.js";
import classRouter from "./routes/class.route.js";
import { departmentRouter } from "./routes/department.route.js";
import enrollmentRouter from "./routes/enrollment.routes.js";

const PORT = Number(process.env.PORT) || 8000;
const FRONTEND_URL = process.env.FRONTEND_URL;
if (!FRONTEND_URL) {
  throw new Error("Missing required environment variable: FRONTEND_URL");
}

const app = express();

// Set TRUST_PROXY=1 in production (Railway), or leave unset / false for local
const trustProxy = process.env.TRUST_PROXY
  ? Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY
  : process.env.NODE_ENV === "production"
    ? 1
    : false;
app.set("trust proxy", trustProxy);

app.use(
  cors({
    origin: FRONTEND_URL, // React app url
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"], //  Specify allowed HTTP methods
    credentials: true, // allow cookies
  }),
);

// 1. Mount security middleware before auth so /api/auth routes are protected
// app.use(securityMiddleware);
// 2. Auth routes handled by Better Auth
app.all("/api/auth/*splat", toNodeHandler(auth));
// 3. Keep express.json() after Better Auth
app.use(express.json());

app.use("/api/subjects", subjectRouter);
app.use("/api/users", userRouter);
app.use("/api/classes", classRouter);
app.use("/api/departments", departmentRouter);
app.use("/api/enrollments", enrollmentRouter);

app.get("/", (req, res) => {
  res.send("Hello, welcome to the Education institute API.");
});

// Place after all routes, just before app.use(errorHandler)
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

app.use(errorHandler);

// Mount after all route registrations:
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
