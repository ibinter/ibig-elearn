-- Seed data for IBIG E-LEARN
-- Run: supabase db execute --file scripts/seed.sql --project-ref bgetgydgzfviddpcbdtq

-- 1. Catégories IBIG (correspondent aux domaines IBIG SARL)
INSERT INTO public.categories (name, slug, description, icon, position) VALUES
  ('Numérique & Développement', 'numerique-developpement', 'Programmation, web, mobile, data', '💻', 1),
  ('BTP & Immobilier', 'btp-immobilier', 'Construction, gestion foncière, architecture', '🏗️', 2),
  ('Gestion & Finance', 'gestion-finance', 'Comptabilité, gestion d''entreprise, finance', '📊', 3),
  ('Marketing & Commerce', 'marketing-commerce', 'Marketing digital, vente, e-commerce', '📈', 4),
  ('Leadership & Management', 'leadership-management', 'Management, RH, entrepreneuriat', '🎯', 5),
  ('Santé & Social', 'sante-social', 'Santé publique, travail social, aide humanitaire', '🏥', 6)
ON CONFLICT (slug) DO NOTHING;

-- 2. Formateur fictif (lié à auth.users via profil - on utilise un UUID fictif pour les tests)
-- Note: en production, les formateurs s'inscrivent via l'interface
-- Pour les tests, on crée un profil sans user auth (en désactivant la FK check temporairement)

-- 3. Formations de démonstration
-- D'abord récupérer l'ID des catégories
DO $$
DECLARE
  cat_num uuid;
  cat_btp uuid;
  cat_gestion uuid;
  cat_marketing uuid;
  cat_leader uuid;
  -- Formateur fictif: on crée d'abord un user dans auth puis un profil
  formateur_id uuid := gen_random_uuid();
