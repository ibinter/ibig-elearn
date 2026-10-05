-- ============================================================
-- RESET COMPLET DES AVIS
-- 30 profils uniques — chacun commente UNE SEULE formation
-- Noms africains (80%) + européens (20%) pour la diversité
-- Pays variés (pas tous CI)
-- ============================================================

-- 1. Supprimer TOUS les avis des faux profils
DELETE FROM reviews WHERE user_id IN (
  SELECT id FROM profiles WHERE email LIKE '%@learner.local'
);

-- 2. Corriger les éventuels full_name avec préfixes parasites
UPDATE profiles SET full_name = REPLACE(full_name, 'Dr. ', '') WHERE email LIKE '%@learner.local';
UPDATE profiles SET full_name = REPLACE(full_name, 'Dr.', '') WHERE email LIKE '%@learner.local';

-- 3. Corriger les pays (trop uniforme — tous CI)
UPDATE profiles SET country = 'SN' WHERE id = 'a1000001-0000-0000-0000-000000000002';
UPDATE profiles SET country = 'ML' WHERE id = 'a1000001-0000-0000-0000-000000000003';
UPDATE profiles SET country = 'GN' WHERE id = 'a1000001-0000-0000-0000-000000000004';
UPDATE profiles SET country = 'BF' WHERE id = 'a1000001-0000-0000-0000-000000000005';
UPDATE profiles SET country = 'TG' WHERE id = 'a1000001-0000-0000-0000-000000000006';
UPDATE profiles SET country = 'BJ' WHERE id = 'a1000001-0000-0000-0000-000000000007';
UPDATE profiles SET country = 'CM' WHERE id = 'a1000001-0000-0000-0000-000000000008';
UPDATE profiles SET country = 'SN' WHERE id = 'a1000001-0000-0000-0000-000000000009';
UPDATE profiles SET country = 'GH' WHERE id = 'a1000001-0000-0000-0000-000000000010';
UPDATE profiles SET country = 'FR' WHERE id = 'a1000001-0000-0000-0000-000000000011';
UPDATE profiles SET country = 'CI' WHERE id = 'a1000001-0000-0000-0000-000000000012';
UPDATE profiles SET country = 'SN' WHERE id = 'a1000001-0000-0000-0000-000000000013';
UPDATE profiles SET country = 'ML' WHERE id = 'a1000001-0000-0000-0000-000000000014';
UPDATE profiles SET country = 'CI' WHERE id = 'a1000001-0000-0000-0000-000000000015';
UPDATE profiles SET country = 'CM' WHERE id = 'a1000001-0000-0000-0000-000000000016';
UPDATE profiles SET country = 'FR' WHERE id = 'a1000001-0000-0000-0000-000000000017';
UPDATE profiles SET country = 'GN' WHERE id = 'a1000001-0000-0000-0000-000000000018';
UPDATE profiles SET country = 'BF' WHERE id = 'a1000001-0000-0000-0000-000000000019';
UPDATE profiles SET country = 'CI' WHERE id = 'a1000001-0000-0000-0000-000000000020';
UPDATE profiles SET country = 'SN' WHERE id = 'a1000001-0000-0000-0000-000000000021';
UPDATE profiles SET country = 'TG' WHERE id = 'a1000001-0000-0000-0000-000000000022';
UPDATE profiles SET country = 'CI' WHERE id = 'a1000001-0000-0000-0000-000000000023';
UPDATE profiles SET country = 'BJ' WHERE id = 'a1000001-0000-0000-0000-000000000024';
UPDATE profiles SET country = 'ML' WHERE id = 'a1000001-0000-0000-0000-000000000025';

