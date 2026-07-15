-- Region-scoped scheduling setup.
-- Run this script in the Supabase SQL Editor. It is safe to run more than once.

BEGIN;

CREATE TABLE IF NOT EXISTS public.region_cities (
  city TEXT PRIMARY KEY,
  region_name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL CHECK (latitude BETWEEN -90 AND 90),
  longitude DOUBLE PRECISION NOT NULL CHECK (longitude BETWEEN -180 AND 180),
  radius_miles NUMERIC(5, 2) NOT NULL CHECK (radius_miles > 0)
);

CREATE INDEX IF NOT EXISTS idx_region_cities_region_name
  ON public.region_cities (region_name);

INSERT INTO public.region_cities (
  region_name,
  city,
  latitude,
  longitude,
  radius_miles
)
VALUES
  ('central_texas', 'austin', 30.2672, -97.7431, 50.00),
  ('central_texas', 'killeen', 31.1171, -97.7278, 25.00),
  ('central_texas', 'waco', 31.5493, -97.1467, 25.00)
ON CONFLICT (city) DO UPDATE
SET
  region_name = EXCLUDED.region_name,
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  radius_miles = EXCLUDED.radius_miles;

-- Canonical region names keep regional records from referring to arbitrary
-- text values. City rows remain the source for selectable regions.
CREATE TABLE IF NOT EXISTS public.regions (
  region_name TEXT PRIMARY KEY
);

INSERT INTO public.regions (region_name)
SELECT DISTINCT region_name
FROM public.region_cities
ON CONFLICT (region_name) DO NOTHING;

-- Current application code uses soft deletes. Adding this column also makes
-- this script compatible with projects initially created from the README.
ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_members_deleted_at
  ON public.members (deleted_at);

ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS region_name TEXT;

UPDATE public.members
SET region_name = 'central_texas'
WHERE region_name IS NULL;

ALTER TABLE public.members
  ALTER COLUMN region_name SET DEFAULT 'central_texas',
  ALTER COLUMN region_name SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.members'::regclass
      AND conname = 'members_region_name_fkey'
  ) THEN
    ALTER TABLE public.members
      ADD CONSTRAINT members_region_name_fkey
      FOREIGN KEY (region_name) REFERENCES public.regions (region_name);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.members'::regclass
      AND conname = 'members_id_region_name_key'
  ) THEN
    ALTER TABLE public.members
      ADD CONSTRAINT members_id_region_name_key
      UNIQUE (id, region_name);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_members_region_name_deleted_at
  ON public.members (region_name, deleted_at);

ALTER TABLE public.shifts
  ADD COLUMN IF NOT EXISTS region_name TEXT;

UPDATE public.shifts
SET region_name = 'central_texas'
WHERE region_name IS NULL;

ALTER TABLE public.shifts
  ALTER COLUMN region_name SET DEFAULT 'central_texas',
  ALTER COLUMN region_name SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.shifts'::regclass
      AND conname = 'shifts_region_name_fkey'
  ) THEN
    ALTER TABLE public.shifts
      ADD CONSTRAINT shifts_region_name_fkey
      FOREIGN KEY (region_name) REFERENCES public.regions (region_name);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.shifts'::regclass
      AND conname = 'shifts_member_id_region_name_fkey'
  ) THEN
    ALTER TABLE public.shifts
      ADD CONSTRAINT shifts_member_id_region_name_fkey
      FOREIGN KEY (member_id, region_name)
      REFERENCES public.members (id, region_name)
      ON DELETE CASCADE;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_shifts_region_name_shift_date
  ON public.shifts (region_name, shift_date);

ALTER TABLE public.history
  ADD COLUMN IF NOT EXISTS region_name TEXT;

UPDATE public.history
SET region_name = 'central_texas'
WHERE region_name IS NULL;

ALTER TABLE public.history
  ALTER COLUMN region_name SET DEFAULT 'central_texas',
  ALTER COLUMN region_name SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.history'::regclass
      AND conname = 'history_region_name_fkey'
  ) THEN
    ALTER TABLE public.history
      ADD CONSTRAINT history_region_name_fkey
      FOREIGN KEY (region_name) REFERENCES public.regions (region_name);
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_history_region_name_created_at
  ON public.history (region_name, created_at DESC);

-- The existing pages read this view for active members. security_invoker keeps
-- the view subject to the members table's existing RLS policies.
CREATE OR REPLACE VIEW public.active_members
WITH (security_invoker = true) AS
SELECT
  id,
  name,
  email,
  phone,
  color,
  created_at,
  region_name
FROM public.members
WHERE deleted_at IS NULL;

GRANT SELECT ON public.active_members TO anon, authenticated;

-- The browser only reads region mappings. It cannot create or change them.
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.regions FROM anon, authenticated;

ALTER TABLE public.region_cities ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.region_cities FROM anon, authenticated;
GRANT SELECT ON TABLE public.region_cities TO anon, authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'region_cities'
      AND policyname = 'Region cities are readable by public clients'
  ) THEN
    CREATE POLICY "Region cities are readable by public clients"
      ON public.region_cities
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;
END
$$;

COMMIT;

-- Verification queries (run after the setup completes):
-- SELECT region_name, city, latitude, longitude, radius_miles
-- FROM public.region_cities
-- ORDER BY region_name, city;
--
-- SELECT table_name, column_name, is_nullable
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
--   AND table_name IN ('members', 'shifts', 'history')
--   AND column_name = 'region_name'
-- ORDER BY table_name;
--
-- SELECT 'members' AS table_name, count(*) AS rows_without_region
-- FROM public.members WHERE region_name IS NULL
-- UNION ALL
-- SELECT 'shifts', count(*) FROM public.shifts WHERE region_name IS NULL
-- UNION ALL
-- SELECT 'history', count(*) FROM public.history WHERE region_name IS NULL;
--
-- SELECT policyname, roles, cmd
-- FROM pg_policies
-- WHERE schemaname = 'public' AND tablename = 'region_cities';
