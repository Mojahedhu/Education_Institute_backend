import express from "express";
const PORT = 8000;

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello, welcome to the Education institute API.");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
