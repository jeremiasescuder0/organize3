-- Create tasks table
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  subject text not null,
  priority text not null check (priority in ('high', 'medium', 'low')),
  due_date date,
  completed boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create exams table
create table if not exists public.exams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null,
  date date not null,
  time text,
  location text,
  notes text,
  topics text[] default '{}',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create subjects table
create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create files table
create table if not exists public.files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  name text not null,
  type text not null,
  size integer not null,
  data text not null,
  created_at timestamp with time zone default now()
);

-- Create study sessions table
create table if not exists public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  duration integer not null,
  date timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table public.tasks enable row level security;
alter table public.exams enable row level security;
alter table public.subjects enable row level security;
alter table public.files enable row level security;
alter table public.study_sessions enable row level security;

-- Create policies for tasks
create policy "Users can view their own tasks"
  on public.tasks for select
  using (auth.uid() = user_id);

create policy "Users can insert their own tasks"
  on public.tasks for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own tasks"
  on public.tasks for update
  using (auth.uid() = user_id);

create policy "Users can delete their own tasks"
  on public.tasks for delete
  using (auth.uid() = user_id);

-- Create policies for exams
create policy "Users can view their own exams"
  on public.exams for select
  using (auth.uid() = user_id);

create policy "Users can insert their own exams"
  on public.exams for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own exams"
  on public.exams for update
  using (auth.uid() = user_id);

create policy "Users can delete their own exams"
  on public.exams for delete
  using (auth.uid() = user_id);

-- Create policies for subjects
create policy "Users can view their own subjects"
  on public.subjects for select
  using (auth.uid() = user_id);

create policy "Users can insert their own subjects"
  on public.subjects for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own subjects"
  on public.subjects for update
  using (auth.uid() = user_id);

create policy "Users can delete their own subjects"
  on public.subjects for delete
  using (auth.uid() = user_id);

-- Create policies for files
create policy "Users can view their own files"
  on public.files for select
  using (auth.uid() = user_id);

create policy "Users can insert their own files"
  on public.files for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own files"
  on public.files for delete
  using (auth.uid() = user_id);

-- Create policies for study sessions
create policy "Users can view their own study sessions"
  on public.study_sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own study sessions"
  on public.study_sessions for insert
  with check (auth.uid() = user_id);

-- Create indexes for better performance
create index if not exists tasks_user_id_idx on public.tasks(user_id);
create index if not exists tasks_due_date_idx on public.tasks(due_date);
create index if not exists exams_user_id_idx on public.exams(user_id);
create index if not exists exams_date_idx on public.exams(date);
create index if not exists subjects_user_id_idx on public.subjects(user_id);
create index if not exists files_user_id_idx on public.files(user_id);
create index if not exists files_subject_id_idx on public.files(subject_id);
create index if not exists study_sessions_user_id_idx on public.study_sessions(user_id);
create index if not exists study_sessions_date_idx on public.study_sessions(date);
