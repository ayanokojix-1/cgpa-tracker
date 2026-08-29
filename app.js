require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/auth");
const semesterRoutes = require("./routes/semesters");
const courseRoutes = require("./routes/courses");
const plannerRoutes = require("./routes/planner");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/semesters", semesterRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/planner", plannerRoutes);

app.get("/api/health", (req, res) => res.json({ ok: true }));

// Serve the static frontend (only relevant for local dev — Vercel serves
// /public directly and only routes /api/* to this app, see vercel.json).
app.use(express.static(path.join(__dirname, "public")));

module.exports = app;
