// Vercel picks up any file in /api as a serverless function. This one wraps
// the exact same Express app used locally, so nothing behaves differently
// between local dev and production.
const app = require("../app");

module.exports = app;