BEGIN
  SELECT id INTO cat_num FROM public.categories WHERE slug = 'numerique-developpement';
  SELECT id INTO cat_btp FROM public.categories WHERE slug = 'btp-immobilier';
  SELECT id INTO cat_gestion FROM public.categories WHERE slug = 'gestion-finance';
  SELECT id INTO cat_marketing FROM public.categories WHERE slug = 'marketing-commerce';
  SELECT id INTO cat_leader FROM public.categories WHERE slug = 'leadership-management';

  -- Insérer un formateur fictif dans auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role
  ) VALUES (
    formateur_id,
    '00000000-0000-0000-0000-000000000000',
    'formateur.demo@ibiglearn.com',
    crypt('DemoPassword123!', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Dr. Kouassi Ange-Brice"}',
    'authenticated', 'authenticated'
  ) ON CONFLICT DO NOTHING;

  -- Profil formateur
  INSERT INTO public.profiles (id, email, full_name, role, bio, country) VALUES (
    formateur_id,
    'formateur.demo@ibiglearn.com',
    'Dr. Kouassi Ange-Brice',
    'formateur',
    'Expert en développement numérique et gestion de projet avec 12 ans d''expérience en Afrique de l''Ouest.',
    'CI'
  ) ON CONFLICT (id) DO NOTHING;

  -- Formations
  INSERT INTO public.courses (
    title, slug, description, short_description, instructor_id, category_id,
    price_xof, level, duration_hours, is_published, is_featured,
    enrollment_count, rating_average, rating_count,
    objectives, requirements, thumbnail_url
  ) VALUES
  (
    'Développement Web avec Next.js & React',
    'developpement-web-nextjs-react',
    'Apprenez à créer des applications web modernes et performantes avec React 18 et Next.js. Du composant de base au déploiement en production sur Vercel. Couvre les Server Components, l''App Router, Tailwind CSS et l''intégration avec Supabase.',
    'Créez des apps web modernes avec React & Next.js — déployez en production',
    formateur_id, cat_num,
    35000, 'intermediaire', 42,
    true, true, 234, 4.8, 47,
    ARRAY['Maîtriser les hooks React', 'Créer des apps Next.js avec App Router', 'Déployer sur Vercel', 'Intégrer Supabase'],
    ARRAY['Bases de JavaScript', 'HTML & CSS', 'Ordinateur avec VS Code'],
    'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&auto=format'
  ),
  (
    'Python pour la Data Science & IA',
    'python-data-science-ia',
    'Maîtrisez Python et ses bibliothèques (Pandas, NumPy, Matplotlib, Scikit-learn) pour analyser des données, créer des visualisations et construire des modèles de machine learning. Cas pratiques avec des données africaines.',
    'Analysez des données et créez des modèles ML avec Python',
    formateur_id, cat_num,
    40000, 'debutant', 55,
    true, true, 412, 4.9, 89,
    ARRAY['Maîtriser Python', 'Analyser des datasets', 'Créer des modèles ML', 'Visualiser des données'],
    ARRAY['Aucun prérequis en programmation', 'Motivation à apprendre'],
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format'
  ),
  (
    'Gestion de Projet BTP en Afrique',
    'gestion-projet-btp-afrique',
    'Techniques de gestion de chantier adaptées au contexte africain. Planification, suivi des coûts, gestion des équipes et des fournisseurs. Maîtrisez MS Project et les normes de construction locales.',
    'Gérez vos chantiers BTP efficacement avec les méthodes adaptées à l''Afrique',
    formateur_id, cat_btp,
    30000, 'intermediaire', 28,
    true, true, 156, 4.7, 34,
    ARRAY['Planifier un chantier', 'Gérer les coûts et délais', 'Manager une équipe terrain'],
    ARRAY['Expérience en BTP souhaitée', 'Notions de gestion de projet'],
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format'
  ),
  (
    'Marketing Digital & Réseaux Sociaux',
    'marketing-digital-reseaux-sociaux',
    'Stratégies SEO, publicité Facebook & Google Ads, content marketing et email marketing pour développer votre présence en ligne. Apprenez à créer des campagnes qui convertissent sur les marchés africains.',
    'Maîtrisez le SEO, les ads et le content marketing pour l''Afrique',
    formateur_id, cat_marketing,
    25000, 'debutant', 30,
    true, false, 189, 4.7, 28,
    ARRAY['Maîtriser le SEO', 'Créer des campagnes Facebook & Google', 'Mesurer le ROI'],
    ARRAY['Avoir un compte réseaux sociaux', 'Notions internet de base'],
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format'
  ),
  (
    'Comptabilité & Gestion Financière PME',
    'comptabilite-gestion-financiere-pme',
    'Maîtrisez les fondamentaux de la comptabilité SYSCOHADA, la gestion de trésorerie et l''analyse financière pour les PME africaines. Utilisez Excel et des logiciels comptables pour optimiser vos finances.',
    'Gérez la comptabilité et les finances de votre PME africaine',
    formateur_id, cat_gestion,
    28000, 'debutant', 35,
    true, false, 98, 4.6, 19,
    ARRAY['Maîtriser le plan comptable SYSCOHADA', 'Gérer la trésorerie', 'Lire un bilan financier'],
    ARRAY['Aucun prérequis comptable', 'Bonne maîtrise de Excel'],
    'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&auto=format'
  ),
  (
    'Leadership & Management d''Équipe',
    'leadership-management-equipe',
    'Développez vos compétences en leadership, communication et management d''équipe. Techniques de motivation, gestion des conflits, délégation et prise de décision pour les managers en Afrique.',
    'Devenez un leader inspirant et gérez votre équipe avec efficacité',
    formateur_id, cat_leader,
    32000, 'intermediaire', 24,
    true, true, 127, 4.8, 31,
    ARRAY['Développer son leadership', 'Motiver et fidéliser son équipe', 'Gérer les conflits'],
    ARRAY['Expérience managériale souhaitée', 'Ouverture d''esprit'],
    'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=600&auto=format'
  );

  RAISE NOTICE 'Seed terminé avec succès. Formateur ID: %', formateur_id;
END $$;
