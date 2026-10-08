-- 053 — LTI 1.3 (IBIG E-LEARNING comme « outil » intégrable dans Moodle, Canvas, Blackboard, Open edX…)

create table if not exists public.lti_platforms (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  issuer          text not null,                  -- « iss » de la plateforme (ex. https://moodle.universite.ci)
  client_id       text not null,                  -- identifiant attribué à IBIG par la plateforme
  auth_login_url  text not null,                  -- point d'authentification OIDC de la plateforme
  jwks_url        text not null,                  -- clés publiques de la plateforme
  deployment_ids  text[] not null default '{}',   -- vide = tous les déploiements acceptés
  org_id          uuid references public.organizations(id) on delete set null,  -- inscriptions financées par cette organisation
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  unique (issuer, client_id)
);

-- Paire de clés de l'outil (signature des messages sortants) — lisible uniquement par le serveur
create table if not exists public.lti_tool_keys (
  kid         text primary key,
  private_jwk jsonb not null,
  public_jwk  jsonb not null,
  created_at  timestamptz not null default now()
);

create table if not exists public.lti_launches (
  id          uuid primary key default gen_random_uuid(),
  platform_id uuid references public.lti_platforms(id) on delete cascade,
  user_id     uuid references public.profiles(id) on delete set null,
  course_id   uuid references public.courses(id) on delete set null,
  lti_sub     text,
  launched_at timestamptz not null default now()
);

alter table public.lti_platforms enable row level security;
alter table public.lti_tool_keys enable row level security;
alter table public.lti_launches enable row level security;
drop policy if exists lti_platforms_staff on public.lti_platforms;
create policy lti_platforms_staff on public.lti_platforms for select using (public.is_staff(auth.uid()));
drop policy if exists lti_launches_staff on public.lti_launches;
create policy lti_launches_staff on public.lti_launches for select using (public.is_staff(auth.uid()));
-- lti_tool_keys : aucune politique → inaccessible hors clé de service

notify pgrst, 'reload schema';
