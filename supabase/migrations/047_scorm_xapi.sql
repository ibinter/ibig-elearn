-- 047 — Standards e-learning : paquets SCORM 1.2 / 2004 et suivi xAPI (Tin Can)

-- ── Paquets importés ────────────────────────────────────────
create table if not exists public.scorm_packages (
  id           uuid primary key default gen_random_uuid(),
  course_id    uuid not null references public.courses(id) on delete cascade,
  title        text not null,
  standard     text not null check (standard in ('scorm12', 'scorm2004', 'xapi')),
  launch_path  text not null,                 -- chemin du fichier de lancement dans le paquet
  activity_id  text,                          -- identifiant d'activité xAPI (tincan.xml)
  mastery_score numeric,                      -- seuil de réussite déclaré par le paquet
  file_count   integer not null default 0,
  size_bytes   bigint not null default 0,
  uploaded_by  uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now()
);
create index if not exists scorm_packages_course_idx on public.scorm_packages(course_id);

alter table public.lessons add column if not exists scorm_package_id uuid references public.scorm_packages(id) on delete set null;

-- Le type de leçon « scorm » s'ajoute aux types existants (si une contrainte de type existe)
do $$
declare c record;
begin
  for c in select conname from pg_constraint
            where conrelid = 'public.lessons'::regclass and contype = 'c' and pg_get_constraintdef(oid) ilike '%type%'
  loop
    execute format('alter table public.lessons drop constraint %I', c.conname);
  end loop;
end $$;
alter table public.lessons add constraint lessons_type_check
  check (type in ('video', 'document', 'text', 'pdf', 'quiz', 'assignment', 'final_exam', 'audio', 'code', 'live', 'scorm')) not valid;

-- ── Tentatives (données CMI de l'apprenant) ─────────────────
create table if not exists public.scorm_attempts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  package_id    uuid not null references public.scorm_packages(id) on delete cascade,
  lesson_id     uuid not null references public.lessons(id) on delete cascade,
  cmi           jsonb not null default '{}',
  status        text not null default 'not attempted',   -- completed / passed / failed / incomplete / browsed
  score_raw     numeric,
  score_scaled  numeric,
  total_time_s  integer not null default 0,
  completed_at  timestamptz,
  updated_at    timestamptz not null default now(),
  created_at    timestamptz not null default now(),
  unique (user_id, package_id)
);
alter table public.scorm_attempts enable row level security;
drop policy if exists scorm_attempts_select on public.scorm_attempts;
create policy scorm_attempts_select on public.scorm_attempts
  for select using (user_id = auth.uid() or public.is_staff(auth.uid())
    or exists (select 1 from public.scorm_packages p join public.courses c on c.id = p.course_id
                where p.id = scorm_attempts.package_id and c.instructor_id = auth.uid()));

alter table public.scorm_packages enable row level security;
drop policy if exists scorm_packages_select on public.scorm_packages;
create policy scorm_packages_select on public.scorm_packages for select using (true);

-- ── Déclarations xAPI (LRS intégré) ─────────────────────────
create table if not exists public.xapi_statements (
  id           uuid primary key,
  user_id      uuid references public.profiles(id) on delete cascade,
  lesson_id    uuid references public.lessons(id) on delete cascade,
  verb         text not null,
  activity_id  text,
  statement    jsonb not null,
  stored_at    timestamptz not null default now()
);
create index if not exists xapi_statements_user_idx on public.xapi_statements(user_id, lesson_id);

create table if not exists public.xapi_state (
  user_id      uuid not null references public.profiles(id) on delete cascade,
  activity_id  text not null,
  state_id     text not null,
  registration text not null default '',
  content      text,
  content_type text,
  updated_at   timestamptz not null default now(),
  primary key (user_id, activity_id, state_id, registration)
);
alter table public.xapi_statements enable row level security;
alter table public.xapi_state enable row level security;
drop policy if exists xapi_statements_select on public.xapi_statements;
create policy xapi_statements_select on public.xapi_statements
  for select using (user_id = auth.uid() or public.is_staff(auth.uid()));

-- ── Stockage privé des paquets ──────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit)
values ('scorm', 'scorm', false, 524288000)
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit;

notify pgrst, 'reload schema';
