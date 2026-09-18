-- ============================================
-- BATCH 2 : Quiz, Live Sessions, Loyalty, Transcriptions
-- ============================================

-- 1. Quiz questions
create table if not exists quiz_questions (
  id uuid default gen_random_uuid() primary key,
  lesson_id uuid references lessons(id) on delete cascade,
  course_id uuid references courses(id) on delete cascade,
  question text not null,
  type text not null default 'mcq' check (type in ('mcq', 'true_false')),
  options jsonb not null default '[]',
  correct_option int not null,
  explanation text,
  position int not null default 0,
  created_at timestamptz default now()
);

alter table lessons add column if not exists quiz_passing_score int not null default 70;

create table if not exists quiz_attempts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  lesson_id uuid references lessons(id) on delete cascade,
  answers jsonb not null default '[]',
  score int not null,
  passed boolean not null default false,
  created_at timestamptz default now()
);

alter table quiz_questions enable row level security;
drop policy if exists "Quiz questions readable" on quiz_questions;
create policy "Quiz questions readable" on quiz_questions for select using (true);
drop policy if exists "Formateurs manage quiz questions" on quiz_questions;
create policy "Formateurs manage quiz questions" on quiz_questions for all using (
  exists (select 1 from courses where courses.id = quiz_questions.course_id and courses.instructor_id = auth.uid())
  or exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role in ('admin', 'coordinateur'))
);

alter table quiz_attempts enable row level security;
drop policy if exists "Own quiz attempts select" on quiz_attempts;
create policy "Own quiz attempts select" on quiz_attempts for select using (auth.uid() = user_id);
drop policy if exists "Own quiz attempts insert" on quiz_attempts;
create policy "Own quiz attempts insert" on quiz_attempts for insert with check (auth.uid() = user_id);

-- 2. Live sessions (Zoom / Google Meet)
create table if not exists live_sessions (
  id uuid default gen_random_uuid() primary key,
  course_id uuid references courses(id) on delete cascade,
  instructor_id uuid references auth.users(id),
  title text not null,
  description text,
  scheduled_at timestamptz not null,
  duration_minutes int not null default 60,
  meeting_url text not null,
  platform text not null default 'zoom' check (platform in ('zoom', 'meet', 'other')),
  is_recorded boolean default false,
  recording_url text,
  created_at timestamptz default now()
);

alter table live_sessions enable row level security;
drop policy if exists "Live sessions readable" on live_sessions;
create policy "Live sessions readable" on live_sessions for select using (
  exists (select 1 from enrollments where enrollments.course_id = live_sessions.course_id and enrollments.user_id = auth.uid())
  or exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role in ('admin', 'coordinateur', 'formateur'))
  or live_sessions.instructor_id = auth.uid()
);
drop policy if exists "Instructors manage live sessions" on live_sessions;
create policy "Instructors manage live sessions" on live_sessions for all using (
  auth.uid() = instructor_id
  or exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role in ('admin', 'coordinateur'))
);

-- 3. Loyalty / Fidélité
create table if not exists loyalty_points (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  points int not null,
  reason text not null,
  reference_id uuid,
  created_at timestamptz default now()
);

alter table loyalty_points enable row level security;
drop policy if exists "Own loyalty points select" on loyalty_points;
create policy "Own loyalty points select" on loyalty_points for select using (auth.uid() = user_id);
drop policy if exists "Insert loyalty points" on loyalty_points;
create policy "Insert loyalty points" on loyalty_points for insert with check (true);

alter table profiles add column if not exists loyalty_points_total int not null default 0;

create or replace function add_loyalty_points(p_user_id uuid, p_points int, p_reason text, p_reference_id uuid default null)
returns void language plpgsql security definer as $$
begin
  insert into loyalty_points (user_id, points, reason, reference_id) values (p_user_id, p_points, p_reason, p_reference_id);
  update profiles set loyalty_points_total = loyalty_points_total + p_points where id = p_user_id;
end;
$$;

-- 4. Transcriptions / Sous-titres
alter table lessons add column if not exists transcript text;
alter table lessons add column if not exists subtitle_url text;
alter table lessons add column if not exists transcription_status text default 'none' check (transcription_status in ('none', 'pending', 'done', 'error'));
