-- 049 — Formation obligatoire & conformité
--   • parcours d'équipe obligatoires avec échéance (cohorts.end_date)
--   • durée de validité des certificats et recertification
--   • journal des relances (aucune relance envoyée deux fois)

alter table public.cohorts add column if not exists is_mandatory boolean not null default false;

-- Échéance propre à chaque inscription (reprise de l'échéance du parcours obligatoire)
alter table public.enrollments add column if not exists due_date date;
create index if not exists enrollments_due_idx on public.enrollments(due_date) where due_date is not null and completed_at is null;

-- Validité des certificats : null = permanent
alter table public.courses add column if not exists certificate_validity_months integer
  check (certificate_validity_months is null or certificate_validity_months between 1 and 120);

-- Recertification : un certificat remplacé reste dans l'historique ; un seul certificat « courant » par formation
alter table public.certificates add column if not exists superseded_at timestamptz;
alter table public.certificates drop constraint if exists certificates_user_id_course_id_key;
create unique index if not exists certificates_current_uidx on public.certificates(user_id, course_id) where superseded_at is null;
create index if not exists certificates_expiry_idx on public.certificates(expires_at) where expires_at is not null and superseded_at is null;

create table if not exists public.compliance_reminders (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  ref_id     text not null,                 -- inscription, certificat ou « organisation:semaine »
  kind       text not null,                 -- due_7d, due_1d, overdue, manager_overdue, expiry_30d, expired
  sent_at    timestamptz not null default now(),
  unique (user_id, ref_id, kind)
);
alter table public.compliance_reminders enable row level security;
drop policy if exists compliance_reminders_staff on public.compliance_reminders;
create policy compliance_reminders_staff on public.compliance_reminders for select using (public.is_staff(auth.uid()));

notify pgrst, 'reload schema';
