-- ============================================================
-- 042 — Programme Formateurs Partenaires IBIG EDUFORM
--
-- Parcours : compte confirmé → candidature → conditions proposées par EDUFORM
--            → acceptation (signature) → création/soumission de formations
--            → validation et publication par EDUFORM → partage des revenus
--            → certificats cosignés.
--
-- Contient aussi deux correctifs de sécurité :
--   1. un utilisateur ne peut plus modifier lui-même son rôle / statut partenaire / solde ;
--   2. un formateur ne peut plus publier ni approuver lui-même sa formation.
-- Idempotent : peut être rejoué sans erreur.
-- ============================================================

-- ── Profils : statut partenaire ─────────────────────────────
alter table public.profiles add column if not exists is_partner boolean not null default false;
alter table public.profiles add column if not exists partner_share_pct numeric(5,2);
alter table public.profiles add column if not exists partner_since timestamptz;
alter table public.profiles add column if not exists professional_title text;
alter table public.profiles add column if not exists signature_name text;
alter table public.profiles add column if not exists payout_balance_xof bigint default 0;

-- Les formateurs et admins existants (dont IBIG Academy) deviennent partenaires
update public.profiles
   set is_partner = true,
       partner_share_pct = coalesce(partner_share_pct, 50),
       partner_since = coalesce(partner_since, now())
 where role in ('formateur', 'admin', 'coordinateur') and is_partner = false;

-- ── Candidatures ────────────────────────────────────────────
create table if not exists public.instructor_applications (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null unique references public.profiles(id) on delete cascade,
  status              text not null default 'submitted'
                      check (status in ('submitted', 'terms_offered', 'accepted', 'rejected', 'suspended')),
  full_name           text not null,
  professional_title  text not null,
  phone               text not null,
  whatsapp            text,
  country             text not null,
  city                text not null,
  expertise_domains   text[] not null default '{}',
  years_experience    integer not null check (years_experience >= 0),
  bio                 text not null,
  linkedin_url        text,
  website_url         text,
  sample_content_url  text,
  teaching_languages  text[] not null default '{fr}',
  planned_courses     text not null,
  legal_status        text not null default 'individual' check (legal_status in ('individual', 'company')),
  company_name        text,
  tax_id              text,
  payout_method       text not null check (payout_method in ('orange_money', 'mtn_money', 'wave', 'moov_money', 'bank_transfer')),
  payout_account      text not null,
  signature_name      text not null,
  motivation          text,
  admin_note          text,
  rejection_reason    text,
  submitted_at        timestamptz not null default now(),
  reviewed_at         timestamptz,
  reviewed_by         uuid references public.profiles(id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table public.instructor_applications enable row level security;

drop policy if exists "Candidat lit sa candidature" on public.instructor_applications;
create policy "Candidat lit sa candidature" on public.instructor_applications
  for select using (user_id = auth.uid());

drop policy if exists "Candidat crée sa candidature" on public.instructor_applications;
create policy "Candidat crée sa candidature" on public.instructor_applications
  for insert with check (user_id = auth.uid() and status = 'submitted');

-- Le candidat ne peut modifier sa candidature que tant qu'elle est en examen ou refusée (re-soumission)
drop policy if exists "Candidat met à jour sa candidature" on public.instructor_applications;
create policy "Candidat met à jour sa candidature" on public.instructor_applications
  for update using (user_id = auth.uid() and status in ('submitted', 'rejected'))
  with check (user_id = auth.uid() and status = 'submitted');

drop policy if exists "Admin gère les candidatures" on public.instructor_applications;
create policy "Admin gère les candidatures" on public.instructor_applications
  for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'coordinateur')));

-- ── Conventions de partenariat ──────────────────────────────
create table if not exists public.partner_agreements (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references public.profiles(id) on delete cascade,
  application_id        uuid references public.instructor_applications(id) on delete set null,
  status                text not null default 'offered' check (status in ('offered', 'accepted', 'revoked')),
  instructor_share_pct  numeric(5,2) not null check (instructor_share_pct > 0 and instructor_share_pct < 100),
  terms_version         text not null,
  terms_snapshot        text not null,            -- texte intégral des conditions au moment de l'offre
  special_conditions    text,
  offered_at            timestamptz not null default now(),
  offered_by            uuid references public.profiles(id),
  accepted_at           timestamptz,
  signature_name        text,
  accepted_ip           text,
  accepted_user_agent   text,
  created_at            timestamptz not null default now()
);

