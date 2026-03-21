-- Create notes table
create table if not exists public.notes (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id text,
  subject_name text not null default '',
  subject_color text not null default '#6366f1',
  title text not null default '',
  date date not null,
  content text not null default '',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table public.notes enable row level security;

-- Policies
create policy "Users can view their own notes"
  on public.notes for select
  using (auth.uid() = user_id);

create policy "Users can insert their own notes"
  on public.notes for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own notes"
  on public.notes for update
  using (auth.uid() = user_id);

create policy "Users can delete their own notes"
  on public.notes for delete
  using (auth.uid() = user_id);

-- Indexes
create index if not exists notes_user_id_idx on public.notes(user_id);
create index if not exists notes_date_idx on public.notes(date);
create index if not exists notes_subject_id_idx on public.notes(subject_id);
