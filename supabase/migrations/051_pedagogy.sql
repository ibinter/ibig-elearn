-- 051 — Pédagogie avancée : parcours séquentiel, diffusion progressive, évaluations à chaud, compétences

-- ── Progression imposée & diffusion progressive ─────────────
alter table public.courses add column if not exists is_sequential boolean not null default false;   -- modules dans l'ordre pour tous
alter table public.modules add column if not exists unlock_after_days integer check (unlock_after_days is null or unlock_after_days between 1 and 365);
alter table public.modules add column if not exists available_from date;

-- ── Évaluation de satisfaction (« à chaud », Kirkpatrick niveau 1) ──
create table if not exists public.course_evaluations (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.profiles(id) on delete cascade,
  course_id           uuid not null references public.courses(id) on delete cascade,
  content_rating      smallint not null check (content_rating between 1 and 5),
  instructor_rating   smallint not null check (instructor_rating between 1 and 5),
  applicability       smallint not null check (applicability between 1 and 5),   -- utilité pour le travail
  recommend_score     smallint not null check (recommend_score between 0 and 10), -- NPS
  comment             text check (comment is null or char_length(comment) <= 2000),
  created_at          timestamptz not null default now(),
  unique (user_id, course_id)
);
alter table public.course_evaluations enable row level security;
drop policy if exists course_evaluations_own on public.course_evaluations;
create policy course_evaluations_own on public.course_evaluations for select using (
  user_id = auth.uid() or public.is_staff(auth.uid())
  or exists (select 1 from public.courses c where c.id = course_evaluations.course_id and c.instructor_id = auth.uid()));

-- ── Référentiel de compétences ──────────────────────────────
create table if not exists public.skills (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  category    text,
  description text,
  created_at  timestamptz not null default now()
);
create table if not exists public.course_skills (
  course_id uuid not null references public.courses(id) on delete cascade,
  skill_id  uuid not null references public.skills(id) on delete cascade,
  level     smallint not null default 2 check (level between 1 and 3),   -- 1 notions · 2 opérationnel · 3 expert
  primary key (course_id, skill_id)
);
alter table public.skills enable row level security;
alter table public.course_skills enable row level security;
drop policy if exists skills_read on public.skills;
create policy skills_read on public.skills for select using (true);
drop policy if exists skills_staff on public.skills;
create policy skills_staff on public.skills for all using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
drop policy if exists course_skills_read on public.course_skills;
create policy course_skills_read on public.course_skills for select using (true);

-- Compétences acquises : niveau maximal parmi les formations terminées
create or replace view public.user_skills with (security_invoker = true) as
  select e.user_id, cs.skill_id, max(cs.level) as level, max(coalesce(e.completed_at, now())) as acquired_at
    from public.enrollments e
    join public.course_skills cs on cs.course_id = e.course_id
   where e.completed_at is not null or e.progress_percent >= 100
   group by e.user_id, cs.skill_id;

-- Référentiel initial (compétences métier courantes en Afrique francophone)
insert into public.skills (name, category) values
  ('Comptabilité SYSCOHADA', 'Finance'), ('Analyse financière', 'Finance'), ('Gestion de trésorerie', 'Finance'),
  ('Tableurs (Excel / Google Sheets)', 'Bureautique'), ('Analyse de données', 'Numérique'),
  ('Marketing digital', 'Commercial'), ('Vente et négociation', 'Commercial'), ('E-commerce', 'Commercial'),
  ('Management d''équipe', 'Management'), ('Leadership', 'Management'), ('Gestion de projet', 'Management'),
  ('Recrutement et gestion des talents', 'Ressources humaines'), ('Communication professionnelle', 'Communication'),
  ('Prise de parole en public', 'Communication'), ('Intelligence artificielle appliquée', 'Numérique'),
  ('Entrepreneuriat', 'Entreprise'), ('Finance personnelle', 'Finance')
on conflict (name) do nothing;

notify pgrst, 'reload schema';
