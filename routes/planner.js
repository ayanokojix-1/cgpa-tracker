const express = require("express");
const pool = require("../db");
const { requireAuth } = require("../middleware/auth");
const { calculateGPA, requiredFutureGPA, classify } = require("../gradeEngine");

const router = express.Router();
router.use(requireAuth);

// POST /api/planner  { targetCGPA, creditsRemaining }
// Current CGPA and credits completed are computed server-side from real data,
// so the user only has to supply the target and how many credits are left.
router.post("/", async (req, res) => {
  const { targetCGPA, creditsRemaining } = req.body;

  if (targetCGPA === undefined || creditsRemaining === undefined) {
    return res.status(400).json({ error: "targetCGPA and creditsRemaining are required" });
  }
  if (targetCGPA < 0 || targetCGPA > 5) {
    return res.status(400).json({ error: "targetCGPA must be between 0 and 5" });
  }
  if (creditsRemaining <= 0) {
    return res.status(400).json({ error: "creditsRemaining must be greater than 0" });
  }

  try {
    const result = await pool.query(
      `SELECT c.credit_units, c.grade_point
       FROM courses c JOIN semesters s ON c.semester_id = s.id
       WHERE s.user_id = $1`,
      [req.userId]
    );
    const currentCGPA = calculateGPA(result.rows);
    const creditsCompleted = result.rows
      .filter((c) => c.grade_point !== null)
      .reduce((sum, c) => sum + c.credit_units, 0);

    if (currentCGPA === null) {
      return res.status(400).json({
        error: "You need at least one graded course before the planner can calculate anything",
      });
    }

    const plan = requiredFutureGPA({
      currentCGPA,
      creditsCompleted,
      creditsRemaining: Number(creditsRemaining),
      targetCGPA: Number(targetCGPA),
    });

    res.json({
      currentCGPA,
      creditsCompleted,
      creditsRemaining: Number(creditsRemaining),
      targetCGPA: Number(targetCGPA),
      targetClassification: classify(Number(targetCGPA)),
      ...plan,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not calculate plan" });
  }
});

module.exports = router;
