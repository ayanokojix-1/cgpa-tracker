-- Run this once against your Postgres database to set up tables.
-- e.g. psql "$DATABASE_URL" -f schema.sql

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS semesters (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  level TEXT NOT NULL,        -- e.g. "100"
  session TEXT NOT NULL,      -- e.g. "2024/2025"
  term TEXT NOT NULL,         -- e.g. "First Semester"
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS courses (
  id SERIAL PRIMARY KEY,
  semester_id INTEGER NOT NULL REFERENCES semesters(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  code TEXT,
  credit_units INTEGER NOT NULL,
  score NUMERIC,               -- raw score 0-100, null until entered
  grade TEXT,                  -- derived: A/B/C/D/E/F
  grade_point NUMERIC,         -- derived: 5/4/3/2/1/0
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_semesters_user ON semesters(user_id);
CREATE INDEX IF NOT EXISTS idx_courses_semester ON courses(semester_id);
