-- Schedule system tables
-- Stores student commission selections (schedule data is in TypeScript files)

-- Student commission selections
CREATE TABLE IF NOT EXISTS student_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  commission_code TEXT NOT NULL,
  year INTEGER NOT NULL CHECK (year >= 1 AND year <= 5),
  semester INTEGER NOT NULL CHECK (semester IN (1, 2)),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, semester)
);

ALTER TABLE student_commissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sc_select_own" ON student_commissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "sc_insert_own" ON student_commissions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sc_update_own" ON student_commissions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "sc_delete_own" ON student_commissions FOR DELETE USING (auth.uid() = user_id);
