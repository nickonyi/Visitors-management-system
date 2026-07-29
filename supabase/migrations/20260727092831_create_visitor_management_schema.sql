/*
# Visitor Management System Schema

Creates the data model for a residential visitor management application with
three roles (resident, guard, admin), visitor passes with QR codes, and check-in/check-out tracking.

## 1. New Tables

### profiles
Extends `auth.users` with application-specific data.
- `id` (uuid, primary key, references auth.users)
- `full_name` (text, not null) - display name of the user
- `role` (text, not null, default 'resident') - one of 'resident', 'guard', 'admin'
- `unit` (text, nullable) - apartment/unit number for residents
- `phone` (text, nullable) - contact phone
- `active` (boolean, default true) - whether the user can log in / is enabled
- `created_at` (timestamptz, default now())

### visitor_passes
A single visitor pass / invitation created by a resident.
- `id` (uuid, primary key)
- `resident_id` (uuid, references profiles) - the resident who created the pass
- `guest_name` (text, not null)
- `guest_phone` (text, nullable)
- `number_of_guests` (integer, default 1)
- `unit` (text, not null) - apartment/unit being visited
- `visit_date` (date, not null) - the date of the visit
- `arrival_time` (time, not null) - expected arrival time
- `expiry_time` (time, not null) - when the pass expires
- `vehicle_reg` (text, nullable) - vehicle registration plate
- `purpose` (text, nullable) - visit purpose
- `qr_token` (text, unique, not null) - unique token encoded in the QR code
- `status` (text, not null, default 'pending') - pending, checked_in, checked_out, expired, cancelled
- `checked_in_at` (timestamptz, nullable)
- `checked_out_at` (timestamptz, nullable)
- `checked_in_by` (uuid, nullable, references profiles) - guard who checked in
- `checked_out_by` (uuid, nullable, references profiles) - guard who checked out
- `cancelled_at` (timestamptz, nullable)
- `created_at` (timestamptz, default now())

## 2. Security (RLS)

- Enable RLS on both tables.
- profiles: users can read/update their own profile; admins can read/update all profiles; guards can read all profiles (need resident names for verification).
- visitor_passes: residents can CRUD their own passes; guards can read all passes and update check-in/out fields; admins can read/update all passes.

## 3. Important Notes

1. `qr_token` uses gen_random_uuid() as a default so each pass gets a unique unguessable token for the QR code.
2. `resident_id` defaults to auth.uid() so resident inserts that omit it still satisfy RLS.
3. Admins are identified by a sub-query on profiles.role = 'admin'.
4. Guards are identified by a sub-query on profiles.role = 'guard'.
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'resident' CHECK (role IN ('resident', 'guard', 'admin')),
  unit text,
  phone text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Helper to determine the requesting user's role
-- (used inside policies to avoid repeating subqueries)

-- profiles policies
DROP POLICY IF EXISTS "select_own_or_admin_profile" ON profiles;
CREATE POLICY "select_own_or_admin_profile"
ON profiles FOR SELECT TO authenticated
USING (
  auth.uid() = id
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'guard')
);

DROP POLICY IF EXISTS "update_own_or_admin_profile" ON profiles;
CREATE POLICY "update_own_or_admin_profile"
ON profiles FOR UPDATE TO authenticated
USING (
  auth.uid() = id
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
)
WITH CHECK (
  auth.uid() = id
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

DROP POLICY IF EXISTS "insert_profile_on_signup" ON profiles;
CREATE POLICY "insert_profile_on_signup"
ON profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

-- visitor_passes table
CREATE TABLE IF NOT EXISTS visitor_passes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resident_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  guest_name text NOT NULL,
  guest_phone text,
  number_of_guests integer NOT NULL DEFAULT 1 CHECK (number_of_guests > 0),
  unit text NOT NULL,
  visit_date date NOT NULL,
  arrival_time time NOT NULL,
  expiry_time time NOT NULL,
  vehicle_reg text,
  purpose text,
  qr_token text UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'checked_in', 'checked_out', 'expired', 'cancelled')),
  checked_in_at timestamptz,
  checked_out_at timestamptz,
  checked_in_by uuid REFERENCES profiles(id),
  checked_out_by uuid REFERENCES profiles(id),
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE visitor_passes ENABLE ROW LEVEL SECURITY;

-- Resident: own passes CRUD
DROP POLICY IF EXISTS "select_own_passes" ON visitor_passes;
CREATE POLICY "select_own_passes"
ON visitor_passes FOR SELECT TO authenticated
USING (
  auth.uid() = resident_id
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'guard'))
);

DROP POLICY IF EXISTS "insert_own_passes" ON visitor_passes;
CREATE POLICY "insert_own_passes"
ON visitor_passes FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = resident_id
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

DROP POLICY IF EXISTS "update_own_passes" ON visitor_passes;
CREATE POLICY "update_own_passes"
ON visitor_passes FOR UPDATE TO authenticated
USING (
  auth.uid() = resident_id
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role IN ('admin', 'guard'))
)
WITH CHECK (true);

DROP POLICY IF EXISTS "delete_own_passes" ON visitor_passes;
CREATE POLICY "delete_own_passes"
ON visitor_passes FOR DELETE TO authenticated
USING (
  auth.uid() = resident_id
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_visitor_passes_resident ON visitor_passes(resident_id);
CREATE INDEX IF NOT EXISTS idx_visitor_passes_status ON visitor_passes(status);
CREATE INDEX IF NOT EXISTS idx_visitor_passes_qr_token ON visitor_passes(qr_token);
CREATE INDEX IF NOT EXISTS idx_visitor_passes_visit_date ON visitor_passes(visit_date);
