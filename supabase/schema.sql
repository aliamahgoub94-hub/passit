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

-- ─── CAA Sessions & Results ─────────────────────────────────

-- CAA sessions (one per student attempt at a standard)
create table if not exists caa_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references profiles on delete cascade not null,
  standard text not null check (standard in ('US32405', 'US32403', 'US32406')),
  score int,
  total int,
  completed boolean default false,
  created_at timestamptz default now()
);

-- Writing results (per-criterion for US32405)
create table if not exists writing_results (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references caa_sessions on delete cascade not null,
  criterion text not null check (criterion in ('ideas_content', 'structure_flow', 'tone_language', 'accuracy')),
  verdict text not null check (verdict in ('met', 'partial', 'missing')),
  feedback text not null,
  created_at timestamptz default now()
);

-- Reading results (per-question for US32403)
create table if not exists reading_results (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references caa_sessions on delete cascade not null,
  question_number int not null,
  outcome text not null check (outcome in ('outcome_1', 'outcome_2', 'outcome_3')),
  correct boolean not null,
  feedback text not null,
  created_at timestamptz default now()
);

-- Numeracy results (per-question for US32406)
create table if not exists numeracy_results (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references caa_sessions on delete cascade not null,
  question_number int not null,
  outcome text not null check (outcome in ('outcome_1', 'outcome_2', 'outcome_3')),
  correct boolean not null,
  feedback text not null,
  created_at timestamptz default now()
);

-- Parent links (parent to student relationship)
create table if not exists parent_links (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references profiles on delete cascade not null,
  student_id uuid references profiles on delete cascade not null,
  created_at timestamptz default now(),
  unique (parent_id, student_id)
);

-- ─── CAA & Parent RLS ───────────────────────────────────────

alter table caa_sessions     enable row level security;
alter table writing_results  enable row level security;
alter table reading_results  enable row level security;
alter table numeracy_results enable row level security;
alter table parent_links     enable row level security;

-- Students can view/insert their own CAA sessions
create policy "Students can view own caa_sessions"
  on caa_sessions for select using (auth.uid() = student_id);

create policy "Students can insert own caa_sessions"
  on caa_sessions for insert with check (auth.uid() = student_id);

create policy "Students can update own caa_sessions"
  on caa_sessions for update using (auth.uid() = student_id);

-- Writing results: accessible via session ownership
create policy "Students can view own writing_results"
  on writing_results for select using (
    exists (select 1 from caa_sessions where caa_sessions.id = writing_results.session_id and caa_sessions.student_id = auth.uid())
  );

create policy "Students can insert own writing_results"
  on writing_results for insert with check (
    exists (select 1 from caa_sessions where caa_sessions.id = writing_results.session_id and caa_sessions.student_id = auth.uid())
  );

-- Reading results: accessible via session ownership
create policy "Students can view own reading_results"
  on reading_results for select using (
    exists (select 1 from caa_sessions where caa_sessions.id = reading_results.session_id and caa_sessions.student_id = auth.uid())
  );

create policy "Students can insert own reading_results"
  on reading_results for insert with check (
    exists (select 1 from caa_sessions where caa_sessions.id = reading_results.session_id and caa_sessions.student_id = auth.uid())
  );

-- Numeracy results: accessible via session ownership
create policy "Students can view own numeracy_results"
  on numeracy_results for select using (
    exists (select 1 from caa_sessions where caa_sessions.id = numeracy_results.session_id and caa_sessions.student_id = auth.uid())
  );

create policy "Students can insert own numeracy_results"
  on numeracy_results for insert with check (
    exists (select 1 from caa_sessions where caa_sessions.id = numeracy_results.session_id and caa_sessions.student_id = auth.uid())
  );

-- Parent links
create policy "Parents can view own links"
  on parent_links for select using (auth.uid() = parent_id);

-- Parents can view linked student's CAA sessions
create policy "Parents can view linked student caa_sessions"
  on caa_sessions for select using (
    exists (select 1 from parent_links where parent_links.parent_id = auth.uid() and parent_links.student_id = caa_sessions.student_id)
  );

-- Parents can view linked student's writing results
create policy "Parents can view linked student writing_results"
  on writing_results for select using (
    exists (
      select 1 from caa_sessions
      join parent_links on parent_links.student_id = caa_sessions.student_id
      where caa_sessions.id = writing_results.session_id
      and parent_links.parent_id = auth.uid()
    )
  );

-- Parents can view linked student's reading results
create policy "Parents can view linked student reading_results"
  on reading_results for select using (
    exists (
      select 1 from caa_sessions
      join parent_links on parent_links.student_id = caa_sessions.student_id
      where caa_sessions.id = reading_results.session_id
      and parent_links.parent_id = auth.uid()
    )
  );

-- Parents can view linked student's numeracy results
create policy "Parents can view linked student numeracy_results"
  on numeracy_results for select using (
    exists (
      select 1 from caa_sessions
      join parent_links on parent_links.student_id = caa_sessions.student_id
      where caa_sessions.id = numeracy_results.session_id
      and parent_links.parent_id = auth.uid()
    )
  );

-- ─── Done ────────────────────────────────────────────────────
-- Tables: profiles, subjects, assessments, usage,
-- caa_sessions, writing_results, reading_results,
-- numeracy_results, parent_links
