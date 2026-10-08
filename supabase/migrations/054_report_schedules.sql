-- 054 — Rapports programmés (envoi automatique par email, fichier Excel/CSV en pièce jointe)

create table if not exists public.report_schedules (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid references public.organizations(id) on delete cascade,   -- null = rapport plateforme (équipe IBIG)
  name        text not null,
  dataset     text not null,
  period      text not null default '30d',                                  -- 7d, 30d, 90d, 365d, all
  course_id   uuid references public.courses(id) on delete set null,
  columns     text[] not null default '{}',
  frequency   text not null check (frequency in ('weekly', 'monthly')),
  recipients  text[] not null,
  next_run_at timestamptz not null,
  last_run_at timestamptz,
  created_by  uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index if not exists report_schedules_due_idx on public.report_schedules(next_run_at);
alter table public.report_schedules enable row level security;
drop policy if exists report_schedules_read on public.report_schedules;
create policy report_schedules_read on public.report_schedules for select using (
  (org_id is null and public.is_staff(auth.uid())) or (org_id is not null and public.is_org_manager(org_id, auth.uid())));

notify pgrst, 'reload schema';
