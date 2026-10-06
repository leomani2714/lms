/*
# Create profiles table for user profile data

1. New Tables
- `profiles`
  - `id` (uuid, primary key, references auth.users(id) ON DELETE CASCADE)
  - `display_name` (text, display name shown in UI, defaults to empty string)
  - `avatar_url` (text, nullable, URL to a profile picture)
  - `bio` (text, short bio, defaults to empty string)
  - `role` (text, user role for the LMS: 'student' or 'instructor', defaults to 'student')
  - `created_at` (timestamptz, when the profile was created)
  - `updated_at` (timestamptz, last profile update)

2. Automation
- Creates a trigger function `handle_new_user()` that inserts a row into `profiles`
  whenever a new user signs up via Supabase Auth. It copies the user's email as the
  initial display_name and sets the role to 'student'.
- Attaches the trigger `on_auth_user_created` to `auth.users` so it fires AFTER INSERT.

3. Security
- Enable RLS on `profiles`.
- SELECT: authenticated users can read all profiles (needed so instructors can see
  student names, and so users can see each other in shared contexts).
- INSERT: handled by the trigger (runs as definer), so we also allow authenticated
  users to insert their own profile row as a fallback.
- UPDATE: users can only update their own profile (auth.uid() = id).
- DELETE: users can only delete their own profile.

4. Important Notes
- Safe to re-run (uses IF NOT EXISTS, DROP POLICY IF EXISTS, DROP FUNCTION IF EXISTS).
- The trigger function is SECURITY DEFINER so it can insert into profiles even though
  the calling context (auth user signup) might not have direct insert privileges.
- The profiles table extends auth.users — it does not replace it. Auth data (email,
  password) stays in auth.users; app data (display name, bio, avatar, role) lives here.
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT '',
  avatar_url text,
  bio text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'instructor')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- SELECT: any authenticated user can read any profile
DROP POLICY IF EXISTS "select_profiles" ON profiles;
CREATE POLICY "select_profiles" ON profiles FOR SELECT
TO authenticated USING (true);

-- INSERT: users can insert their own profile (trigger also does this)
DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
TO authenticated WITH CHECK (auth.uid() = id);

-- UPDATE: users can only update their own profile
DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- DELETE: users can only delete their own profile
DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE
TO authenticated USING (auth.uid() = id);

-- Trigger function: auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, split_part(NEW.email, '@', 1))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger: fire after a new auth user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
