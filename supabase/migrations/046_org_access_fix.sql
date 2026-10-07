-- 046 — Espace entreprise : règles d'accès corrigées
-- Les politiques de 011 étaient fausses : `om.org_id = id` se résolvait en om.org_id = om.id (jamais vrai)
-- et `om2.org_id = org_id` en om2.org_id = om2.org_id (toujours vrai : un membre voyait les membres
-- de toutes les organisations). Les écritures passent par les API serveur (clé de service) après contrôle.

create or replace function public.is_org_member(p_org uuid, p_uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.organization_members
                  where org_id = p_org and user_id = p_uid and is_active)
$$;

create or replace function public.is_org_manager(p_org uuid, p_uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.organization_members
                  where org_id = p_org and user_id = p_uid and is_active
                    and role in ('owner', 'admin', 'manager'))
$$;

drop policy if exists org_select_member on public.organizations;
create policy org_select_member on public.organizations
  for select using (public.is_org_member(organizations.id, auth.uid()) or public.is_staff(auth.uid()));

drop policy if exists org_members_select on public.organization_members;
create policy org_members_select on public.organization_members
  for select using (
    organization_members.user_id = auth.uid()
    or public.is_org_manager(organization_members.org_id, auth.uid())
    or public.is_staff(auth.uid()));

drop policy if exists cohorts_select on public.cohorts;
create policy cohorts_select on public.cohorts
  for select using (public.is_org_member(cohorts.org_id, auth.uid()) or public.is_staff(auth.uid()));

drop policy if exists cohort_members_select on public.cohort_members;
create policy cohort_members_select on public.cohort_members
  for select using (
    cohort_members.user_id = auth.uid()
    or exists (select 1 from public.cohorts c
                where c.id = cohort_members.cohort_id and public.is_org_manager(c.org_id, auth.uid()))
    or public.is_staff(auth.uid()));

drop policy if exists org_invitations_select on public.org_invitations;
create policy org_invitations_select on public.org_invitations
  for select using (public.is_org_manager(org_invitations.org_id, auth.uid()) or public.is_staff(auth.uid()));

-- Inscriptions financées par une organisation
alter table public.enrollments add column if not exists sponsor_org_id uuid references public.organizations(id) on delete set null;
create index if not exists enrollments_sponsor_idx on public.enrollments(sponsor_org_id) where sponsor_org_id is not null;

notify pgrst, 'reload schema';
