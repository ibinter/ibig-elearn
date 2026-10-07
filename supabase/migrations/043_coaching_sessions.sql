-- ============================================================
-- 043 — Séances de coaching individuelles (réservables et payantes)
--
-- Offres de coaching (partenaires IBIG EDUFORM) → disponibilités hebdomadaires
-- → réservation d'un créneau → paiement (circuit existant) → visio → revenus partagés.
-- Idempotent.
-- ============================================================

-- ── Offres ──────────────────────────────────────────────────
create table if not exists public.coaching_offers (
  id            uuid primary key default gen_random_uuid(),
  coach_id      uuid not null references public.profiles(id) on delete cascade,
  title         text not null check (char_length(title) between 5 and 120),
  description   text not null,
  category      text,
  duration_min  integer not null check (duration_min in (30, 45, 60, 90, 120)),
  price_xof     integer not null default 0 check (price_xof >= 0),
  language      text not null default 'fr',
  format        text not null default 'video' check (format in ('video', 'phone')),
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists coaching_offers_coach_idx on public.coaching_offers(coach_id);

alter table public.coaching_offers enable row level security;

drop policy if exists "Offres actives publiques" on public.coaching_offers;
create policy "Offres actives publiques" on public.coaching_offers
  for select using (is_active or coach_id = auth.uid() or public.is_staff(auth.uid()));

drop policy if exists "Partenaire gère ses offres" on public.coaching_offers;
create policy "Partenaire gère ses offres" on public.coaching_offers
  for all using (coach_id = auth.uid() or public.is_staff(auth.uid()))
  with check (
    public.is_staff(auth.uid())
    or (coach_id = auth.uid() and exists (select 1 from public.profiles where id = auth.uid() and is_partner))
  );

-- ── Disponibilités hebdomadaires du coach ───────────────────
alter table public.profiles add column if not exists timezone text not null default 'Africa/Abidjan';

create table if not exists public.coach_availability (
  id          uuid primary key default gen_random_uuid(),
  coach_id    uuid not null references public.profiles(id) on delete cascade,
  weekday     smallint not null check (weekday between 0 and 6),   -- 0 = dimanche
  start_time  time not null,
  end_time    time not null check (end_time > start_time),
  created_at  timestamptz not null default now()
);
create index if not exists coach_availability_coach_idx on public.coach_availability(coach_id, weekday);

alter table public.coach_availability enable row level security;

drop policy if exists "Disponibilités publiques" on public.coach_availability;
create policy "Disponibilités publiques" on public.coach_availability for select using (true);

drop policy if exists "Coach gère ses disponibilités" on public.coach_availability;
create policy "Coach gère ses disponibilités" on public.coach_availability
  for all using (coach_id = auth.uid() or public.is_staff(auth.uid()))
  with check (coach_id = auth.uid() or public.is_staff(auth.uid()));

-- ── Réservations ────────────────────────────────────────────
create table if not exists public.coaching_bookings (
  id            uuid primary key default gen_random_uuid(),
  offer_id      uuid not null references public.coaching_offers(id) on delete restrict,
  coach_id      uuid not null references public.profiles(id),
  learner_id    uuid not null references public.profiles(id),
  starts_at     timestamptz not null,
  ends_at       timestamptz not null check (ends_at > starts_at),
  status        text not null default 'pending_payment'
                check (status in ('pending_payment', 'confirmed', 'completed', 'cancelled', 'expired')),
  price_xof     integer not null default 0,
  meeting_url   text,
  learner_goal  text,
  coach_notes   text,
  hold_expires_at timestamptz,               -- créneau bloqué le temps du paiement
  cancelled_by  uuid references public.profiles(id),
  cancel_reason text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists coaching_bookings_coach_idx on public.coaching_bookings(coach_id, starts_at);
create index if not exists coaching_bookings_learner_idx on public.coaching_bookings(learner_id, starts_at desc);

-- Un seul créneau actif par coach et par horaire
create unique index if not exists coaching_bookings_slot_uniq
  on public.coaching_bookings(coach_id, starts_at)
  where status in ('pending_payment', 'confirmed', 'completed');

alter table public.coaching_bookings enable row level security;

drop policy if exists "Participants lisent la réservation" on public.coaching_bookings;
create policy "Participants lisent la réservation" on public.coaching_bookings
  for select using (learner_id = auth.uid() or coach_id = auth.uid() or public.is_staff(auth.uid()));
-- Écritures : uniquement via les routes serveur (clé service) — pas de politique insert/update côté client.

-- Créneaux occupés (sans données personnelles) pour l'affichage public des disponibilités
create or replace function public.coach_busy_slots(p_coach uuid, p_from timestamptz, p_to timestamptz)
returns table (starts_at timestamptz, ends_at timestamptz)
language sql stable security definer set search_path = public as $$
  select b.starts_at, b.ends_at from public.coaching_bookings b
   where b.coach_id = p_coach and b.starts_at < p_to and b.ends_at > p_from
     and (b.status in ('confirmed', 'completed')
          or (b.status = 'pending_payment' and coalesce(b.hold_expires_at, now()) > now()))
$$;
grant execute on function public.coach_busy_slots(uuid, timestamptz, timestamptz) to anon, authenticated;

-- ── Paiements : un paiement peut concerner une séance ───────
alter table public.payments alter column course_id drop not null;
alter table public.payments add column if not exists coaching_booking_id uuid references public.coaching_bookings(id);
create index if not exists payments_booking_idx on public.payments(coaching_booking_id);

alter table public.instructor_earnings alter column course_id drop not null;
alter table public.instructor_earnings add column if not exists coaching_booking_id uuid references public.coaching_bookings(id);

-- Partage des revenus : formations ET séances de coaching
create or replace function public.record_instructor_earning() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_instructor uuid;
  v_share numeric(5,2);
  v_xof bigint;
  v_instr bigint;
begin
  if new.status = 'completed' and (tg_op = 'INSERT' or old.status is distinct from 'completed') then
    if new.coaching_booking_id is not null then
      select b.coach_id, coalesce(p.partner_share_pct, 50) into v_instructor, v_share
        from public.coaching_bookings b join public.profiles p on p.id = b.coach_id
       where b.id = new.coaching_booking_id;
    else
      select c.instructor_id, coalesce(p.partner_share_pct, 50) into v_instructor, v_share
        from public.courses c join public.profiles p on p.id = c.instructor_id
       where c.id = new.course_id;
    end if;
    if v_instructor is null then return new; end if;

    v_xof := public.to_xof(new.amount, new.currency);
    v_instr := floor(v_xof * v_share / 100);

    insert into public.instructor_earnings
      (payment_id, instructor_id, course_id, coaching_booking_id, gross_amount, currency, gross_amount_xof,
       instructor_share_pct, instructor_amount_xof, platform_amount_xof)
    values (new.id, v_instructor, new.course_id, new.coaching_booking_id, new.amount, new.currency, v_xof,
            v_share, v_instr, v_xof - v_instr)
    on conflict (payment_id) do nothing;

    if found then
      perform set_config('ibig.trusted_profile_update', 'on', true);
      update public.profiles set payout_balance_xof = coalesce(payout_balance_xof, 0) + v_instr where id = v_instructor;
      perform set_config('ibig.trusted_profile_update', 'off', true);
    end if;
  end if;

  if tg_op = 'UPDATE' and new.status = 'refunded' and old.status = 'completed' then
    update public.instructor_earnings set status = 'reversed'
     where payment_id = new.id and status = 'credited'
     returning instructor_id, instructor_amount_xof into v_instructor, v_instr;
    if v_instructor is not null then
      perform set_config('ibig.trusted_profile_update', 'on', true);
      update public.profiles set payout_balance_xof = coalesce(payout_balance_xof, 0) - v_instr where id = v_instructor;
      perform set_config('ibig.trusted_profile_update', 'off', true);
    end if;
  end if;
  return new;
end $$;
