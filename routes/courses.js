const express = require("express");
const pool = require("../db");
const { requireAuth } = require("../middleware/auth");
const { scoreToGrade } = require("../gradeEngine");

const router = express.Router();
router.use(requireAuth);

// Confirms a semester belongs to the logged-in user before touching its courses.
async function ownsSemester(userId, semesterId) {
  const result = await pool.query(
    "SELECT id FROM semesters WHERE id = $1 AND user_id = $2",
    [semesterId, userId]
  );
  return result.rows.length > 0;
}

router.post("/", async (req, res) => {
  const { semester_id, title, code, credit_units, score } = req.body;
  if (!semester_id || !title || !credit_units) {
    return res.status(400).json({ error: "semester_id, title, and credit_units are required" });
  }

  if (!(await ownsSemester(req.userId, semester_id))) {
    return res.status(404).json({ error: "Semester not found" });
  }

  let grade = null;
  let grade_point = null;
  if (score !== undefined && score !== null && score !== "") {
    try {
      const result = scoreToGrade(score);
      grade = result.grade;
      grade_point = result.point;
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  try {
    const result = await pool.query(
      `INSERT INTO courses (semester_id, title, code, credit_units, score, grade, grade_point)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [semester_id, title, code || null, credit_units, score ?? null, grade, grade_point]
    );
    res.status(201).json({ course: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not add course" });
  }
});

router.put("/:id", async (req, res) => {
  const { title, code, credit_units, score } = req.body;

  try {
    // Verify ownership through the semester join before allowing the edit.
    const owned = await pool.query(
      `SELECT c.id FROM courses c
       JOIN semesters s ON c.semester_id = s.id
       WHERE c.id = $1 AND s.user_id = $2`,
      [req.params.id, req.userId]
    );
    if (owned.rows.length === 0) return res.status(404).json({ error: "Course not found" });

    let grade = null;
    let grade_point = null;
    if (score !== undefined && score !== null && score !== "") {
      try {
        const result = scoreToGrade(score);
        grade = result.grade;
        grade_point = result.point;
      } catch (err) {
        return res.status(400).json({ error: err.message });
      }
    }

    const result = await pool.query(
      `UPDATE courses SET title = $1, code = $2, credit_units = $3, score = $4, grade = $5, grade_point = $6
       WHERE id = $7 RETURNING *`,
      [title, code || null, credit_units, score ?? null, grade, grade_point, req.params.id]
    );
    res.json({ course: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not update course" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM courses c USING semesters s
       WHERE c.id = $1 AND c.semester_id = s.id AND s.user_id = $2
       RETURNING c.id`,
      [req.params.id, req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Course not found" });
    res.json({ deleted: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not delete course" });
  }
});

module.exports = router;
