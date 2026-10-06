/*
# Create LMS Schema for Math Education Platform

1. New Tables
- `courses` — top-level course containers (e.g. "Calculus I", "Linear Algebra")
  - id (uuid, PK)
  - title (text, not null)
  - description (text)
  - color (text, for UI accent)
  - created_at (timestamptz)
  - updated_at (timestamptz)

- `lessons` — lessons within a course
  - id (uuid, PK)
  - course_id (uuid, FK to courses, ON DELETE CASCADE)
  - title (text, not null)
  - content (text, markdown/latex content)
  - position (int, for ordering)
  - created_at (timestamptz)
  - updated_at (timestamptz)

- `equations` — saved LaTeX equations
  - id (uuid, PK)
  - lesson_id (uuid, FK to lessons, ON DELETE CASCADE, nullable — can be standalone)
  - course_id (uuid, FK to courses, ON DELETE CASCADE, nullable)
  - title (text)
  - latex (text, not null — the LaTeX source)
  - description (text)
  - created_at (timestamptz)

- `graphs` — saved graph configurations
  - id (uuid, PK)
  - lesson_id (uuid, FK to lessons, ON DELETE CASCADE, nullable)
  - course_id (uuid, FK to courses, ON DELETE CASCADE, nullable)
  - title (text)
  - config (jsonb — stores plotly config: functions, ranges, etc.)
  - created_at (timestamptz)

- `journals` — exported journal documents
  - id (uuid, PK)
  - title (text, not null)
  - content (text, not null — HTML content of the journal)
  - course_id (uuid, FK to courses, ON DELETE SET NULL, nullable)
  - created_at (timestamptz)
  - updated_at (timestamptz)

2. Security
- This is a single-tenant app with no sign-in screen.
- Enable RLS on all tables.
- Allow anon + authenticated CRUD on all tables (data is intentionally shared/public).
*/

CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  color text DEFAULT '#2563eb',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text DEFAULT '',
  position int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS equations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid REFERENCES lessons(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  title text DEFAULT '',
  latex text NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS graphs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid REFERENCES lessons(id) ON DELETE CASCADE,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  title text DEFAULT '',
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS journals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  course_id uuid REFERENCES courses(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE equations ENABLE ROW LEVEL SECURITY;
ALTER TABLE graphs ENABLE ROW LEVEL SECURITY;
ALTER TABLE journals ENABLE ROW LEVEL SECURITY;

-- Courses policies (single-tenant, anon + authenticated)
DROP POLICY IF EXISTS "anon_select_courses" ON courses;
CREATE POLICY "anon_select_courses" ON courses FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_courses" ON courses;
CREATE POLICY "anon_insert_courses" ON courses FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_courses" ON courses;
CREATE POLICY "anon_update_courses" ON courses FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_courses" ON courses;
CREATE POLICY "anon_delete_courses" ON courses FOR DELETE TO anon, authenticated USING (true);

-- Lessons policies
DROP POLICY IF EXISTS "anon_select_lessons" ON lessons;
CREATE POLICY "anon_select_lessons" ON lessons FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_lessons" ON lessons;
CREATE POLICY "anon_insert_lessons" ON lessons FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_lessons" ON lessons;
CREATE POLICY "anon_update_lessons" ON lessons FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_lessons" ON lessons;
CREATE POLICY "anon_delete_lessons" ON lessons FOR DELETE TO anon, authenticated USING (true);

-- Equations policies
DROP POLICY IF EXISTS "anon_select_equations" ON equations;
CREATE POLICY "anon_select_equations" ON equations FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_equations" ON equations;
CREATE POLICY "anon_insert_equations" ON equations FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_equations" ON equations;
CREATE POLICY "anon_update_equations" ON equations FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_equations" ON equations;
CREATE POLICY "anon_delete_equations" ON equations FOR DELETE TO anon, authenticated USING (true);

-- Graphs policies
DROP POLICY IF EXISTS "anon_select_graphs" ON graphs;
CREATE POLICY "anon_select_graphs" ON graphs FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_graphs" ON graphs;
CREATE POLICY "anon_insert_graphs" ON graphs FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_graphs" ON graphs;
CREATE POLICY "anon_update_graphs" ON graphs FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_graphs" ON graphs;
CREATE POLICY "anon_delete_graphs" ON graphs FOR DELETE TO anon, authenticated USING (true);

-- Journals policies
DROP POLICY IF EXISTS "anon_select_journals" ON journals;
CREATE POLICY "anon_select_journals" ON journals FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_journals" ON journals;
CREATE POLICY "anon_insert_journals" ON journals FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_journals" ON journals;
CREATE POLICY "anon_update_journals" ON journals FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_journals" ON journals;
CREATE POLICY "anon_delete_journals" ON journals FOR DELETE TO anon, authenticated USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_lessons_course_id ON lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_equations_lesson_id ON equations(lesson_id);
CREATE INDEX IF NOT EXISTS idx_equations_course_id ON equations(course_id);
CREATE INDEX IF NOT EXISTS idx_graphs_lesson_id ON graphs(lesson_id);
CREATE INDEX IF NOT EXISTS idx_graphs_course_id ON graphs(course_id);
CREATE INDEX IF NOT EXISTS idx_journals_course_id ON journals(course_id);
