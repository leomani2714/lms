/*
# Course publishing and assignment to accounts

1. Changes to `courses`
- `is_published` (boolean, default false) — owner-controlled. Unpublished courses are only visible to their owner.
- `published_at` (timestamptz, nullable) — set when the course is published.

2. New table `course_assignments`
- id, course_id (FK courses, cascade), student_id (FK auth.users, cascade),
  assigned_by (FK auth.users), assigned_at
- UNIQUE (course_id, student_id) so an account can only be assigned once.

3. Security
- Helper functions `owns_course` and `can_view_assigned_course` are SECURITY DEFINER so
  policies can reference other tables without recursive RLS evaluation.
- New ADDITIVE read-only policies (Postgres ORs permissive policies together):
  assigned accounts can SELECT a course and its lessons, but only while the course is published.
  Existing owner-only INSERT/UPDATE/DELETE policies are untouched, so assignees cannot edit.
- `course_assignments`: assignees can see their own rows, owners can see and delete rows for their
  courses. There is NO insert policy: rows are created only through the RPC below.

4. RPC functions
- `assign_course_to_emails(course_id, emails[])` — owner only. Looks up accounts by email and
  returns a per-email status: assigned / already_assigned / not_found / is_owner.
  (Emails live in auth.users, which clients cannot read directly.)
- `list_course_assignees(course_id)` — owner only. Returns assigned accounts with email + name.

Safe to re-run.
*/

-- ==========================================
-- courses: publish flag
-- ==========================================
ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT false;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS published_at timestamptz;

-- ==========================================
-- course_assignments
-- ==========================================
CREATE TABLE IF NOT EXISTS course_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (course_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_course_assignments_course_id ON course_assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_course_assignments_student_id ON course_assignments(student_id);

ALTER TABLE course_assignments ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- Helper functions (SECURITY DEFINER to avoid recursive RLS)
-- ==========================================
CREATE OR REPLACE FUNCTION public.owns_course(p_course_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = p_course_id AND c.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.can_view_assigned_course(p_course_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.course_assignments a
    JOIN public.courses c ON c.id = a.course_id
    WHERE a.course_id = p_course_id
      AND a.student_id = auth.uid()
      AND c.is_published = true
  );
$$;

REVOKE ALL ON FUNCTION public.owns_course(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_view_assigned_course(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.owns_course(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_view_assigned_course(uuid) TO authenticated;

-- ==========================================
-- Policies: course_assignments
-- ==========================================
DROP POLICY IF EXISTS "select_own_or_owned_assignments" ON course_assignments;
CREATE POLICY "select_own_or_owned_assignments" ON course_assignments FOR SELECT
TO authenticated
USING (student_id = auth.uid() OR public.owns_course(course_id));

DROP POLICY IF EXISTS "owner_delete_assignments" ON course_assignments;
CREATE POLICY "owner_delete_assignments" ON course_assignments FOR DELETE
TO authenticated
USING (public.owns_course(course_id));

-- ==========================================
-- Policies: assigned accounts get read-only access to published courses + lessons
-- ==========================================
DROP POLICY IF EXISTS "assignees_select_published_courses" ON courses;
CREATE POLICY "assignees_select_published_courses" ON courses FOR SELECT
TO authenticated
USING (public.can_view_assigned_course(id));

DROP POLICY IF EXISTS "assignees_select_published_lessons" ON lessons;
CREATE POLICY "assignees_select_published_lessons" ON lessons FOR SELECT
TO authenticated
USING (public.can_view_assigned_course(course_id));

-- ==========================================
-- RPC: assign a course to accounts by email (owner only)
-- ==========================================
CREATE OR REPLACE FUNCTION public.assign_course_to_emails(p_course_id uuid, p_emails text[])
RETURNS TABLE (out_email text, out_status text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth
AS $$
DECLARE
  v_raw text;
  v_norm text;
  v_uid uuid;
  v_rows int;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF NOT public.owns_course(p_course_id) THEN
    RAISE EXCEPTION 'Only the course owner can assign this course';
  END IF;
  IF p_emails IS NULL OR array_length(p_emails, 1) IS NULL THEN
    RETURN;
  END IF;
  IF array_length(p_emails, 1) > 200 THEN
    RAISE EXCEPTION 'Assign at most 200 accounts at a time';
  END IF;

  FOREACH v_raw IN ARRAY p_emails LOOP
    v_norm := lower(trim(v_raw));
    CONTINUE WHEN v_norm = '';

    v_uid := NULL;
    SELECT u.id INTO v_uid FROM auth.users u WHERE lower(u.email) = v_norm LIMIT 1;

    out_email := v_norm;
    IF v_uid IS NULL THEN
      out_status := 'not_found';
    ELSIF v_uid = auth.uid() THEN
      out_status := 'is_owner';
    ELSE
      INSERT INTO public.course_assignments (course_id, student_id, assigned_by)
      VALUES (p_course_id, v_uid, auth.uid())
      ON CONFLICT (course_id, student_id) DO NOTHING;
      GET DIAGNOSTICS v_rows = ROW_COUNT;
      out_status := CASE WHEN v_rows > 0 THEN 'assigned' ELSE 'already_assigned' END;
    END IF;
    RETURN NEXT;
  END LOOP;
END;
$$;

-- ==========================================
-- RPC: list assigned accounts for a course (owner only)
-- ==========================================
CREATE OR REPLACE FUNCTION public.list_course_assignees(p_course_id uuid)
RETURNS TABLE (
  assignment_id uuid,
  account_id uuid,
  email text,
  display_name text,
  assigned_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth
AS $$
  SELECT a.id, a.student_id, u.email::text, COALESCE(p.display_name, ''), a.assigned_at
  FROM public.course_assignments a
  JOIN auth.users u ON u.id = a.student_id
  LEFT JOIN public.profiles p ON p.id = a.student_id
  WHERE a.course_id = p_course_id
    AND public.owns_course(p_course_id)
  ORDER BY a.assigned_at DESC;
$$;

REVOKE ALL ON FUNCTION public.assign_course_to_emails(uuid, text[]) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.list_course_assignees(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assign_course_to_emails(uuid, text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_course_assignees(uuid) TO authenticated;
