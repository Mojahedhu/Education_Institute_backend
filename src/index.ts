import express from "express";
import cors from "cors";
const PORT = 8000;

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL, // React app url
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"], //  Specify allowed HTTP methods
    credentials: true,
  }),
);

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello, welcome to the Education institute API.");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
