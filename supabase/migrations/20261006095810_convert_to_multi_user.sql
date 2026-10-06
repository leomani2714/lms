/*
# Convert schema to multi-user with owner-scoped RLS

1. Changes
- Add `user_id` column to `courses`, `lessons`, `equations`, `graphs`, `journals` tables.
  Each column is nullable (existing rows get NULL), defaults to auth.uid() for new inserts,
  and has a FK to auth.users(id) ON DELETE CASCADE.
- Existing rows from the single-tenant era get NULL user_id — they will be invisible
  under the new owner-scoped RLS policies, which is the correct behavior when converting
  from shared to per-user data.

2. Security
- Drop ALL existing anon policies on all 5 tables.
- Create new owner-scoped policies (TO authenticated) for SELECT, INSERT, UPDATE, DELETE.
  All tables use direct ownership: auth.uid() = user_id.

3. Important Notes
- Safe to re-run (uses IF NOT EXISTS checks, DROP POLICY IF EXISTS).
- The DEFAULT auth.uid() on user_id means frontend inserts that omit user_id will work.
- The app must build a sign-in/sign-up screen for this to work.
*/

-- Add user_id to courses (nullable, default auth.uid(), FK added separately)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'user_id') THEN
    ALTER TABLE courses ADD COLUMN user_id uuid DEFAULT auth.uid();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'courses_user_id_fkey') THEN
    ALTER TABLE courses ADD CONSTRAINT courses_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add user_id to lessons
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lessons' AND column_name = 'user_id') THEN
    ALTER TABLE lessons ADD COLUMN user_id uuid DEFAULT auth.uid();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lessons_user_id_fkey') THEN
    ALTER TABLE lessons ADD CONSTRAINT lessons_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add user_id to equations
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'equations' AND column_name = 'user_id') THEN
    ALTER TABLE equations ADD COLUMN user_id uuid DEFAULT auth.uid();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'equations_user_id_fkey') THEN
    ALTER TABLE equations ADD CONSTRAINT equations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add user_id to graphs
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'graphs' AND column_name = 'user_id') THEN
    ALTER TABLE graphs ADD COLUMN user_id uuid DEFAULT auth.uid();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'graphs_user_id_fkey') THEN
    ALTER TABLE graphs ADD CONSTRAINT graphs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add user_id to journals
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'journals' AND column_name = 'user_id') THEN
    ALTER TABLE journals ADD COLUMN user_id uuid DEFAULT auth.uid();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'journals_user_id_fkey') THEN
    ALTER TABLE journals ADD CONSTRAINT journals_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Indexes on user_id
CREATE INDEX IF NOT EXISTS idx_courses_user_id ON courses(user_id);
CREATE INDEX IF NOT EXISTS idx_lessons_user_id ON lessons(user_id);
CREATE INDEX IF NOT EXISTS idx_equations_user_id ON equations(user_id);
CREATE INDEX IF NOT EXISTS idx_graphs_user_id ON graphs(user_id);
CREATE INDEX IF NOT EXISTS idx_journals_user_id ON journals(user_id);

-- ==========================================
-- COURSES: owner-scoped RLS
-- ==========================================
DROP POLICY IF EXISTS "anon_select_courses" ON courses;
DROP POLICY IF EXISTS "anon_insert_courses" ON courses;
DROP POLICY IF EXISTS "anon_update_courses" ON courses;
DROP POLICY IF EXISTS "anon_delete_courses" ON courses;

DROP POLICY IF EXISTS "select_own_courses" ON courses;
CREATE POLICY "select_own_courses" ON courses FOR SELECT
TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_courses" ON courses;
CREATE POLICY "insert_own_courses" ON courses FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_courses" ON courses;
CREATE POLICY "update_own_courses" ON courses FOR UPDATE
TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_courses" ON courses;
CREATE POLICY "delete_own_courses" ON courses FOR DELETE
TO authenticated USING (auth.uid() = user_id);

-- ==========================================
-- LESSONS: owner-scoped RLS
-- ==========================================
DROP POLICY IF EXISTS "anon_select_lessons" ON lessons;
DROP POLICY IF EXISTS "anon_insert_lessons" ON lessons;
DROP POLICY IF EXISTS "anon_update_lessons" ON lessons;
DROP POLICY IF EXISTS "anon_delete_lessons" ON lessons;

DROP POLICY IF EXISTS "select_own_lessons" ON lessons;
CREATE POLICY "select_own_lessons" ON lessons FOR SELECT
TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_lessons" ON lessons;
CREATE POLICY "insert_own_lessons" ON lessons FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_lessons" ON lessons;
CREATE POLICY "update_own_lessons" ON lessons FOR UPDATE
TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_lessons" ON lessons;
CREATE POLICY "delete_own_lessons" ON lessons FOR DELETE
TO authenticated USING (auth.uid() = user_id);

-- ==========================================
-- EQUATIONS: owner-scoped RLS
-- ==========================================
DROP POLICY IF EXISTS "anon_select_equations" ON equations;
DROP POLICY IF EXISTS "anon_insert_equations" ON equations;
DROP POLICY IF EXISTS "anon_update_equations" ON equations;
DROP POLICY IF EXISTS "anon_delete_equations" ON equations;

DROP POLICY IF EXISTS "select_own_equations" ON equations;
CREATE POLICY "select_own_equations" ON equations FOR SELECT
TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_equations" ON equations;
CREATE POLICY "insert_own_equations" ON equations FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_equations" ON equations;
CREATE POLICY "update_own_equations" ON equations FOR UPDATE
TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_equations" ON equations;
CREATE POLICY "delete_own_equations" ON equations FOR DELETE
TO authenticated USING (auth.uid() = user_id);

-- ==========================================
-- GRAPHS: owner-scoped RLS
-- ==========================================
DROP POLICY IF EXISTS "anon_select_graphs" ON graphs;
DROP POLICY IF EXISTS "anon_insert_graphs" ON graphs;
DROP POLICY IF EXISTS "anon_update_graphs" ON graphs;
DROP POLICY IF EXISTS "anon_delete_graphs" ON graphs;

DROP POLICY IF EXISTS "select_own_graphs" ON graphs;
CREATE POLICY "select_own_graphs" ON graphs FOR SELECT
TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_graphs" ON graphs;
CREATE POLICY "insert_own_graphs" ON graphs FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_graphs" ON graphs;
CREATE POLICY "update_own_graphs" ON graphs FOR UPDATE
TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_graphs" ON graphs;
CREATE POLICY "delete_own_graphs" ON graphs FOR DELETE
TO authenticated USING (auth.uid() = user_id);

-- ==========================================
-- JOURNALS: owner-scoped RLS
-- ==========================================
DROP POLICY IF EXISTS "anon_select_journals" ON journals;
DROP POLICY IF EXISTS "anon_insert_journals" ON journals;
DROP POLICY IF EXISTS "anon_update_journals" ON journals;
DROP POLICY IF EXISTS "anon_delete_journals" ON journals;

DROP POLICY IF EXISTS "select_own_journals" ON journals;
CREATE POLICY "select_own_journals" ON journals FOR SELECT
TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_journals" ON journals;
CREATE POLICY "insert_own_journals" ON journals FOR INSERT
TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_journals" ON journals;
CREATE POLICY "update_own_journals" ON journals FOR UPDATE
TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_journals" ON journals;
CREATE POLICY "delete_own_journals" ON journals FOR DELETE
TO authenticated USING (auth.uid() = user_id);
