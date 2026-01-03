import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL

// New publishable key (sb_publishable_...) with fallback to legacy anon key
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY

const isValidKey = (key) => {
  if (!key) return false
  // New publishable key format
  if (key.startsWith('sb_publishable_')) return true
  // Legacy anon key format (JWT starting with eyJ)
  if (key.startsWith('eyJ')) return true
  return false
}

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  !supabaseUrl.includes('your-project') &&
  isValidKey(supabaseKey)
)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : null

// Database schema - Run this SQL in Supabase SQL Editor:
/*

-- Members table (your team contacts)
CREATE TABLE members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shifts table (calendar assignments)
CREATE TABLE shifts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  shift_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- History table (audit log)
CREATE TABLE history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  member_name TEXT NOT NULL,
  shift_date DATE NOT NULL,
  action TEXT NOT NULL, -- 'assigned' or 'cancelled'
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) - Allow all for simplicity (no auth)
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE history ENABLE ROW LEVEL SECURITY;

-- Policies to allow all operations (since no auth required)
CREATE POLICY "Allow all" ON members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON shifts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON history FOR ALL USING (true) WITH CHECK (true);

-- Insert some sample members
INSERT INTO members (name, email, phone, color) VALUES
  ('Alice Johnson', 'alice@example.com', '555-0101', '#6366f1'),
  ('Bob Smith', 'bob@example.com', '555-0102', '#ec4899'),
  ('Carol Davis', 'carol@example.com', '555-0103', '#14b8a6'),
  ('David Lee', 'david@example.com', '555-0104', '#f59e0b'),
  ('Emma Wilson', 'emma@example.com', '555-0105', '#8b5cf6');

*/
