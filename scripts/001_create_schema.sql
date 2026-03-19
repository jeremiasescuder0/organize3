-- StudyFlow Database Schema
-- Tables for subjects, tasks, exams, study sessions, and thesis

-- Subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  is_thesis BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subjects_select_own" ON subjects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "subjects_insert_own" ON subjects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "subjects_update_own" ON subjects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "subjects_delete_own" ON subjects FOR DELETE USING (auth.uid() = user_id);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  status TEXT CHECK (status IN ('pending', 'in_progress', 'done')) DEFAULT 'pending',
  due_date DATE,
  estimated_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tasks_select_own" ON tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "tasks_insert_own" ON tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tasks_update_own" ON tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "tasks_delete_own" ON tasks FOR DELETE USING (auth.uid() = user_id);

-- Exams table
CREATE TABLE IF NOT EXISTS exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  exam_date DATE NOT NULL,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  topics TEXT[] DEFAULT '{}',
  location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exams_select_own" ON exams FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "exams_insert_own" ON exams FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "exams_update_own" ON exams FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "exams_delete_own" ON exams FOR DELETE USING (auth.uid() = user_id);

-- Study Sessions table
CREATE TABLE IF NOT EXISTS study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  duration_minutes INTEGER NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sessions_select_own" ON study_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "sessions_insert_own" ON study_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sessions_update_own" ON study_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "sessions_delete_own" ON study_sessions FOR DELETE USING (auth.uid() = user_id);

-- Thesis table
CREATE TABLE IF NOT EXISTS thesis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Mi Tesis',
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  deadline DATE,
  milestones JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE thesis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "thesis_select_own" ON thesis FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "thesis_insert_own" ON thesis FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "thesis_update_own" ON thesis FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "thesis_delete_own" ON thesis FOR DELETE USING (auth.uid() = user_id);

-- Subject Files table (for uploaded materials)
CREATE TABLE IF NOT EXISTS subject_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  file_data TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE subject_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "files_select_own" ON subject_files FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "files_insert_own" ON subject_files FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "files_update_own" ON subject_files FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "files_delete_own" ON subject_files FOR DELETE USING (auth.uid() = user_id);
