-- Minimal Supabase schema enforcing allowed profile roles
-- Run this in the Supabase SQL editor for your project.

-- Ensure pgcrypto is available for UUID generation (Supabase usually has this)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create a domain/enum for profile roles so only allowed values can exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'profile_role') THEN
    CREATE TYPE public.profile_role AS ENUM ('STUDENT', 'SECTION_ADVISOR', 'HOD');
  END IF;
END$$;

-- Profiles table: only allow the three roles via the enum
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE,
  email text,
  username text,
  role public.profile_role NOT NULL,
  section text,
  created_at timestamptz DEFAULT now()
);

-- Optional: students table (used by the app). Adapt columns to your needs.
CREATE TABLE IF NOT EXISTS public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reg_no text NOT NULL,
  name text NOT NULL,
  section text NOT NULL,
  official_email text,
  personal_email text,
  is_hosteller boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Example seed (use your real auth user id or remove user_id):
-- INSERT INTO public.profiles (user_id, email, username, role, section)
-- VALUES ('00000000-0000-0000-0000-000000000000', 'teacher@example.com', 'Ms. Smith', 'SECTION_ADVISOR', 'A');

-- Notes:
-- - The enum prevents inserting other role values into `profiles.role`.
-- - If you already have a `profiles` table with different role values, back it up
--   and migrate values to one of the allowed roles before applying this migration.

-- ------------------------------
-- Row Level Security + Helpers
-- ------------------------------

-- Helper: returns true when the currently authenticated user is a SECTION_ADVISOR or HOD
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()::uuid
      AND p.role IN ('SECTION_ADVISOR','HOD')
  );
$$;

-- Helper: returns true when the currently authenticated user is a STUDENT
CREATE OR REPLACE FUNCTION public.is_student() RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid()::uuid
      AND p.role = 'STUDENT'
  );
$$;

-- Enable row level security on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Remove existing policies (idempotent) and create new ones
DO $$
BEGIN
  -- drop if they exist to allow re-running the script safely
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'profiles_select_own_or_admin') THEN
    EXECUTE 'ALTER TABLE public.profiles DROP POLICY profiles_select_own_or_admin';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'profiles_insert_own_or_admin') THEN
    EXECUTE 'ALTER TABLE public.profiles DROP POLICY profiles_insert_own_or_admin';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'profiles_update_own_or_admin') THEN
    EXECUTE 'ALTER TABLE public.profiles DROP POLICY profiles_update_own_or_admin';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'profiles_delete_admin_only') THEN
    EXECUTE 'ALTER TABLE public.profiles DROP POLICY profiles_delete_admin_only';
  END IF;
END$$;

-- Allow users to SELECT their own profile, or admins to SELECT any profile
CREATE POLICY profiles_select_own_or_admin ON public.profiles
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      auth.uid()::uuid = user_id OR public.is_admin()
    )
  );

-- Allow users to INSERT their own profile (or admins), and ensure role is valid
CREATE POLICY profiles_insert_own_or_admin ON public.profiles
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND (
      auth.uid()::uuid = user_id OR public.is_admin()
    ) AND role IN ('STUDENT','SECTION_ADVISOR','HOD')
  );

-- Allow users to UPDATE their own profile, or admins to update any. Ensure role remains valid.
CREATE POLICY profiles_update_own_or_admin ON public.profiles
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND (
      auth.uid()::uuid = user_id OR public.is_admin()
    )
  ) WITH CHECK (
    role IN ('STUDENT','SECTION_ADVISOR','HOD')
  );

-- Only admins (SECTION_ADVISOR/HOD) may delete profiles
CREATE POLICY profiles_delete_admin_only ON public.profiles
  FOR DELETE USING ( public.is_admin() );

-- Notes:
-- - These policies assume `profiles.user_id` is stored as a `uuid`. If your column
--   uses `text`, remove the `::uuid` casts above (or change column type accordingly).
-- - The `WITH CHECK` clauses ensure that inserted/updated rows use only allowed role values.
-- - Front-end should still gate UI (student vs admin) by reading the profile after login.

-- Minimal schema for ARC_PWA
-- Tables: profiles, students, optional sections

-- 1) Profiles (maps Supabase Auth user -> ARC role/section)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  username text,
  role text not null default 'FACULTY',
  section text
);

-- 2) Students (store real student data; you can start with reg_no/name/section and add columns later)
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  reg_no text not null unique,
  name text not null,
  section text not null,
  dept text,
  year int,

  gender text,
  mobile text,
  alt_mobile text,
  official_email text,
  personal_email text,

  current_address text,
  permanent_address text,
  pincode text,
  state text,
  aadhar text,
  pan text,
  father_name text,
  mother_name text,

  tenth_percentage numeric,
  twelfth_percentage numeric,
  tenth_year text,
  twelfth_year text,

  gpa_sem1 numeric,
  gpa_sem2 numeric,
  gpa_sem3 numeric,
  cgpa_overall numeric,

  tech_stack text[],
  resume_url text,
  relocate text,
  category text,
  placement_status text,

  leetcode_id text,
  lc_total int,
  lc_easy int,
  lc_med int,
  lc_hard int,
  lc_rating int,
  lc_badges int,
  lc_max int,

  codechef_id text,
  cc_total int,
  cc_rank text,
  cc_badges int,
  cc_rating int,

  sr_problems int,
  sr_rank text,

  github text,
  linkedin text,

  coe_name text,
  coe_incharge text,
  coe_projects text,

  is_hosteller boolean
);

-- 3) Optional sections lookup (if you want controlled list)
create table if not exists public.sections (
  section text primary key
);

-- RLS (recommended): enable and create policies appropriate for your app.
-- For a quick start in development you can disable RLS, but don't do that in production.
-- alter table public.profiles enable row level security;
-- alter table public.students enable row level security;
-- alter table public.sections enable row level security;
