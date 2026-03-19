-- Drop existing tables and recreate without user_id requirement
DROP TABLE IF EXISTS study_sessions CASCADE;
DROP TABLE IF EXISTS subject_files CASCADE;
DROP TABLE IF EXISTS exam_topics CASCADE;
DROP TABLE IF EXISTS exams CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;

-- Create subjects table (no user_id)
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tasks table (no user_id)
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  due_date DATE NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create exams table (no user_id)
CREATE TABLE exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  date DATE NOT NULL,
  time TEXT,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create exam_topics table
CREATE TABLE exam_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create subject_files table (no user_id)
CREATE TABLE subject_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  size INTEGER NOT NULL,
  data TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create study_sessions table (no user_id)
CREATE TABLE study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  duration INTEGER NOT NULL,
  date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS but allow all operations (no auth required)
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE subject_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies that allow all operations
CREATE POLICY "Allow all on subjects" ON subjects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on tasks" ON tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on exams" ON exams FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on exam_topics" ON exam_topics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on subject_files" ON subject_files FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on study_sessions" ON study_sessions FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_completed ON tasks(completed);
CREATE INDEX idx_exams_date ON exams(date);
CREATE INDEX idx_exam_topics_exam_id ON exam_topics(exam_id);
CREATE INDEX idx_subject_files_subject_id ON subject_files(subject_id);
CREATE INDEX idx_study_sessions_date ON study_sessions(date);
