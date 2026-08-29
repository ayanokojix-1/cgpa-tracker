// The core grading logic. Kept isolated from routes/DB so it can be trusted
// and tested on its own — everything else just calls into this file.

// University of Ibadan grading scale.
const SCALE = [
  { min: 70, grade: "A", point: 5 },
  { min: 60, grade: "B", point: 4 },
  { min: 50, grade: "C", point: 3 },
  { min: 45, grade: "D", point: 2 },
  { min: 40, grade: "E", point: 1 },
  { min: 0, grade: "F", point: 0 },
];

/** Raw score (0-100) -> { grade, point } */
function scoreToGrade(score) {
  const s = Number(score);
  if (Number.isNaN(s) || s < 0 || s > 100) {
    throw new Error("Score must be a number between 0 and 100");
  }
  const band = SCALE.find((b) => s >= b.min);
  return { grade: band.grade, point: band.point };
}

/**
 * Weighted GPA over a list of courses.
 * courses: [{ credit_units, grade_point }]
 * Only courses with a non-null grade_point count (ungraded courses are skipped).
 */
function calculateGPA(courses) {
  const graded = courses.filter(
    (c) => c.grade_point !== null && c.grade_point !== undefined
  );
  if (graded.length === 0) return null;

  const totalPoints = graded.reduce(
    (sum, c) => sum + c.credit_units * c.grade_point,
    0
  );
  const totalUnits = graded.reduce((sum, c) => sum + c.credit_units, 0);
  if (totalUnits === 0) return null;

  return round2(totalPoints / totalUnits);
}

/** CGPA is the same weighted calc, just run over every course across every semester. */
function calculateCGPA(allCourses) {
  return calculateGPA(allCourses);
}

/**
 * Reverse planner: given current CGPA, credits completed, credits remaining,
 * and a target CGPA — solve for the GPA needed across the remaining credits.
 *
 * target = (current*completed + needed*remaining) / (completed+remaining)
 * => needed = (target*(completed+remaining) - current*completed) / remaining
 */
function requiredFutureGPA({
  currentCGPA,
  creditsCompleted,
  creditsRemaining,
  targetCGPA,
}) {
  if (creditsRemaining <= 0) {
    throw new Error("Credits remaining must be greater than 0");
  }
  const needed =
    (targetCGPA * (creditsCompleted + creditsRemaining) -
      currentCGPA * creditsCompleted) /
    creditsRemaining;

  return {
    neededGPA: round2(needed),
    possible: needed <= 5.0,
    // even if mathematically possible, flag if it requires all A's or better
    requiresAllAs: needed >= 5.0,
  };
}

function classify(cgpa) {
  if (cgpa === null) return null;
  if (cgpa >= 4.5) return "First Class";
  if (cgpa >= 3.5) return "Second Class Upper";
  if (cgpa >= 2.4) return "Second Class Lower";
  if (cgpa >= 1.5) return "Third Class";
  return "Pass / Below Third Class";
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

module.exports = {
  SCALE,
  scoreToGrade,
  calculateGPA,
  calculateCGPA,
  requiredFutureGPA,
  classify,
};