-- 4. Créer 5 profils supplémentaires pour atteindre 30
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, role, aud)
VALUES
  ('a1000001-0000-0000-0000-000000000026','boris.ngom.ibig@learner.local','',now(),now()-interval '6 weeks',now(),'{"provider":"email","providers":["email"]}','{"full_name":"Boris Ngom"}','authenticated','authenticated'),
  ('a1000001-0000-0000-0000-000000000027','sandrine.aka.ibig@learner.local','',now(),now()-interval '3 weeks',now(),'{"provider":"email","providers":["email"]}','{"full_name":"Sandrine Aka"}','authenticated','authenticated'),
  ('a1000001-0000-0000-0000-000000000028','mamadou.sy.ibig@learner.local','',now(),now()-interval '2 months',now(),'{"provider":"email","providers":["email"]}','{"full_name":"Mamadou Sy"}','authenticated','authenticated'),
  ('a1000001-0000-0000-0000-000000000029','rachel.boni.ibig@learner.local','',now(),now()-interval '7 weeks',now(),'{"provider":"email","providers":["email"]}','{"full_name":"Rachel Boni"}','authenticated','authenticated'),
  ('a1000001-0000-0000-0000-000000000030','kevin.ehui.ibig@learner.local','',now(),now()-interval '4 weeks',now(),'{"provider":"email","providers":["email"]}','{"full_name":"Kévin Ehui"}','authenticated','authenticated')
ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, email, full_name, avatar_url, role, country, created_at)
VALUES
  ('a1000001-0000-0000-0000-000000000026','boris.ngom.ibig@learner.local','Boris Ngom',null,'apprenant','SN',now()-interval '6 weeks'),
  ('a1000001-0000-0000-0000-000000000027','sandrine.aka.ibig@learner.local','Sandrine Aka',null,'apprenant','CI',now()-interval '3 weeks'),
  ('a1000001-0000-0000-0000-000000000028','mamadou.sy.ibig@learner.local','Mamadou Sy',null,'apprenant','SN',now()-interval '2 months'),
  ('a1000001-0000-0000-0000-000000000029','rachel.boni.ibig@learner.local','Rachel Boni',null,'apprenant','BJ',now()-interval '7 weeks'),
  ('a1000001-0000-0000-0000-000000000030','kevin.ehui.ibig@learner.local','Kévin Ehui',null,'apprenant','CI',now()-interval '4 weeks')
ON CONFLICT (id) DO NOTHING;

-- 5. Insérer les avis — plan strict : 1 utilisateur = 1 seule formation
-- u001→Compta  u002→Compta  u003→Compta
-- u004→Excel   u005→Excel   u006→Excel
-- u007→Mktg    u008→Mktg    u009→Mktg
-- u010→Mgmt    u011→Mgmt    u012→Mgmt
-- u013→IA      u014→IA      u015→IA
-- u016→Finance u017→Finance u018→Finance
-- u019→RH      u020→RH      u021→RH
-- u022→Ecom    u023→Ecom    u024→Ecom
-- u025→Comm    u026→Comm    u027→Comm
-- u028→Entrepr u029→Entrepr u030→Entrepr

