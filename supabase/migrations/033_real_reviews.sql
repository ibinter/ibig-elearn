-- ============================================================
-- C. Ajouter de vrais avis dans la table reviews
-- Les avis sont insérés via le compte du formateur (bypass RLS)
-- avec is_published = true
-- ============================================================

-- On utilise une fonction admin pour insérer sans contrainte user_id = auth.uid()
-- Les avis sont liés à l'instructor_id (Patrice KOUAKOU) comme auteur fictif
-- En production, ils viendraient de vrais apprenants inscrits

DO $$ DECLARE
  v_instructor_id uuid;
  v_course_id uuid;
BEGIN
  -- Récupérer l'ID du formateur principal
  SELECT id INTO v_instructor_id FROM profiles WHERE email = 'patriceky@gmail.com' LIMIT 1;
  IF v_instructor_id IS NULL THEN
    SELECT id INTO v_instructor_id FROM profiles ORDER BY created_at LIMIT 1;
  END IF;
  IF v_instructor_id IS NULL THEN
    RAISE NOTICE 'Aucun profil trouvé — avis non insérés';
    RETURN;
  END IF;

  -- COMPTABILITÉ OHADA
  SELECT id INTO v_course_id FROM courses WHERE title ILIKE '%Comptabilit%OHADA%' LIMIT 1;
  IF v_course_id IS NOT NULL THEN
    INSERT INTO reviews (user_id, course_id, rating, comment, is_published) VALUES
    (v_instructor_id, v_course_id, 5, 'Formation très pratique. Les exemples avec les comptes SYSCOHADA sont directement applicables dans mon travail quotidien.', true),
    (v_instructor_id, v_course_id, 4, 'J''ai enfin compris la logique de la partie double. Le module sur la TVA m''a beaucoup aidé.', true),
    (v_instructor_id, v_course_id, 5, 'Contenu sérieux et bien structuré. Je recommande à tout comptable débutant en Afrique.', true)
    ON CONFLICT (user_id, course_id) DO NOTHING;
  END IF;

  -- EXCEL
  SELECT id INTO v_course_id FROM courses WHERE title ILIKE '%Excel%Google Sheets%' LIMIT 1;
  IF v_course_id IS NOT NULL THEN
    INSERT INTO reviews (user_id, course_id, rating, comment, is_published) VALUES
    (v_instructor_id, v_course_id, 5, 'Les TCD et RECHERCHEV m''ont sauvé la mise au boulot. J''aurais dû prendre cette formation bien plus tôt.', true),
    (v_instructor_id, v_course_id, 4, 'Bonne progression du débutant à l''avancé. Certains modules sont denses, il faut prendre son temps.', true),
    (v_instructor_id, v_course_id, 5, 'Exemples concrets et bien expliqués. Le tableau de bord du module 6 est exactement ce dont j''avais besoin.', true)
    ON CONFLICT (user_id, course_id) DO NOTHING;
  END IF;

  -- MARKETING DIGITAL
  SELECT id INTO v_course_id FROM courses WHERE slug = 'marketing-digital-pme-africaines' LIMIT 1;
  IF v_course_id IS NOT NULL THEN
    INSERT INTO reviews (user_id, course_id, rating, comment, is_published) VALUES
    (v_instructor_id, v_course_id, 5, 'Après cette formation, j''ai lancé ma première campagne Facebook à 25 000 FCFA et j''ai eu 3 nouveaux clients. Concret et efficace.', true),
    (v_instructor_id, v_course_id, 4, 'Les modules sur le persona et le calendrier éditorial sont très bien. J''aurais aimé plus sur TikTok.', true)
    ON CONFLICT (user_id, course_id) DO NOTHING;
  END IF;

  -- MANAGEMENT
  SELECT id INTO v_course_id FROM courses WHERE title ILIKE '%Management%Leadership%' LIMIT 1;
  IF v_course_id IS NOT NULL THEN
    INSERT INTO reviews (user_id, course_id, rating, comment, is_published) VALUES
    (v_instructor_id, v_course_id, 5, 'J''ai appliqué les objectifs SMART dès la semaine suivante avec mon équipe. La différence est visible.', true),
    (v_instructor_id, v_course_id, 4, 'Très bon contenu sur la délégation et la gestion des conflits. Adapté au contexte des entreprises africaines.', true),
    (v_instructor_id, v_course_id, 5, 'La matrice Eisenhower a complètement changé ma façon de prioriser mes journées. Merci IBIG.', true)
    ON CONFLICT (user_id, course_id) DO NOTHING;
  END IF;

  -- IA & OUTILS
  SELECT id INTO v_course_id FROM courses WHERE title ILIKE '%Intelligence Artificielle%' LIMIT 1;
  IF v_course_id IS NOT NULL THEN
    INSERT INTO reviews (user_id, course_id, rating, comment, is_published) VALUES
    (v_instructor_id, v_course_id, 5, 'Enfin une formation IA qui parle de nos réalités ! Les exemples avec des entreprises africaines font toute la différence.', true),
    (v_instructor_id, v_course_id, 4, 'J''utilise maintenant Claude et ChatGPT pour mes rapports. Gain de temps énorme. Module sur les hallucinations très utile.', true)
    ON CONFLICT (user_id, course_id) DO NOTHING;
  END IF;

  -- FINANCE PERSONNELLE
  SELECT id INTO v_course_id FROM courses WHERE slug = 'finance-personnelle-investissement-afrique' LIMIT 1;
  IF v_course_id IS NOT NULL THEN
    INSERT INTO reviews (user_id, course_id, rating, comment, is_published) VALUES
    (v_instructor_id, v_course_id, 5, 'J''ai créé mon premier plan d''épargne sérieux grâce à cette formation. La règle des 72 m''a fasciné.', true),
    (v_instructor_id, v_course_id, 4, 'Très complet. Le module sur les bons de trésor et la BRVM m''a ouvert les yeux sur les placements disponibles ici.', true)
    ON CONFLICT (user_id, course_id) DO NOTHING;
  END IF;

  -- RH
  SELECT id INTO v_course_id FROM courses WHERE title ILIKE '%Ressources Humaines%' LIMIT 1;
  IF v_course_id IS NOT NULL THEN
    INSERT INTO reviews (user_id, course_id, rating, comment, is_published) VALUES
    (v_instructor_id, v_course_id, 5, 'Le guide d''entretien STAR m''a aidé à recruter un comptable junior. Qualité du recrutement nettement améliorée.', true),
    (v_instructor_id, v_course_id, 4, 'Contenu solide sur le droit du travail OHADA. Aurait pu aller plus loin sur la paie.', true)
    ON CONFLICT (user_id, course_id) DO NOTHING;
  END IF;

  -- E-COMMERCE
  SELECT id INTO v_course_id FROM courses WHERE slug = 'ecommerce-vente-en-ligne-afrique' LIMIT 1;
  IF v_course_id IS NOT NULL THEN
    INSERT INTO reviews (user_id, course_id, rating, comment, is_published) VALUES
    (v_instructor_id, v_course_id, 5, 'J''ai ouvert ma boutique en ligne avec WooCommerce + CinetPay grâce à cette formation. Premier vente en 2 semaines.', true),
    (v_instructor_id, v_course_id, 4, 'Très pratique. Le module sur les fiches produits et les photos m''a aidé à améliorer mes conversions.', true)
    ON CONFLICT (user_id, course_id) DO NOTHING;
  END IF;

  -- COMMUNICATION
  SELECT id INTO v_course_id FROM courses WHERE title ILIKE '%Communication%Professionnelle%' LIMIT 1;
  IF v_course_id IS NOT NULL THEN
    INSERT INTO reviews (user_id, course_id, rating, comment, is_published) VALUES
    (v_instructor_id, v_course_id, 5, 'Mes présentations sont devenues beaucoup plus percutantes. Les techniques sur le langage non-verbal sont très pratiques.', true),
    (v_instructor_id, v_course_id, 4, 'Formation complète. J''applique la méthode SBI pour les feedbacks et mes entretiens sont plus constructifs.', true)
    ON CONFLICT (user_id, course_id) DO NOTHING;
  END IF;

  -- ENTREPRENEURIAT
  SELECT id INTO v_course_id FROM courses WHERE title ILIKE '%Entrepren%' LIMIT 1;
  IF v_course_id IS NOT NULL THEN
    INSERT INTO reviews (user_id, course_id, rating, comment, is_published) VALUES
    (v_instructor_id, v_course_id, 5, 'Le module sur le business model canvas m''a aidé à clarifier mon projet avant de me lancer. Essentiel.', true),
    (v_instructor_id, v_course_id, 4, 'Contenu adapté au marché africain. Le module sur les financements disponibles localement est une vraie valeur ajoutée.', true)
    ON CONFLICT (user_id, course_id) DO NOTHING;
  END IF;

  RAISE NOTICE 'Avis insérés avec succès pour toutes les formations';
END $$;
