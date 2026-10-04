-- ============================================================
-- Migration 011 : B2B Entreprise
-- Organisations, cohortes, portail RH, rapports d'apprentissage
-- ============================================================

-- 1. Table organisations (entreprises clientes)
CREATE TABLE IF NOT EXISTS public.organizations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  slug            text NOT NULL UNIQUE,
  logo_url        text,
  website         text,
  country         text DEFAULT 'CI',
  plan            text NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter','business','enterprise')),
  max_seats       integer NOT NULL DEFAULT 10,
  used_seats      integer NOT NULL DEFAULT 0,
  billing_email   text,
  contact_name    text,
  contact_phone   text,
  is_active       boolean NOT NULL DEFAULT true,
  white_label     boolean NOT NULL DEFAULT false,
  custom_domain   text,
  brand_color     text DEFAULT '#0B3D91',
  brand_logo_url  text,
  metadata        jsonb DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- 2. Membres d'une organisation
CREATE TABLE IF NOT EXISTS public.organization_members (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role            text NOT NULL DEFAULT 'learner' CHECK (role IN ('owner','admin','manager','learner')),
  invited_by      uuid REFERENCES public.profiles(id),
  invited_at      timestamptz,
  joined_at       timestamptz NOT NULL DEFAULT now(),
  is_active       boolean NOT NULL DEFAULT true,
  UNIQUE (org_id, user_id)
);

-- 3. Cohortes (groupes d'apprenants dans une organisation)
CREATE TABLE IF NOT EXISTS public.cohorts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name            text NOT NULL,
  description     text,
  course_ids      uuid[] NOT NULL DEFAULT '{}',   -- Formations assignées
  start_date      date,
  end_date        date,
  manager_id      uuid REFERENCES public.profiles(id),
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- 4. Membres d'une cohorte
CREATE TABLE IF NOT EXISTS public.cohort_members (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id       uuid NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  enrolled_at     timestamptz NOT NULL DEFAULT now(),
  completed_at    timestamptz,
  progress_pct    integer DEFAULT 0,
  UNIQUE (cohort_id, user_id)
);

-- 5. Invitations en attente (email avant création de compte)
CREATE TABLE IF NOT EXISTS public.org_invitations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email           text NOT NULL,
  role            text NOT NULL DEFAULT 'learner',
  cohort_id       uuid REFERENCES public.cohorts(id),
  token           text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by      uuid REFERENCES public.profiles(id),
  accepted_at     timestamptz,
  expires_at      timestamptz NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- 6. Colonne org_id dans profiles (organisation principale de l'utilisateur)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id);

-- 7. Index
CREATE INDEX IF NOT EXISTS idx_org_members_org   ON public.organization_members (org_id, is_active);
CREATE INDEX IF NOT EXISTS idx_org_members_user  ON public.organization_members (user_id);
CREATE INDEX IF NOT EXISTS idx_cohorts_org       ON public.cohorts (org_id, is_active);
CREATE INDEX IF NOT EXISTS idx_cohort_members    ON public.cohort_members (cohort_id, user_id);
CREATE INDEX IF NOT EXISTS idx_org_invitations   ON public.org_invitations (email, accepted_at);

-- 8. RLS
ALTER TABLE public.organizations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cohorts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cohort_members     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_invitations    ENABLE ROW LEVEL SECURITY;

-- Organizations : visibles par les membres
CREATE POLICY "org_select_member" ON public.organizations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.org_id = id AND om.user_id = auth.uid() AND om.is_active
  ));

-- Organization members : visibles par les membres de la même org
CREATE POLICY "org_members_select" ON public.organization_members FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.organization_members om2
    WHERE om2.org_id = org_id AND om2.user_id = auth.uid() AND om2.is_active
  ));

-- Cohorts : visibles par les membres de l'org
CREATE POLICY "cohorts_select" ON public.cohorts FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.org_id = org_id AND om.user_id = auth.uid() AND om.is_active
  ));

-- Cohort members : visibles par les membres de l'org
CREATE POLICY "cohort_members_select" ON public.cohort_members FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.cohorts c
    JOIN public.organization_members om ON om.org_id = c.org_id
    WHERE c.id = cohort_id AND om.user_id = auth.uid() AND om.is_active
  ));

-- Invitations : visibles par les admins/owners de l'org
CREATE POLICY "org_invitations_select" ON public.org_invitations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.org_id = org_id AND om.user_id = auth.uid()
      AND om.role IN ('owner','admin','manager') AND om.is_active
  ));

-- 9. Fonction : statistiques d'une cohorte (pour le tableau de bord RH)
CREATE OR REPLACE FUNCTION public.cohort_stats(p_cohort_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total       integer;
  v_completed   integer;
  v_avg_progress numeric;
  v_active      integer;
BEGIN
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE completed_at IS NOT NULL),
    ROUND(AVG(progress_pct), 1),
    COUNT(*) FILTER (WHERE progress_pct > 0 AND completed_at IS NULL)
  INTO v_total, v_completed, v_avg_progress, v_active
  FROM public.cohort_members
  WHERE cohort_id = p_cohort_id;

  RETURN jsonb_build_object(
    'total',       v_total,
    'completed',   v_completed,
    'active',      v_active,
    'avg_progress',v_avg_progress,
    'completion_rate', CASE WHEN v_total > 0 THEN ROUND((v_completed::numeric / v_total) * 100, 1) ELSE 0 END
  );
END;
$$;