DO $$ DECLARE v uuid;
BEGIN

  -- COMPTABILITÉ OHADA
  SELECT id INTO v FROM courses WHERE title ILIKE '%Comptabilit%OHADA%' LIMIT 1;
  IF v IS NOT NULL THEN INSERT INTO reviews (user_id,course_id,rating,comment,is_published,created_at) VALUES
    ('a1000001-0000-0000-0000-000000000001',v,5,'Les exemples SYSCOHADA s''appliquent directement à mon travail de comptable. Enfin une formation qui parle vrai.',true,now()-interval '8 weeks'),
    ('a1000001-0000-0000-0000-000000000002',v,4,'Module TVA très clair. J''ai arrêté de confondre TVA collectée et TVA déductible.',true,now()-interval '5 weeks'),
    ('a1000001-0000-0000-0000-000000000003',v,5,'Je recommande à tous les gérants de PME. Les bilans ne me font plus peur.',true,now()-interval '2 weeks')
  ON CONFLICT DO NOTHING; END IF;

  -- EXCEL
  SELECT id INTO v FROM courses WHERE title ILIKE '%Excel%Google Sheets%' LIMIT 1;
  IF v IS NOT NULL THEN INSERT INTO reviews (user_id,course_id,rating,comment,is_published,created_at) VALUES
    ('a1000001-0000-0000-0000-000000000004',v,5,'RECHERCHEV et les TCD ont changé ma façon de travailler. Indispensable.',true,now()-interval '3 months'),
    ('a1000001-0000-0000-0000-000000000005',v,4,'Bonne progression. Le module Flash Fill m''a époustouflé par son efficacité.',true,now()-interval '6 weeks'),
    ('a1000001-0000-0000-0000-000000000006',v,5,'Le tableau de bord final vaut à lui seul tout le cours. Gain de temps énorme.',true,now()-interval '3 weeks')
  ON CONFLICT DO NOTHING; END IF;

  -- MARKETING DIGITAL
  SELECT id INTO v FROM courses WHERE slug='marketing-digital-pme-africaines' LIMIT 1;
  IF v IS NOT NULL THEN INSERT INTO reviews (user_id,course_id,rating,comment,is_published,created_at) VALUES
    ('a1000001-0000-0000-0000-000000000007',v,5,'Campagne Facebook à 30 000 FCFA, 4 nouveaux clients en 2 semaines. Très concret.',true,now()-interval '9 weeks'),
    ('a1000001-0000-0000-0000-000000000008',v,4,'Très bien pour les PME. Le module WhatsApp Business est directement applicable.',true,now()-interval '4 weeks'),
    ('a1000001-0000-0000-0000-000000000009',v,3,'Bonne base mais j''aurais aimé plus de contenu sur TikTok qui explose en Afrique.',true,now()-interval '2 weeks')
  ON CONFLICT DO NOTHING; END IF;

  -- MANAGEMENT & LEADERSHIP
  SELECT id INTO v FROM courses WHERE title ILIKE '%Management%Leadership%' LIMIT 1;
  IF v IS NOT NULL THEN INSERT INTO reviews (user_id,course_id,rating,comment,is_published,created_at) VALUES
    ('a1000001-0000-0000-0000-000000000010',v,5,'Objectifs SMART mis en place dès la semaine suivante. Mon équipe est plus productive.',true,now()-interval '7 weeks'),
    ('a1000001-0000-0000-0000-000000000011',v,4,'Le module délégation m''a libéré du temps. Enfin du recul sur mon activité.',true,now()-interval '5 weeks'),
    ('a1000001-0000-0000-0000-000000000012',v,5,'La matrice Eisenhower a changé mes matinées. Je recommande sans hésiter.',true,now()-interval '3 weeks')
  ON CONFLICT DO NOTHING; END IF;

  -- INTELLIGENCE ARTIFICIELLE
  SELECT id INTO v FROM courses WHERE title ILIKE '%Intelligence Artificielle%' LIMIT 1;
  IF v IS NOT NULL THEN INSERT INTO reviews (user_id,course_id,rating,comment,is_published,created_at) VALUES
    ('a1000001-0000-0000-0000-000000000013',v,5,'Des exemples africains concrets — enfin ! ChatGPT est devenu mon assistant quotidien.',true,now()-interval '6 weeks'),
    ('a1000001-0000-0000-0000-000000000014',v,4,'Le module prompt engineering est bien expliqué. Mériterait d''être encore plus approfondi.',true,now()-interval '4 weeks'),
    ('a1000001-0000-0000-0000-000000000015',v,4,'Le module hallucinations IA m''a évité plusieurs erreurs dans mes rapports professionnels.',true,now()-interval '10 days')
  ON CONFLICT DO NOTHING; END IF;

  -- FINANCE PERSONNELLE
  SELECT id INTO v FROM courses WHERE slug='finance-personnelle-investissement-afrique' LIMIT 1;
  IF v IS NOT NULL THEN INSERT INTO reviews (user_id,course_id,rating,comment,is_published,created_at) VALUES
    ('a1000001-0000-0000-0000-000000000016',v,5,'Premier vrai plan d''épargne de ma vie. La règle des 72 m''a ouvert les yeux sur les intérêts composés.',true,now()-interval '2 months'),
    ('a1000001-0000-0000-0000-000000000017',v,5,'Module bons de trésor et BRVM très instructif. Des placements que je ne connaissais pas.',true,now()-interval '6 weeks'),
    ('a1000001-0000-0000-0000-000000000018',v,4,'Très complet sur l''investissement. Aurait pu aller plus loin sur la gestion des dettes.',true,now()-interval '3 weeks')
  ON CONFLICT DO NOTHING; END IF;

  -- RESSOURCES HUMAINES
  SELECT id INTO v FROM courses WHERE title ILIKE '%Ressources Humaines%' LIMIT 1;
  IF v IS NOT NULL THEN INSERT INTO reviews (user_id,course_id,rating,comment,is_published,created_at) VALUES
    ('a1000001-0000-0000-0000-000000000019',v,5,'Le guide d''entretien STAR m''a permis de recruter un profil solide sans aide externe.',true,now()-interval '8 weeks'),
    ('a1000001-0000-0000-0000-000000000020',v,4,'La grille d''évaluation est un outil que j''utilise à chaque entretien maintenant.',true,now()-interval '5 weeks'),
    ('a1000001-0000-0000-0000-000000000021',v,3,'Bien sur le recrutement mais le module paie manque de détail sur le calcul du salaire net.',true,now()-interval '2 weeks')
  ON CONFLICT DO NOTHING; END IF;

  -- E-COMMERCE
  SELECT id INTO v FROM courses WHERE slug='ecommerce-vente-en-ligne-afrique' LIMIT 1;
  IF v IS NOT NULL THEN INSERT INTO reviews (user_id,course_id,rating,comment,is_published,created_at) VALUES
    ('a1000001-0000-0000-0000-000000000022',v,5,'Boutique WooCommerce + CinetPay en ligne en 3 jours. Première commande la semaine suivante.',true,now()-interval '7 weeks'),
    ('a1000001-0000-0000-0000-000000000023',v,4,'Le module fiches produits et photos a vraiment amélioré mes conversions.',true,now()-interval '4 weeks'),
    ('a1000001-0000-0000-0000-000000000024',v,5,'Complet et pratique. Le module Mobile Money pour l''Afrique est particulièrement utile.',true,now()-interval '2 weeks')
  ON CONFLICT DO NOTHING; END IF;

  -- COMMUNICATION PROFESSIONNELLE
  SELECT id INTO v FROM courses WHERE title ILIKE '%Communication%Professionnelle%' LIMIT 1;
  IF v IS NOT NULL THEN INSERT INTO reviews (user_id,course_id,rating,comment,is_published,created_at) VALUES
    ('a1000001-0000-0000-0000-000000000025',v,5,'Mes présentations en conseil d''administration sont devenues beaucoup plus impactantes.',true,now()-interval '6 weeks'),
    ('a1000001-0000-0000-0000-000000000026',v,4,'La méthode SBI pour les feedbacks fonctionne vraiment. Mes échanges sont plus sereins.',true,now()-interval '3 weeks'),
    ('a1000001-0000-0000-0000-000000000027',v,4,'Bon module sur la communication non-verbale. Aurait pu inclure des exercices pratiques filmés.',true,now()-interval '10 days')
  ON CONFLICT DO NOTHING; END IF;

  -- ENTREPRENEURIAT
  SELECT id INTO v FROM courses WHERE title ILIKE '%Entrepren%' LIMIT 1;
  IF v IS NOT NULL THEN INSERT INTO reviews (user_id,course_id,rating,comment,is_published,created_at) VALUES
    ('a1000001-0000-0000-0000-000000000028',v,5,'Le canvas m''a aidé à structurer mon projet avant de solliciter un investisseur. Indispensable.',true,now()-interval '3 months'),
    ('a1000001-0000-0000-0000-000000000029',v,4,'Module financement très complet. Je ne connaissais pas la moitié des fonds disponibles en Afrique.',true,now()-interval '5 weeks'),
    ('a1000001-0000-0000-0000-000000000030',v,5,'La partie réseau entrepreneurial est une vraie valeur ajoutée. Pas trouvé ailleurs.',true,now()-interval '2 weeks')
  ON CONFLICT DO NOTHING; END IF;

END $$;
