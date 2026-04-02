-- ─────────────────────────────────────────────
-- PASSIT DATABASE SCHEMA
-- Paste this entire file into Supabase SQL Editor
-- and click Run
-- ─────────────────────────────────────────────

-- Profiles (one per student, linked to auth)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  ncea_level int check (ncea_level in (1, 2, 3)),
  is_pro boolean default false,
  onboarding_complete boolean default false,
  created_at timestamptz default now()
);

-- Subjects (e.g. "English Level 2")
create table if not exists subjects (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references profiles on delete cascade not null,
  name text not null,
  level int check (level in (1, 2, 3)) not null,
  created_at timestamptz default now()
);

-- Assessments (one row per standard attempted)
create table if not exists assessments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references profiles on delete cascade not null,
  subject_id uuid references subjects on delete cascade not null,
  as_number text,                        -- e.g. "91261"
  title text not null,                   -- e.g. "Algebra"
  credits int not null default 4,
  grade text check (
    grade in ('Achieved', 'Merit', 'Excellence', 'Not Achieved')
  ),                                     -- null = not yet graded
  is_internal boolean default true,
  due_date date,
  created_at timestamptz default now()
);

-- AI usage tracking (for free tier 5 msg/day limit)
create table if not exists usage (
  student_id uuid references profiles on delete cascade not null,
  date date not null default current_date,
  message_count int default 0,
  primary key (student_id, date)
);

-- ─── Auto-create profile on signup ───────────────────────────
-- This trigger fires when a new user signs up via Supabase Auth
-- so we don't have to manually create the profile row.

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Row Level Security ───────────────────────────────────────
-- Students can only ever see and edit their own data.

alter table profiles    enable row level security;
alter table subjects    enable row level security;
alter table assessments enable row level security;
alter table usage       enable row level security;

-- Profiles
create policy "Students can view own profile"
  on profiles for select using (auth.uid() = id);

create policy "Students can update own profile"
  on profiles for update using (auth.uid() = id);

-- Subjects
create policy "Students can view own subjects"
  on subjects for select using (auth.uid() = student_id);

create policy "Students can insert own subjects"
  on subjects for insert with check (auth.uid() = student_id);

create policy "Students can update own subjects"
  on subjects for update using (auth.uid() = student_id);

create policy "Students can delete own subjects"
  on subjects for delete using (auth.uid() = student_id);

-- Assessments
create policy "Students can view own assessments"
  on assessments for select using (auth.uid() = student_id);

create policy "Students can insert own assessments"
  on assessments for insert with check (auth.uid() = student_id);

create policy "Students can update own assessments"
  on assessments for update using (auth.uid() = student_id);

create policy "Students can delete own assessments"
  on assessments for delete using (auth.uid() = student_id);

-- Usage
create policy "Students can view own usage"
  on usage for select using (auth.uid() = student_id);

create policy "Students can insert own usage"
  on usage for insert with check (auth.uid() = student_id);

create policy "Students can update own usage"
  on usage for update using (auth.uid() = student_id);

-- ─── Done ────────────────────────────────────────────────────
-- You should see 4 tables in the Table Editor:
-- profiles, subjects, assessments, usage
