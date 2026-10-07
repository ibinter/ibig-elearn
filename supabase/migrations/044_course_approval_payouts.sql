-- 044 — Colonnes de validation des formations + demandes de virement
-- Le trigger guard_course_publication (042) référence ces colonnes, absentes en production
-- (wave17 jamais appliquée) : toute création/modification de formation par un partenaire échouait.

-- ── Validation des formations ───────────────────────────────
alter table public.courses add column if not exists approval_status text not null default 'draft';
alter table public.courses add column if not exists approval_note   text;
alter table public.courses add column if not exists submitted_at    timestamptz;
alter table public.courses add column if not exists approved_at     timestamptz;
alter table public.courses add column if not exists approved_by     uuid references public.profiles(id);

do $$ begin
  alter table public.courses add constraint courses_approval_status_check
    check (approval_status in ('draft', 'pending', 'approved', 'rejected'));
exception when duplicate_object then null; end $$;

-- Les formations déjà en ligne sont considérées comme validées
update public.courses set approval_status = 'approved', approved_at = coalesce(approved_at, updated_at)
 where is_published and approval_status = 'draft';

create index if not exists courses_approval_idx on public.courses(approval_status) where approval_status = 'pending';

-- ── Demandes de virement ────────────────────────────────────
create table if not exists public.payout_requests (
  id            uuid primary key default gen_random_uuid(),
  instructor_id uuid not null references public.profiles(id) on delete cascade,
  amount        bigint not null check (amount > 0),
  method        text not null,
  phone         text,
  notes         text,
  status        text not null default 'pending' check (status in ('pending', 'approved', 'paid', 'rejected')),
  admin_note    text,
  processed_at  timestamptz,
  processed_by  uuid references public.profiles(id),
  created_at    timestamptz not null default now()
);
create index if not exists payout_requests_instructor_idx on public.payout_requests(instructor_id, created_at desc);

alter table public.payout_requests enable row level security;

drop policy if exists payout_own on public.payout_requests;
create policy payout_own on public.payout_requests
  for select using (instructor_id = auth.uid() or public.is_staff(auth.uid()));

-- Un formateur ne peut demander plus que son solde, déduction faite des demandes en attente
drop policy if exists payout_insert on public.payout_requests;
create policy payout_insert on public.payout_requests
  for insert with check (
    instructor_id = auth.uid()
    and status = 'pending'
    and amount <= (
      select coalesce(p.payout_balance_xof, 0) - coalesce((
        select sum(r.amount) from public.payout_requests r
         where r.instructor_id = auth.uid() and r.status in ('pending', 'approved')), 0)
        from public.profiles p where p.id = auth.uid())
  );

drop policy if exists payout_admin on public.payout_requests;
create policy payout_admin on public.payout_requests
  for all using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));
