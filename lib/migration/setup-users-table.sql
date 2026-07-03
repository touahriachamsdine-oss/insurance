-- ============================================================
-- Migration: Remove Supabase auth.users dependency
-- Creates a public.users table with all profile fields flattened
-- Run: psql $DATABASE_URL -f lib/migration/setup-users-table.sql
-- Or use the Neon SQL editor
-- ============================================================

-- 1. Create the public.users table (replaces auth.users + public.profiles)
CREATE TABLE IF NOT EXISTS public.users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'client',
  is_active     BOOLEAN NOT NULL DEFAULT false,

  -- Profile fields (formerly in public.profiles)
  full_name_ar    TEXT,
  full_name_en    TEXT,
  phone           TEXT,
  wilaya_code     TEXT,
  national_id     TEXT,
  cin             TEXT,

  -- Company fields
  company_id      UUID REFERENCES public.companies(id) ON DELETE SET NULL,

  -- Broker-specific
  broker_license  TEXT,

  -- Assessor-specific
  assessor_license   TEXT,
  assessor_specialty TEXT,

  -- Agent-specific
  agent_wilaya    TEXT,

  -- Metadata
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users (role);
CREATE INDEX IF NOT EXISTS idx_users_company_id ON public.users (company_id);
CREATE INDEX IF NOT EXISTS idx_users_national_id ON public.users (national_id);

-- 2. Migrate existing data from auth.users + public.profiles (if they exist)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
    INSERT INTO public.users (id, email, password_hash, role, is_active, full_name_ar, full_name_en, phone, wilaya_code, national_id, company_id, broker_license, assessor_license, assessor_specialty, created_at, updated_at)
    SELECT
      u.id,
      u.email,
      u.password_hash,
      COALESCE(p.role, u.raw_user_meta_data->>'role', 'client'),
      COALESCE(p.is_active, (u.raw_user_meta_data->>'is_active')::boolean, false),
      COALESCE(p.full_name_ar, u.raw_user_meta_data->>'full_name_ar'),
      COALESCE(p.full_name_en, u.raw_user_meta_data->>'full_name_en'),
      COALESCE(p.phone, u.raw_user_meta_data->>'phone'),
      COALESCE(p.wilaya_code, u.raw_user_meta_data->>'wilaya_code'),
      COALESCE(p.national_id, u.raw_user_meta_data->>'national_id'),
      COALESCE(p.company_id, (u.raw_user_meta_data->>'company_id')::uuid),
      u.raw_user_meta_data->>'broker_license',
      u.raw_user_meta_data->>'assessor_license',
      u.raw_user_meta_data->>'assessor_specialty',
      COALESCE(p.created_at, NOW()),
      COALESCE(p.updated_at, NOW())
    FROM auth.users u
    LEFT JOIN public.profiles p ON u.id = p.id
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;