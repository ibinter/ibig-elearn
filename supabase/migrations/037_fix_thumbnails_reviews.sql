-- ============================================================
-- THUMBNAILS : Photos avec professionnels africains et diversité réelle
-- ============================================================
UPDATE courses SET thumbnail_url = CASE

  -- Excel & Google Sheets → femme africaine travaillant sur ordinateur
  WHEN title ILIKE '%Excel%Google Sheets%'
    THEN 'https://images.unsplash.com/photo-1589156229687-496a31ad1d1f?w=800&h=450&fit=crop&q=80'

  -- IA → homme africain + technologie
  WHEN title ILIKE '%Intelligence Artificielle%'
    THEN 'https://images.unsplash.com/photo-1617802690992-15d93263d3a9?w=800&h=450&fit=crop&q=80'

  -- Marketing Digital → femme africaine avec smartphone/réseaux sociaux
  WHEN slug = 'marketing-digital-pme-africaines'
    THEN 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&h=450&fit=crop&q=80'

  -- Finance → homme africain avec documents financiers
  WHEN slug = 'finance-personnelle-investissement-afrique'
    THEN 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=800&h=450&fit=crop&q=80'

  -- Comptabilité → bureau professionnel, documents, calculatrice (abstrait)
  WHEN title ILIKE '%Comptabilit%OHADA%'
    THEN 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&h=450&fit=crop&q=80'

  -- Management → équipe africaine et européenne en réunion (diversité réelle)
  WHEN title ILIKE '%Management%Leadership%'
    THEN 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&h=450&fit=crop&q=80'

  -- RH → femme africaine professionnelle (entretien RH)
  WHEN title ILIKE '%Ressources Humaines%'
    THEN 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&h=450&fit=crop&q=80'

  -- E-commerce → livraison/colis (abstrait, sans personnes)
  WHEN slug = 'ecommerce-vente-en-ligne-afrique'
    THEN 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&h=450&fit=crop&q=80'

  -- Communication → homme africain présentant en public
  WHEN title ILIKE '%Communication%Professionnelle%'
    THEN 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800&h=450&fit=crop&q=80'

  -- Entrepreneuriat → équipe startup africaine diverse (coworking)
  WHEN title ILIKE '%Entrepren%'
    THEN 'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&h=450&fit=crop&q=80'

  ELSE thumbnail_url
END
WHERE title ILIKE '%Excel%Google Sheets%'
   OR title ILIKE '%Intelligence Artificielle%'
   OR slug = 'marketing-digital-pme-africaines'
   OR slug = 'finance-personnelle-investissement-afrique'
   OR title ILIKE '%Comptabilit%OHADA%'
   OR title ILIKE '%Management%Leadership%'
   OR title ILIKE '%Ressources Humaines%'
   OR slug = 'ecommerce-vente-en-ligne-afrique'
   OR title ILIKE '%Communication%Professionnelle%'
   OR title ILIKE '%Entrepren%';


-- ============================================================
-- AVIS : Supprimer les anciens, créer 25 profils uniques,
-- chaque personne ne commente QU'UNE SEULE formation
-- ============================================================

-- Supprimer tous les avis des faux profils existants
DELETE FROM reviews WHERE user_id IN (
  SELECT id FROM profiles WHERE email LIKE '%@learner.local'
);

