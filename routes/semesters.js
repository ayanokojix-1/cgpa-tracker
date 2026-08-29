const express = require("express");
const pool = require("../db");
const { requireAuth } = require("../middleware/auth");
const { calculateGPA, classify } = require("../gradeEngine");

const router = express.Router();
router.use(requireAuth);

// List all semesters for the logged-in user, each with its courses + computed GPA.
router.get("/", async (req, res) => {
  try {
    const semResult = await pool.query(
      "SELECT * FROM semesters WHERE user_id = $1 ORDER BY session, term",
      [req.userId]
    );
    const semesters = semResult.rows;

    if (semesters.length === 0) return res.json({ semesters: [] });

    const semesterIds = semesters.map((s) => s.id);
    const courseResult = await pool.query(
      "SELECT * FROM courses WHERE semester_id = ANY($1) ORDER BY id",
      [semesterIds]
    );

    const withCourses = semesters.map((sem) => {
      const courses = courseResult.rows.filter((c) => c.semester_id === sem.id);
      const gpa = calculateGPA(
        courses.map((c) => ({ credit_units: c.credit_units, grade_point: c.grade_point }))
      );
      return { ...sem, courses, gpa };
    });

    res.json({ semesters: withCourses });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not load semesters" });
  }
});

router.post("/", async (req, res) => {
  const { level, session, term } = req.body;
  if (!level || !session || !term) {
    return res.status(400).json({ error: "level, session, and term are required" });
  }
  try {
    const result = await pool.query(
      "INSERT INTO semesters (user_id, level, session, term) VALUES ($1, $2, $3, $4) RETURNING *",
      [req.userId, level, session, term]
    );
    res.status(201).json({ semester: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not create semester" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM semesters WHERE id = $1 AND user_id = $2 RETURNING id",
      [req.params.id, req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Semester not found" });
    res.json({ deleted: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not delete semester" });
  }
});

// Overall CGPA + classification across every course the user has ever entered.
router.get("/summary/cgpa", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.credit_units, c.grade_point
       FROM courses c
       JOIN semesters s ON c.semester_id = s.id
       WHERE s.user_id = $1`,
      [req.userId]
    );
    const cgpa = calculateGPA(result.rows);
    const creditsCompleted = result.rows
      .filter((c) => c.grade_point !== null)
      .reduce((sum, c) => sum + c.credit_units, 0);

    res.json({ cgpa, classification: classify(cgpa), creditsCompleted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not calculate CGPA" });
  }
});

module.exports = router;
