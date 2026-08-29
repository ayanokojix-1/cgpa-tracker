# CGPA Tracker

A personal CGPA tracker and semester planner, built for the University of Ibadan
grading scale. Single Express app — same code runs locally and on Vercel.

## What it does

- Add semesters (level, session, term), and courses within each one.
- Enter a raw score (0–100) per course — it auto-converts to a letter grade
  and grade point using U.I.'s official scale.
- GPA is calculated per semester; CGPA is calculated across everything.
- The Planner: enter a target CGPA and how many credits you have left, and it
  tells you the exact GPA you need across those remaining credits to get there.
- Classification tracker (Third Class → First Class) shown against your CGPA.

## 1. Set up the database

Create a Postgres database (locally or hosted), then run the schema against it:

```bash
psql "$DATABASE_URL" -f schema.sql
```

This creates three tables: `users`, `semesters`, `courses`.

## 2. Configure environment variables

```bash
cp .env.example .env
```

Fill in `.env`:

- `DATABASE_URL` — your Postgres connection string
- `JWT_SECRET` — any long random string (used to sign login tokens)
- `PORT` — defaults to 3000, only used locally

## 3. Install and run locally

```bash
npm install
npm start
```

Visit `http://localhost:3000`. Register an account (this is just for you —
email/password with a JWT session), then start adding semesters.

## 4. Deploy to Vercel

```bash
npm install -g vercel   # if you don't have it
vercel
```

In the Vercel project dashboard, add the same environment variables
(`DATABASE_URL`, `JWT_SECRET`) under Settings → Environment Variables. Use a
hosted Postgres instance for production (Neon, Supabase, Vercel Postgres, or
your own VPS) — `vercel.json` is already set up to route `/api/*` to the
Express app and serve everything else statically from `/public`, so no other
config is needed.

## How it's organized

```
app.js              — the Express app itself (routes mounted here)
server.js            — local dev entry point (npm start)
api/index.js          — Vercel serverless entry (wraps the same app.js)
vercel.json           — routes /api/* to the function, rest to /public

gradeEngine.js         — pure grading/GPA/CGPA/planner math, no DB or HTTP
gradeEngine.test.js     — sanity checks with hand-calculated examples

routes/auth.js          — register / login
routes/semesters.js      — semester CRUD + CGPA summary
routes/courses.js         — course CRUD, score → grade conversion
routes/planner.js          — the reverse "what GPA do I need" calculator
middleware/auth.js          — JWT verification

public/                       — plain HTML + Tailwind (CDN) + vanilla JS frontend
  index.html                    — login/register
  dashboard.html                  — the app: gauge, planner, semester ledger
  js/api.js, js/app.js               — frontend logic
```

## Grading scale (University of Ibadan)

| Score  | Grade | Points |
|--------|-------|--------|
| 70–100 | A     | 5      |
| 60–69  | B     | 4      |
| 50–59  | C     | 3      |
| 45–49  | D     | 2      |
| 40–44  | E     | 1      |
| 0–39   | F     | 0      |

## Classification bands

| CGPA      | Class               |
|-----------|----------------------|
| 4.50–5.00 | First Class          |
| 3.50–4.49 | Second Class Upper   |
| 2.40–3.49 | Second Class Lower   |
| 1.50–2.39 | Third Class          |

## Testing the core math

`gradeEngine.js` is the only file that does GPA/CGPA/planner math, and it has
no dependency on the database or HTTP — you can test it standalone:

```bash
node gradeEngine.test.js
```
