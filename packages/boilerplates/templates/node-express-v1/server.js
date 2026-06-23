const express = require("express");
const app = express();
app.use(express.json());

// Platform liveness probe — grader polls this, never touch it
app.get("/health", (req, res) => res.sendStatus(200));

// Challenge 1
const { ping } = require("./handlers/ping");
app.get("/api/ping", ping);

// Challenges 2, 3, 4 — all auth routes go through this file
const authRoutes = require("./routes/auth.routes");
app.use("/api/auth", authRoutes);

// Challenge 3 — protected endpoint, uses middleware contestant writes
const { authenticate } = require("./middleware/auth.middleware");
app.get("/api/me", authenticate, (req, res) => {
  res.status(200).json({ success: true, user: req.user });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "127.0.0.1", () =>
  console.log(`Server listening on ${PORT}`)
);