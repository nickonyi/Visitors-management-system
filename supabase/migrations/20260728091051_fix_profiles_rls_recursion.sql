/*
# Fix infinite recursion in profiles RLS policies

## Problem
The `select_own_or_admin_profile` and `update_own_or_admin_profile` policies on `profiles`
query the `profiles` table itself (via `EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')`)
to determine the requesting user's role. Because RLS applies to that inner query too, it
re-evaluates the same policy, which queries profiles again -> infinite recursion -> error 42P17.

## Fix
Use `auth.jwt() ->> 'role'` to read the user's role directly from the JWT's `raw_app_meta_data`
instead of querying the `profiles` table. The `handle_new_user()` trigger already stores the
chosen role into `raw_user_meta_data` on signup. We update the trigger to write the role into
`raw_app_meta_data` (user-immutable, used for authorization) so the policies can read it without
touching the table.

## Changes
1. Recreate `handle_new_user()` to set `raw_app_meta_data.role` (in addition to creating the profile row).
2. Backfill `raw_app_meta_data.role` for all existing auth.users from their profiles row.
3. Drop and recreate the `profiles` SELECT and UPDATE policies to use `auth.jwt() ->> 'role'`.
4. Drop and recreate the `visitor_passes` policies that had the same self-referential pattern.
*/

-- 1. Update the trigger function to also stamp role into raw_app_meta_data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, unit, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'resident'),
    NEW.raw_user_meta_data->>'unit',
    NEW.raw_user_meta_data->>'phone'
  );

  -- Persist the role into raw_app_meta_data so RLS policies can read it from the JWT
  -- without querying the profiles table (avoids infinite recursion).
  IF NEW.raw_app_meta_data->>'role' IS NULL THEN
    NEW.raw_app_meta_data := jsonb_set(
      COALESCE(NEW.raw_app_meta_data, '{}'::jsonb),
      '{role}',
      to_jsonb(COALESCE(NEW.raw_user_meta_data->>'role', 'resident'))
    );
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Backfill raw_app_meta_data.role for existing users from their profiles row
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT u.id, p.role FROM auth.users u JOIN public.profiles p ON p.id = u.id
  LOOP
    UPDATE auth.users
    SET raw_app_meta_data = jsonb_set(
      COALESCE(raw_app_meta_data, '{}'::jsonb),
      '{role}',
      to_jsonb(r.role)
    )
    WHERE id = r.id AND raw_app_meta_data->>'role' IS NULL;
  END LOOP;
END $$;

-- 3. profiles policies (no self-reference)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_or_admin_profile" ON profiles;
CREATE POLICY "select_own_or_admin_profile"
ON profiles FOR SELECT TO authenticated
USING (
  auth.uid() = id
  OR auth.jwt() ->> 'role' = 'admin'
  OR auth.jwt() ->> 'role' = 'guard'
);

DROP POLICY IF EXISTS "update_own_or_admin_profile" ON profiles;
CREATE POLICY "update_own_or_admin_profile"
ON profiles FOR UPDATE TO authenticated
USING (
  auth.uid() = id
  OR auth.jwt() ->> 'role' = 'admin'
)
WITH CHECK (
  auth.uid() = id
  OR auth.jwt() ->> 'role' = 'admin'
);

DROP POLICY IF EXISTS "insert_profile_on_signup" ON profiles;
CREATE POLICY "insert_profile_on_signup"
ON profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

-- 4. visitor_passes policies (replace self-referential subqueries with JWT role check)
ALTER TABLE visitor_passes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_passes" ON visitor_passes;
CREATE POLICY "select_own_passes"
ON visitor_passes FOR SELECT TO authenticated
USING (
  auth.uid() = resident_id
  OR auth.jwt() ->> 'role' IN ('admin', 'guard')
);

DROP POLICY IF EXISTS "insert_own_passes" ON visitor_passes;
CREATE POLICY "insert_own_passes"
ON visitor_passes FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = resident_id
  OR auth.jwt() ->> 'role' = 'admin'
);

DROP POLICY IF EXISTS "update_own_passes" ON visitor_passes;
CREATE POLICY "update_own_passes"
ON visitor_passes FOR UPDATE TO authenticated
USING (
  auth.uid() = resident_id
  OR auth.jwt() ->> 'role' IN ('admin', 'guard')
)
WITH CHECK (true);

DROP POLICY IF EXISTS "delete_own_passes" ON visitor_passes;
CREATE POLICY "delete_own_passes"
ON visitor_passes FOR DELETE TO authenticated
USING (
  auth.uid() = resident_id
  OR auth.jwt() ->> 'role' = 'admin'
);
