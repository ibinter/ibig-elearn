-- ============================================================
-- Nom formateur → IBIG Academy + Bio courte
-- + Faux profils apprenants pour avoir 2-3 avis par formation
-- ============================================================

-- 1. Mettre à jour le profil formateur principal
UPDATE profiles
SET
  full_name = 'IBIG Academy',
  bio = 'IBIG Academy regroupe des formateurs experts en gestion, finance, marketing et digital, engagés à proposer des formations de qualité adaptées aux réalités des professionnels d''Afrique francophone.',
  updated_at = now()
WHERE email = 'patriceky@gmail.com';

-- 2. Créer des utilisateurs fictifs dans auth.users + profiles
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, role, aud)
VALUES
  ('a1000001-0000-0000-0000-000000000001', 'kouassi.brice.ibig@learner.local',    '', now(), now() - interval '4 months', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Kouassi Ange-Brice"}',  'authenticated', 'authenticated'),
  ('a1000001-0000-0000-0000-000000000002', 'fatou.diallo.ibig@learner.local',      '', now(), now() - interval '3 months', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Fatou Diallo"}',         'authenticated', 'authenticated'),
  ('a1000001-0000-0000-0000-000000000003', 'moussa.traore.ibig@learner.local',     '', now(), now() - interval '3 months', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Moussa Traoré"}',        'authenticated', 'authenticated'),
  ('a1000001-0000-0000-0000-000000000004', 'aminata.kone.ibig@learner.local',      '', now(), now() - interval '2 months', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Aminata Koné"}',         'authenticated', 'authenticated'),
  ('a1000001-0000-0000-0000-000000000005', 'eric.kouame.ibig@learner.local',       '', now(), now() - interval '2 months', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Éric Kouamé"}',          'authenticated', 'authenticated'),
  ('a1000001-0000-0000-0000-000000000006', 'aissatou.barry.ibig@learner.local',    '', now(), now() - interval '5 months', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Aïssatou Barry"}',       'authenticated', 'authenticated'),
  ('a1000001-0000-0000-0000-000000000007', 'ibrahim.coulibaly.ibig@learner.local', '', now(), now() - interval '1 month',  now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Ibrahim Coulibaly"}',    'authenticated', 'authenticated'),
  ('a1000001-0000-0000-0000-000000000008', 'mariam.ouedraogo.ibig@learner.local',  '', now(), now() - interval '5 weeks',  now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Mariam Ouédraogo"}',     'authenticated', 'authenticated'),
  ('a1000001-0000-0000-0000-000000000009', 'serge.akoa.ibig@learner.local',        '', now(), now() - interval '6 weeks',  now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Serge Akoa"}',           'authenticated', 'authenticated'),
  ('a1000001-0000-0000-0000-000000000010', 'nadia.toure.ibig@learner.local',       '', now(), now() - interval '7 weeks',  now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Nadia Touré"}',          'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;

-- Le trigger on_auth_user_created crée normalement les profils automatiquement.
-- On les insère manuellement au cas où le trigger ne s'est pas déclenché.
INSERT INTO profiles (id, email, full_name, avatar_url, role, created_at)
VALUES
  ('a1000001-0000-0000-0000-000000000001', 'kouassi.brice.ibig@learner.local',    'Kouassi Ange-Brice',  null, 'apprenant', now() - interval '4 months'),
  ('a1000001-0000-0000-0000-000000000002', 'fatou.diallo.ibig@learner.local',      'Fatou Diallo',        null, 'apprenant', now() - interval '3 months'),
  ('a1000001-0000-0000-0000-000000000003', 'moussa.traore.ibig@learner.local',     'Moussa Traoré',       null, 'apprenant', now() - interval '3 months'),
  ('a1000001-0000-0000-0000-000000000004', 'aminata.kone.ibig@learner.local',      'Aminata Koné',        null, 'apprenant', now() - interval '2 months'),
  ('a1000001-0000-0000-0000-000000000005', 'eric.kouame.ibig@learner.local',       'Éric Kouamé',         null, 'apprenant', now() - interval '2 months'),
  ('a1000001-0000-0000-0000-000000000006', 'aissatou.barry.ibig@learner.local',    'Aïssatou Barry',      null, 'apprenant', now() - interval '5 months'),
  ('a1000001-0000-0000-0000-000000000007', 'ibrahim.coulibaly.ibig@learner.local', 'Ibrahim Coulibaly',   null, 'apprenant', now() - interval '1 month'),
  ('a1000001-0000-0000-0000-000000000008', 'mariam.ouedraogo.ibig@learner.local',  'Mariam Ouédraogo',    null, 'apprenant', now() - interval '5 weeks'),
  ('a1000001-0000-0000-0000-000000000009', 'serge.akoa.ibig@learner.local',        'Serge Akoa',          null, 'apprenant', now() - interval '6 weeks'),
  ('a1000001-0000-0000-0000-000000000010', 'nadia.toure.ibig@learner.local',       'Nadia Touré',         null, 'apprenant', now() - interval '7 weeks')
ON CONFLICT (id) DO NOTHING;

-- 3. Supprimer les anciens avis (insérés avec patriceky) pour repartir propre
DELETE FROM reviews
WHERE user_id = (SELECT id FROM profiles WHERE email = 'patriceky@gmail.com');

-- 4. Insérer 2-3 avis par formation avec des profils différents
DO $$ DECLARE
  v_course_id uuid;
BEGIN

  -- COMPTABILITÉ OHADA
  SELECT id INTO v_course_id FROM courses WHERE title ILIKE '%Comptabilit%OHADA%' LIMIT 1;
  IF v_course_id IS NOT NULL THEN INSERT INTO reviews (user_id, course_id, rating, comment, is_published, created_at) VALUES
    ('a1000001-0000-0000-0000-000000000001', v_course_id, 5, 'Formation très pratique. Les exemples avec les comptes SYSCOHADA sont directement applicables dans mon travail.', true, now() - interval '6 weeks'),
    ('a1000001-0000-0000-0000-000000000006', v_course_id, 4, 'J''ai enfin compris la logique de la partie double. Le module TVA m''a beaucoup aidé.', true, now() - interval '3 weeks'),
    ('a1000001-0000-0000-0000-000000000009', v_course_id, 5, 'Contenu sérieux et bien structuré. Je recommande à tout comptable débutant en Afrique.', true, now() - interval '10 days')
  ON CONFLICT (user_id, course_id) DO NOTHING; END IF;

  -- EXCEL
  SELECT id INTO v_course_id FROM courses WHERE title ILIKE '%Excel%Google Sheets%' LIMIT 1;
  IF v_course_id IS NOT NULL THEN INSERT INTO reviews (user_id, course_id, rating, comment, is_published, created_at) VALUES
    ('a1000001-0000-0000-0000-000000000002', v_course_id, 5, 'Les TCD et RECHERCHEV m''ont sauvé la mise au boulot. J''aurais dû prendre cette formation bien plus tôt.', true, now() - interval '2 months'),
    ('a1000001-0000-0000-0000-000000000007', v_course_id, 4, 'Bonne progression du débutant à l''avancé. Certains modules sont denses, il faut prendre son temps.', true, now() - interval '5 weeks'),
    ('a1000001-0000-0000-0000-000000000010', v_course_id, 5, 'Exemples concrets et bien expliqués. Le tableau de bord du module 6 est exactement ce dont j''avais besoin.', true, now() - interval '2 weeks')
  ON CONFLICT (user_id, course_id) DO NOTHING; END IF;

  -- MARKETING DIGITAL
  SELECT id INTO v_course_id FROM courses WHERE slug = 'marketing-digital-pme-africaines' LIMIT 1;
  IF v_course_id IS NOT NULL THEN INSERT INTO reviews (user_id, course_id, rating, comment, is_published, created_at) VALUES
    ('a1000001-0000-0000-0000-000000000003', v_course_id, 5, 'J''ai lancé ma première campagne Facebook à 25 000 FCFA et eu 3 nouveaux clients. Concret et efficace.', true, now() - interval '7 weeks'),
    ('a1000001-0000-0000-0000-000000000008', v_course_id, 4, 'Les modules persona et calendrier éditorial sont très bien. J''aurais aimé plus sur TikTok.', true, now() - interval '3 weeks')
  ON CONFLICT (user_id, course_id) DO NOTHING; END IF;

  -- MANAGEMENT
  SELECT id INTO v_course_id FROM courses WHERE title ILIKE '%Management%Leadership%' LIMIT 1;
  IF v_course_id IS NOT NULL THEN INSERT INTO reviews (user_id, course_id, rating, comment, is_published, created_at) VALUES
    ('a1000001-0000-0000-0000-000000000004', v_course_id, 5, 'J''ai appliqué les objectifs SMART dès la semaine suivante avec mon équipe. La différence est visible.', true, now() - interval '6 weeks'),
    ('a1000001-0000-0000-0000-000000000001', v_course_id, 4, 'Très bon contenu sur la délégation et la gestion des conflits. Adapté au contexte africain.', true, now() - interval '1 month'),
    ('a1000001-0000-0000-0000-000000000009', v_course_id, 5, 'La matrice Eisenhower a changé ma façon de prioriser mes journées. Merci IBIG Academy.', true, now() - interval '2 weeks')
  ON CONFLICT (user_id, course_id) DO NOTHING; END IF;

  -- IA & OUTILS
  SELECT id INTO v_course_id FROM courses WHERE title ILIKE '%Intelligence Artificielle%' LIMIT 1;
  IF v_course_id IS NOT NULL THEN INSERT INTO reviews (user_id, course_id, rating, comment, is_published, created_at) VALUES
    ('a1000001-0000-0000-0000-000000000005', v_course_id, 5, 'Enfin une formation IA avec des exemples africains ! ChatGPT et Claude sont devenus mes assistants quotidiens.', true, now() - interval '5 weeks'),
    ('a1000001-0000-0000-0000-000000000010', v_course_id, 4, 'Le module sur les hallucinations IA m''a évité plusieurs erreurs. Très utile pour mon travail.', true, now() - interval '2 weeks')
  ON CONFLICT (user_id, course_id) DO NOTHING; END IF;

  -- FINANCE PERSONNELLE
  SELECT id INTO v_course_id FROM courses WHERE slug = 'finance-personnelle-investissement-afrique' LIMIT 1;
  IF v_course_id IS NOT NULL THEN INSERT INTO reviews (user_id, course_id, rating, comment, is_published, created_at) VALUES
    ('a1000001-0000-0000-0000-000000000006', v_course_id, 5, 'J''ai créé mon premier vrai plan d''épargne grâce à cette formation. La règle des 72 m''a fasciné.', true, now() - interval '2 months'),
    ('a1000001-0000-0000-0000-000000000003', v_course_id, 4, 'Le module sur les bons de trésor et la BRVM m''a ouvert les yeux sur les placements disponibles ici.', true, now() - interval '5 weeks')
  ON CONFLICT (user_id, course_id) DO NOTHING; END IF;

  -- RH
  SELECT id INTO v_course_id FROM courses WHERE title ILIKE '%Ressources Humaines%' LIMIT 1;
  IF v_course_id IS NOT NULL THEN INSERT INTO reviews (user_id, course_id, rating, comment, is_published, created_at) VALUES
    ('a1000001-0000-0000-0000-000000000007', v_course_id, 5, 'Le guide entretien STAR m''a aidé à recruter un comptable junior. Qualité nettement améliorée.', true, now() - interval '7 weeks'),
    ('a1000001-0000-0000-0000-000000000002', v_course_id, 4, 'Solide sur le droit du travail OHADA. Aurait pu aller plus loin sur la paie.', true, now() - interval '3 weeks')
  ON CONFLICT (user_id, course_id) DO NOTHING; END IF;

  -- E-COMMERCE
  SELECT id INTO v_course_id FROM courses WHERE slug = 'ecommerce-vente-en-ligne-afrique' LIMIT 1;
  IF v_course_id IS NOT NULL THEN INSERT INTO reviews (user_id, course_id, rating, comment, is_published, created_at) VALUES
    ('a1000001-0000-0000-0000-000000000008', v_course_id, 5, 'J''ai ouvert ma boutique WooCommerce + CinetPay grâce à cette formation. Première vente en 2 semaines !', true, now() - interval '6 weeks'),
    ('a1000001-0000-0000-0000-000000000004', v_course_id, 4, 'Très pratique. Le module fiches produits m''a aidé à améliorer mes conversions.', true, now() - interval '4 weeks')
  ON CONFLICT (user_id, course_id) DO NOTHING; END IF;

  -- COMMUNICATION
  SELECT id INTO v_course_id FROM courses WHERE title ILIKE '%Communication%Professionnelle%' LIMIT 1;
  IF v_course_id IS NOT NULL THEN INSERT INTO reviews (user_id, course_id, rating, comment, is_published, created_at) VALUES
    ('a1000001-0000-0000-0000-000000000005', v_course_id, 5, 'Mes présentations sont devenues beaucoup plus percutantes. Les techniques non-verbales sont très pratiques.', true, now() - interval '4 weeks'),
    ('a1000001-0000-0000-0000-000000000009', v_course_id, 4, 'La méthode SBI pour les feedbacks a rendu mes entretiens bien plus constructifs.', true, now() - interval '10 days')
  ON CONFLICT (user_id, course_id) DO NOTHING; END IF;

  -- ENTREPRENEURIAT
  SELECT id INTO v_course_id FROM courses WHERE title ILIKE '%Entrepren%' LIMIT 1;
  IF v_course_id IS NOT NULL THEN INSERT INTO reviews (user_id, course_id, rating, comment, is_published, created_at) VALUES
    ('a1000001-0000-0000-0000-000000000002', v_course_id, 5, 'Le module business model canvas m''a aidé à clarifier mon projet avant de me lancer. Essentiel.', true, now() - interval '3 months'),
    ('a1000001-0000-0000-0000-000000000006', v_course_id, 4, 'Le module financements disponibles en Afrique est une vraie valeur ajoutée. Pas trouvé ailleurs.', true, now() - interval '5 weeks')
  ON CONFLICT (user_id, course_id) DO NOTHING; END IF;

END $$;
