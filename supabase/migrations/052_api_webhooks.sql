-- 052 — API publique et webhooks des organisations (intégration SIRH)

create table if not exists public.api_keys (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organizations(id) on delete cascade,
  name         text not null,
  key_prefix   text not null,            -- 12 premiers caractères, pour identifier la clé sans la révéler
  key_hash     text not null unique,     -- SHA-256 de la clé complète (la clé n'est jamais stockée)
  created_by   uuid references public.profiles(id) on delete set null,
  last_used_at timestamptz,
  revoked_at   timestamptz,
  created_at   timestamptz not null default now()
);
create index if not exists api_keys_org_idx on public.api_keys(org_id);

create table if not exists public.webhook_endpoints (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organizations(id) on delete cascade,
  url        text not null check (url ~ '^https://'),
  secret     text not null,
  events     text[] not null default '{enrollment.created,course.completed,certificate.issued}',
  is_active  boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists webhook_endpoints_org_idx on public.webhook_endpoints(org_id) where is_active;

create table if not exists public.webhook_deliveries (
  id           uuid primary key default gen_random_uuid(),
  endpoint_id  uuid not null references public.webhook_endpoints(id) on delete cascade,
  event        text not null,
  payload      jsonb not null,
  status_code  integer,
  ok           boolean not null default false,
  error        text,
  attempted_at timestamptz not null default now()
);
create index if not exists webhook_deliveries_endpoint_idx on public.webhook_deliveries(endpoint_id, attempted_at desc);

-- Lecture par les responsables de l'organisation ; toutes les écritures passent par le serveur
alter table public.api_keys enable row level security;
alter table public.webhook_endpoints enable row level security;
alter table public.webhook_deliveries enable row level security;
drop policy if exists api_keys_managers on public.api_keys;
create policy api_keys_managers on public.api_keys for select using (public.is_org_manager(org_id, auth.uid()) or public.is_staff(auth.uid()));
drop policy if exists webhook_endpoints_managers on public.webhook_endpoints;
create policy webhook_endpoints_managers on public.webhook_endpoints for select using (public.is_org_manager(org_id, auth.uid()) or public.is_staff(auth.uid()));
drop policy if exists webhook_deliveries_managers on public.webhook_deliveries;
create policy webhook_deliveries_managers on public.webhook_deliveries for select using (
  exists (select 1 from public.webhook_endpoints w where w.id = webhook_deliveries.endpoint_id
           and (public.is_org_manager(w.org_id, auth.uid()) or public.is_staff(auth.uid()))));
-- Le secret de signature n'est jamais lisible depuis le navigateur
revoke select on public.webhook_endpoints from anon, authenticated;
grant select (id, org_id, url, events, is_active, created_at) on public.webhook_endpoints to authenticated;
revoke select on public.api_keys from anon, authenticated;
grant select (id, org_id, name, key_prefix, last_used_at, revoked_at, created_at) on public.api_keys to authenticated;

notify pgrst, 'reload schema';