create index if not exists partner_agreements_user_idx on public.partner_agreements(user_id, status);

alter table public.partner_agreements enable row level security;

drop policy if exists "Partenaire lit ses conventions" on public.partner_agreements;
create policy "Partenaire lit ses conventions" on public.partner_agreements
  for select using (user_id = auth.uid());

drop policy if exists "Admin gère les conventions" on public.partner_agreements;
create policy "Admin gère les conventions" on public.partner_agreements
  for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin', 'coordinateur')));

-- Acceptation par le formateur (seul moyen de devenir partenaire)
create or replace function public.accept_partner_agreement(
  p_agreement_id uuid, p_signature_name text, p_ip text default null, p_user_agent text default null
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_ag public.partner_agreements;
begin
  select * into v_ag from public.partner_agreements where id = p_agreement_id for update;
  if v_ag.id is null or v_ag.user_id <> auth.uid() then raise exception 'Convention introuvable'; end if;
  if v_ag.status <> 'offered' then raise exception 'Cette convention n''est plus disponible'; end if;
  if coalesce(trim(p_signature_name), '') = '' then raise exception 'Signature requise'; end if;

  update public.partner_agreements
     set status = 'accepted', accepted_at = now(), signature_name = trim(p_signature_name),
         accepted_ip = p_ip, accepted_user_agent = p_user_agent
   where id = v_ag.id;

  update public.instructor_applications set status = 'accepted', updated_at = now()
   where user_id = v_ag.user_id;

  perform set_config('ibig.trusted_profile_update', 'on', true);
  update public.profiles
     set role = case when role in ('admin', 'coordinateur') then role else 'formateur' end,
         is_partner = true,
         partner_share_pct = v_ag.instructor_share_pct,
         partner_since = coalesce(partner_since, now()),
         signature_name = trim(p_signature_name),
         professional_title = coalesce(professional_title,
           (select professional_title from public.instructor_applications where user_id = v_ag.user_id))
   where id = v_ag.user_id;
  perform set_config('ibig.trusted_profile_update', 'off', true);
end $$;

revoke all on function public.accept_partner_agreement(uuid, text, text, text) from public;
grant execute on function public.accept_partner_agreement(uuid, text, text, text) to authenticated;

-- ── Sécurité : champs sensibles du profil ───────────────────
create or replace function public.is_staff(uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = uid and role in ('admin', 'coordinateur'))
$$;

create or replace function public.protect_profile_fields() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- service_role (webhooks, scripts serveur) et fonctions de confiance : autorisés
  if coalesce(auth.role(), '') = 'service_role'
     or current_setting('ibig.trusted_profile_update', true) = 'on'
     or auth.uid() is null then
    return new;
  end if;
  if public.is_staff(auth.uid()) then
    -- un coordinateur ne peut pas créer d'admin
    if new.role = 'admin' and old.role <> 'admin'
       and not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
      raise exception 'Seul un administrateur peut attribuer le rôle admin';
    end if;
    return new;
  end if;
  if new.role is distinct from old.role
     or new.is_partner is distinct from old.is_partner
     or new.partner_share_pct is distinct from old.partner_share_pct
     or new.partner_since is distinct from old.partner_since
     or new.payout_balance_xof is distinct from old.payout_balance_xof then
    raise exception 'Modification non autorisée de champs protégés du profil';
  end if;
  return new;
end $$;

drop trigger if exists protect_profile_fields on public.profiles;
create trigger protect_profile_fields before update on public.profiles
  for each row execute function public.protect_profile_fields();

-- ── Sécurité : publication réservée à EDUFORM ───────────────
create or replace function public.guard_course_publication() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(auth.role(), '') = 'service_role' or auth.uid() is null or public.is_staff(auth.uid()) then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if not exists (select 1 from public.profiles where id = auth.uid() and is_partner) then
      raise exception 'Seuls les formateurs partenaires IBIG EDUFORM peuvent créer des formations';
    end if;
    new.is_published := false;
    new.is_featured := false;
    new.approval_status := 'draft';
    return new;
  end if;

  -- UPDATE par le formateur : pas d'auto-publication ni d'auto-approbation
  if new.is_published and not old.is_published then
    raise exception 'La publication est effectuée par IBIG EDUFORM après validation';
  end if;
  if new.is_featured is distinct from old.is_featured
     or new.approved_by is distinct from old.approved_by
     or new.approved_at is distinct from old.approved_at
     or (new.approval_status is distinct from old.approval_status
         and new.approval_status not in ('draft', 'pending')) then
    raise exception 'Champs de validation réservés à IBIG EDUFORM';
  end if;
  if new.approval_status = 'pending' and old.approval_status is distinct from 'pending'
     and not exists (select 1 from public.profiles where id = auth.uid() and is_partner) then
    raise exception 'Seuls les formateurs partenaires peuvent soumettre une formation';
  end if;
  return new;
end $$;

drop trigger if exists guard_course_publication on public.courses;
create trigger guard_course_publication before insert or update on public.courses
  for each row execute function public.guard_course_publication();

-- ── Partage des revenus ─────────────────────────────────────
create table if not exists public.instructor_earnings (
  id                    uuid primary key default gen_random_uuid(),
  payment_id            uuid not null unique references public.payments(id) on delete cascade,
  instructor_id         uuid not null references public.profiles(id),
  course_id             uuid not null references public.courses(id),
  gross_amount          numeric(14,2) not null,
  currency              text not null,
  gross_amount_xof      bigint not null,
  instructor_share_pct  numeric(5,2) not null,
  instructor_amount_xof bigint not null,
  platform_amount_xof   bigint not null,
  status                text not null default 'credited' check (status in ('credited', 'reversed')),
  created_at            timestamptz not null default now()
);

create index if not exists instructor_earnings_instructor_idx on public.instructor_earnings(instructor_id, created_at desc);

alter table public.instructor_earnings enable row level security;

drop policy if exists "Formateur lit ses gains" on public.instructor_earnings;
create policy "Formateur lit ses gains" on public.instructor_earnings
  for select using (instructor_id = auth.uid() or public.is_staff(auth.uid()));

create or replace function public.to_xof(p_amount numeric, p_currency text) returns bigint
language sql immutable as $$
  select round(p_amount * case upper(coalesce(p_currency, 'XOF'))
    when 'XOF' then 1 when 'XAF' then 1 when 'EUR' then 655.957 when 'USD' then 600
    else 1 end)::bigint
$$;

create or replace function public.record_instructor_earning() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_instructor uuid;
  v_share numeric(5,2);
  v_xof bigint;
  v_instr bigint;
begin
  -- Paiement confirmé : créditer le formateur
  if new.status = 'completed' and (tg_op = 'INSERT' or old.status is distinct from 'completed') then
    select c.instructor_id, coalesce(p.partner_share_pct, 50)
      into v_instructor, v_share
      from public.courses c join public.profiles p on p.id = c.instructor_id
     where c.id = new.course_id;
    if v_instructor is null then return new; end if;

    v_xof := public.to_xof(new.amount, new.currency);
    v_instr := floor(v_xof * v_share / 100);

    insert into public.instructor_earnings
      (payment_id, instructor_id, course_id, gross_amount, currency, gross_amount_xof,
       instructor_share_pct, instructor_amount_xof, platform_amount_xof)
    values (new.id, v_instructor, new.course_id, new.amount, new.currency, v_xof,
            v_share, v_instr, v_xof - v_instr)
    on conflict (payment_id) do nothing;

    if found then
      perform set_config('ibig.trusted_profile_update', 'on', true);
      update public.profiles set payout_balance_xof = coalesce(payout_balance_xof, 0) + v_instr
       where id = v_instructor;
      perform set_config('ibig.trusted_profile_update', 'off', true);
    end if;
  end if;

  -- Remboursement : annuler la part du formateur
  if tg_op = 'UPDATE' and new.status = 'refunded' and old.status = 'completed' then
    update public.instructor_earnings set status = 'reversed'
     where payment_id = new.id and status = 'credited'
     returning instructor_id, instructor_amount_xof into v_instructor, v_instr;
    if v_instructor is not null then
      perform set_config('ibig.trusted_profile_update', 'on', true);
      update public.profiles set payout_balance_xof = coalesce(payout_balance_xof, 0) - v_instr
       where id = v_instructor;
      perform set_config('ibig.trusted_profile_update', 'off', true);
    end if;
  end if;
  return new;
end $$;

drop trigger if exists record_instructor_earning on public.payments;
create trigger record_instructor_earning after insert or update of status on public.payments
  for each row execute function public.record_instructor_earning();

-- ── Notifications : types utilisés par le programme ─────────
-- (la table notifications existe déjà ; aucun changement de structure requis)