-- Ajouter 15 nouveaux profils (en plus des 10 existants = 25 total)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, role, aud)
VALUES
  ('a1000001-0000-0000-0000-000000000011', 'jean.pierre.ibig@learner.local',      '', now(), now() - interval '3 months', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Jean-Pierre Mensah"}',   'authenticated', 'authenticated'),
  ('a1000001-0000-0000-0000-000000000012', 'claire.adjoua.ibig@learner.local',    '', now(), now() - interval '2 months', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Claire Adjoua"}',        'authenticated', 'authenticated'),
  ('a1000001-0000-0000-0000-000000000013', 'paul.diallo.ibig@learner.local',      '', now(), now() - interval '4 months', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Paul Diallo"}',          'authenticated', 'authenticated'),
  ('a1000001-0000-0000-0000-000000000014', 'sophie.martin.ibig@learner.local',    '', now(), now() - interval '5 weeks',  now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Sophie Martin"}',        'authenticated', 'authenticated'),
  ('a1000001-0000-0000-0000-000000000015', 'kofi.asante.ibig@learner.local',      '', now(), now() - interval '6 weeks',  now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Kofi Asante"}',          'authenticated', 'authenticated'),
  ('a1000001-0000-0000-0000-000000000016', 'grace.ama.ibig@learner.local',        '', now(), now() - interval '7 weeks',  now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Grace Ama"}',            'authenticated', 'authenticated'),
  ('a1000001-0000-0000-0000-000000000017', 'marc.dubois.ibig@learner.local',      '', now(), now() - interval '2 months', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Marc Dubois"}',          'authenticated', 'authenticated'),
  ('a1000001-0000-0000-0000-000000000018', 'alice.toure.ibig@learner.local',      '', now(), now() - interval '3 months', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Alice Touré"}',          'authenticated', 'authenticated'),
  ('a1000001-0000-0000-0000-000000000019', 'david.ouattara.ibig@learner.local',   '', now(), now() - interval '5 months', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"David Ouattara"}',       'authenticated', 'authenticated'),
  ('a1000001-0000-0000-0000-000000000020', 'fatimata.balde.ibig@learner.local',   '', now(), now() - interval '1 month',  now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Fatimata Baldé"}',       'authenticated', 'authenticated'),
  ('a1000001-0000-0000-0000-000000000021', 'olivier.kra.ibig@learner.local',      '', now(), now() - interval '6 weeks',  now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Olivier Kra"}',          'authenticated', 'authenticated'),
  ('a1000001-0000-0000-0000-000000000022', 'nathalie.gba.ibig@learner.local',     '', now(), now() - interval '8 weeks',  now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Nathalie Gba"}',         'authenticated', 'authenticated'),
  ('a1000001-0000-0000-0000-000000000023', 'yves.coulibaly.ibig@learner.local',   '', now(), now() - interval '3 weeks',  now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Yves Coulibaly"}',       'authenticated', 'authenticated'),
  ('a1000001-0000-0000-0000-000000000024', 'cecile.n-guessan.ibig@learner.local', '', now(), now() - interval '4 weeks',  now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Cécile N''Guessan"}',    'authenticated', 'authenticated'),
  ('a1000001-0000-0000-0000-000000000025', 'thomas.bamba.ibig@learner.local',     '', now(), now() - interval '9 weeks',  now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Thomas Bamba"}',         'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, email, full_name, avatar_url, role, created_at)
VALUES
  ('a1000001-0000-0000-0000-000000000011', 'jean.pierre.ibig@learner.local',      'Jean-Pierre Mensah',  null, 'apprenant', now() - interval '3 months'),
  ('a1000001-0000-0000-0000-000000000012', 'claire.adjoua.ibig@learner.local',    'Claire Adjoua',       null, 'apprenant', now() - interval '2 months'),
  ('a1000001-0000-0000-0000-000000000013', 'paul.diallo.ibig@learner.local',      'Paul Diallo',         null, 'apprenant', now() - interval '4 months'),
  ('a1000001-0000-0000-0000-000000000014', 'sophie.martin.ibig@learner.local',    'Sophie Martin',       null, 'apprenant', now() - interval '5 weeks'),
  ('a1000001-0000-0000-0000-000000000015', 'kofi.asante.ibig@learner.local',      'Kofi Asante',         null, 'apprenant', now() - interval '6 weeks'),
  ('a1000001-0000-0000-0000-000000000016', 'grace.ama.ibig@learner.local',        'Grace Ama',           null, 'apprenant', now() - interval '7 weeks'),
  ('a1000001-0000-0000-0000-000000000017', 'marc.dubois.ibig@learner.local',      'Marc Dubois',         null, 'apprenant', now() - interval '2 months'),
  ('a1000001-0000-0000-0000-000000000018', 'alice.toure.ibig@learner.local',      'Alice Touré',         null, 'apprenant', now() - interval '3 months'),
  ('a1000001-0000-0000-0000-000000000019', 'david.ouattara.ibig@learner.local',   'David Ouattara',      null, 'apprenant', now() - interval '5 months'),
  ('a1000001-0000-0000-0000-000000000020', 'fatimata.balde.ibig@learner.local',   'Fatimata Baldé',      null, 'apprenant', now() - interval '1 month'),
  ('a1000001-0000-0000-0000-000000000021', 'olivier.kra.ibig@learner.local',      'Olivier Kra',         null, 'apprenant', now() - interval '6 weeks'),
  ('a1000001-0000-0000-0000-000000000022', 'nathalie.gba.ibig@learner.local',     'Nathalie Gba',        null, 'apprenant', now() - interval '8 weeks'),
  ('a1000001-0000-0000-0000-000000000023', 'yves.coulibaly.ibig@learner.local',   'Yves Coulibaly',      null, 'apprenant', now() - interval '3 weeks'),
  ('a1000001-0000-0000-0000-000000000024', 'cecile.n-guessan.ibig@learner.local', 'Cécile N''Guessan',   null, 'apprenant', now() - interval '4 weeks'),
  ('a1000001-0000-0000-0000-000000000025', 'thomas.bamba.ibig@learner.local',     'Thomas Bamba',        null, 'apprenant', now() - interval '9 weeks')
ON CONFLICT (id) DO NOTHING;

-- Avis : 1 personne = 1 seule formation (25 personnes, 25 avis uniques)
DO $$ DECLARE v uuid;
BEGIN
  -- COMPTABILITÉ OHADA (3 avis)
  SELECT id INTO v FROM courses WHERE title ILIKE '%Comptabilit%OHADA%' LIMIT 1;
  IF v IS NOT NULL THEN INSERT INTO reviews (user_id, course_id, rating, comment, is_published, created_at) VALUES
    ('a1000001-0000-0000-0000-000000000001', v, 5, 'Les exemples SYSCOHADA sont directement applicables dans mon travail. Enfin une formation qui parle vrai.', true, now() - interval '6 weeks'),
    ('a1000001-0000-0000-0000-000000000013', v, 4, 'Module TVA très clair. J''ai arrêté de confondre TVA collectée et TVA déductible.', true, now() - interval '3 weeks'),
    ('a1000001-0000-0000-0000-000000000019', v, 5, 'Je recommande à tous les gérants de PME. Les bilans ne me font plus peur.', true, now() - interval '10 days')
  ON CONFLICT (user_id, course_id) DO NOTHING; END IF;

  -- EXCEL (3 avis)
  SELECT id INTO v FROM courses WHERE title ILIKE '%Excel%Google Sheets%' LIMIT 1;
  IF v IS NOT NULL THEN INSERT INTO reviews (user_id, course_id, rating, comment, is_published, created_at) VALUES
    ('a1000001-0000-0000-0000-000000000002', v, 5, 'RECHERCHEV et les TCD ont changé ma façon de travailler. J''aurais dû prendre cette formation bien plus tôt.', true, now() - interval '2 months'),
    ('a1000001-0000-0000-0000-000000000015', v, 4, 'Progression bien dosée. Le Flash Fill m''a époustouflé.', true, now() - interval '5 weeks'),
    ('a1000001-0000-0000-0000-000000000022', v, 5, 'Le tableau de bord final est exactement ce que je faisais à la main. Un gain de temps énorme.', true, now() - interval '2 weeks')
  ON CONFLICT (user_id, course_id) DO NOTHING; END IF;

  -- MARKETING DIGITAL (2 avis)
  SELECT id INTO v FROM courses WHERE slug = 'marketing-digital-pme-africaines' LIMIT 1;
  IF v IS NOT NULL THEN INSERT INTO reviews (user_id, course_id, rating, comment, is_published, created_at) VALUES
    ('a1000001-0000-0000-0000-000000000003', v, 5, 'Campagne Facebook à 30 000 FCFA, 4 nouveaux clients en 2 semaines. Concret et efficace.', true, now() - interval '7 weeks'),
    ('a1000001-0000-0000-0000-000000000016', v, 4, 'Le module persona est excellent. Mes publications engagent beaucoup plus qu''avant.', true, now() - interval '3 weeks')
  ON CONFLICT (user_id, course_id) DO NOTHING; END IF;

  -- MANAGEMENT (3 avis)
  SELECT id INTO v FROM courses WHERE title ILIKE '%Management%Leadership%' LIMIT 1;
  IF v IS NOT NULL THEN INSERT INTO reviews (user_id, course_id, rating, comment, is_published, created_at) VALUES
    ('a1000001-0000-0000-0000-000000000004', v, 5, 'J''ai mis en place les objectifs SMART dès la semaine suivante. Ma team est plus productive.', true, now() - interval '6 weeks'),
    ('a1000001-0000-0000-0000-000000000017', v, 4, 'Le module délégation m''a libéré du temps. Enfin du recul sur mon activité.', true, now() - interval '1 month'),
    ('a1000001-0000-0000-0000-000000000023', v, 5, 'La matrice Eisenhower a changé mes matinées. Je recommande sans hésiter.', true, now() - interval '2 weeks')
  ON CONFLICT (user_id, course_id) DO NOTHING; END IF;

  -- IA (2 avis)
  SELECT id INTO v FROM courses WHERE title ILIKE '%Intelligence Artificielle%' LIMIT 1;
  IF v IS NOT NULL THEN INSERT INTO reviews (user_id, course_id, rating, comment, is_published, created_at) VALUES
    ('a1000001-0000-0000-0000-000000000005', v, 5, 'Des exemples avec des entreprises africaines — enfin ! ChatGPT est devenu mon assistant quotidien.', true, now() - interval '5 weeks'),
    ('a1000001-0000-0000-0000-000000000011', v, 4, 'Très utile. Le module sur les hallucinations IA m''a évité plusieurs erreurs dans mes rapports.', true, now() - interval '2 weeks')
  ON CONFLICT (user_id, course_id) DO NOTHING; END IF;

  -- FINANCE PERSONNELLE (2 avis)
  SELECT id INTO v FROM courses WHERE slug = 'finance-personnelle-investissement-afrique' LIMIT 1;
  IF v IS NOT NULL THEN INSERT INTO reviews (user_id, course_id, rating, comment, is_published, created_at) VALUES
    ('a1000001-0000-0000-0000-000000000006', v, 5, 'Premier vrai plan d''épargne de ma vie grâce à cette formation. La règle des 72 m''a ouvert les yeux.', true, now() - interval '2 months'),
    ('a1000001-0000-0000-0000-000000000020', v, 4, 'Module bons de trésor et BRVM très instructif. Des placements que je ne connaissais pas.', true, now() - interval '5 weeks')
  ON CONFLICT (user_id, course_id) DO NOTHING; END IF;

  -- RH (2 avis)
  SELECT id INTO v FROM courses WHERE title ILIKE '%Ressources Humaines%' LIMIT 1;
  IF v IS NOT NULL THEN INSERT INTO reviews (user_id, course_id, rating, comment, is_published, created_at) VALUES
    ('a1000001-0000-0000-0000-000000000007', v, 5, 'Le guide d''entretien STAR m''a permis de recruter un profil solide pour la première fois sans aide externe.', true, now() - interval '7 weeks'),
    ('a1000001-0000-0000-0000-000000000014', v, 4, 'Bon contenu sur le droit du travail OHADA. J''aurais aimé un module sur la paie en FCFA.', true, now() - interval '3 weeks')
  ON CONFLICT (user_id, course_id) DO NOTHING; END IF;

  -- E-COMMERCE (2 avis)
  SELECT id INTO v FROM courses WHERE slug = 'ecommerce-vente-en-ligne-afrique' LIMIT 1;
  IF v IS NOT NULL THEN INSERT INTO reviews (user_id, course_id, rating, comment, is_published, created_at) VALUES
    ('a1000001-0000-0000-0000-000000000008', v, 5, 'Boutique WooCommerce + CinetPay en ligne en 3 jours. Première commande la semaine suivante !', true, now() - interval '6 weeks'),
    ('a1000001-0000-0000-0000-000000000024', v, 4, 'Le module sur les fiches produits et les photos a amélioré mes conversions visiblement.', true, now() - interval '4 weeks')
  ON CONFLICT (user_id, course_id) DO NOTHING; END IF;

  -- COMMUNICATION (2 avis)
  SELECT id INTO v FROM courses WHERE title ILIKE '%Communication%Professionnelle%' LIMIT 1;
  IF v IS NOT NULL THEN INSERT INTO reviews (user_id, course_id, rating, comment, is_published, created_at) VALUES
    ('a1000001-0000-0000-0000-000000000009', v, 5, 'Mes présentations en conseil d''administration sont devenus beaucoup plus impactantes.', true, now() - interval '4 weeks'),
    ('a1000001-0000-0000-0000-000000000012', v, 4, 'La méthode SBI pour les feedbacks fonctionne vraiment. Mes échanges avec mon équipe sont plus sereins.', true, now() - interval '10 days')
  ON CONFLICT (user_id, course_id) DO NOTHING; END IF;

  -- ENTREPRENEURIAT (3 avis)
  SELECT id INTO v FROM courses WHERE title ILIKE '%Entrepren%' LIMIT 1;
  IF v IS NOT NULL THEN INSERT INTO reviews (user_id, course_id, rating, comment, is_published, created_at) VALUES
    ('a1000001-0000-0000-0000-000000000010', v, 5, 'Le canvas m''a aidé à structurer mon projet avant de solliciter un investisseur. Indispensable.', true, now() - interval '3 months'),
    ('a1000001-0000-0000-0000-000000000018', v, 4, 'Module financement très complet. Je ne connaissais pas la moitié des fonds disponibles en Afrique.', true, now() - interval '5 weeks'),
    ('a1000001-0000-0000-0000-000000000025', v, 5, 'Contenu sérieux, exemples concrets. La partie réseau entrepreneurial est une vraie valeur ajoutée.', true, now() - interval '2 weeks')
  ON CONFLICT (user_id, course_id) DO NOTHING; END IF;

END $$;
