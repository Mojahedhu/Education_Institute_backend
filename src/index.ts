import "dotenv/config";
import express from "express";
import cors from "cors";
import { errorHandler } from "./middleware/error-handler.js";
import subjectRouter from "./routes/subject.js";
import securityMiddleware from "./middleware/security.js";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth.js";
const PORT = Number(process.env.PORT) || 8000;
const FRONTEND_URL = process.env.FRONTEND_URL;
if (!FRONTEND_URL) {
  throw new Error("Missing required environment variable: FRONTEND_URL");
}

const app = express();

app.use(
  cors({
    origin: FRONTEND_URL, // React app url
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"], //  Specify allowed HTTP methods
    credentials: true, // allow cookies
  }),
);

app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());

app.use(securityMiddleware);

app.use("/api/subjects", subjectRouter);

app.get("/", (req, res) => {
  res.send("Hello, welcome to the Education institute API.");
});

// Mount after all route registrations:
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
