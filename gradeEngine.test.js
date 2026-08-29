// Quick sanity check with known-by-hand inputs. Run with: node gradeEngine.test.js
const { scoreToGrade, calculateGPA, requiredFutureGPA, classify } = require("./gradeEngine");

function assertEqual(actual, expected, label) {
  const pass = JSON.stringify(actual) === JSON.stringify(expected);
  console.log(`${pass ? "PASS" : "FAIL"} — ${label} (got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)})`);
}

// 3 units A (5), 2 units B (4), 4 units C (3)
// hand calc: (3*5 + 2*4 + 4*3)/(3+2+4) = (15+8+12)/9 = 35/9 = 3.888... -> 3.89
const gpa = calculateGPA([
  { credit_units: 3, grade_point: 5 },
  { credit_units: 2, grade_point: 4 },
  { credit_units: 4, grade_point: 3 },
]);
assertEqual(gpa, 3.89, "GPA weighted calc");

assertEqual(scoreToGrade(70), { grade: "A", point: 5 }, "70 is boundary A");
assertEqual(scoreToGrade(69), { grade: "B", point: 4 }, "69 is B");
assertEqual(scoreToGrade(39), { grade: "F", point: 0 }, "39 is F");

// current 3.72 CGPA over 90 credits, want 4.00 over 30 more credits
const plan = requiredFutureGPA({
  currentCGPA: 3.72,
  creditsCompleted: 90,
  creditsRemaining: 30,
  targetCGPA: 4.0,
});
console.log("Planner example (3.72 -> 4.00, 90 done, 30 left):", plan);

assertEqual(classify(4.6), "First Class", "4.6 classifies as First Class");
