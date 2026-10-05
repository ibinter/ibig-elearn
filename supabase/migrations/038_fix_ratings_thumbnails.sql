-- ============================================================
-- 1. NOTES VARIÉES : Ajouter des avis 3★ ciblés pour varier les moyennes
--    Cible : Excel 4.8 / Compta 4.5 / Management 4.7 / IA 4.4
--             Marketing 4.3 / Finance 4.6 / RH 4.2 / Ecom 4.5
--             Communication 4.4 / Entrepreneuriat 4.6
-- ============================================================

-- Profils "critiques constructifs" déjà créés, on les réutilise
-- On ajoute des avis 3★ là où la note doit baisser

DO $$ DECLARE v uuid;
BEGIN
  -- MARKETING DIGITAL → cible 4.3 (actuellement ~4.5)
  -- ajoute un 3★ : (5+4+3)/3 = 4.0 → trop bas, on garde 2 avis et on met un 3★
  -- On supprime l'avis existant de 003 (5★) et on le remplace par 3★
  SELECT id INTO v FROM courses WHERE slug = 'marketing-digital-pme-africaines' LIMIT 1;
  IF v IS NOT NULL THEN
    UPDATE reviews SET rating = 3,
      comment = 'Contenu globalement intéressant mais j''aurais aimé plus d''exemples sur TikTok et Snapchat qui explosent chez les jeunes en Afrique.',
      updated_at = now()
    WHERE user_id = 'a1000001-0000-0000-0000-000000000003' AND course_id = v;
    -- (5★ + 3★) / 2 = 4.0 → on ajoute un 4★ supplémentaire pour avoir 4.33
    INSERT INTO reviews (user_id, course_id, rating, comment, is_published, created_at) VALUES
    ('a1000001-0000-0000-0000-000000000021', v, 4, 'Le module WhatsApp Business est très pratique. Mon taux de conversion a augmenté.', true, now() - interval '5 weeks')
    ON CONFLICT (user_id, course_id) DO NOTHING;
  END IF;

  -- RH → cible 4.2 (actuellement ~4.5)
  SELECT id INTO v FROM courses WHERE title ILIKE '%Ressources Humaines%' LIMIT 1;
  IF v IS NOT NULL THEN
    UPDATE reviews SET rating = 3,
      comment = 'La partie recrutement est bien faite mais le module paie est trop superficiel. Pas de détail sur le calcul du salaire net en FCFA.',
      updated_at = now()
    WHERE user_id = 'a1000001-0000-0000-0000-000000000014' AND course_id = v;
    -- (5★ + 3★) / 2 = 4.0 → on ajoute un 4★
    INSERT INTO reviews (user_id, course_id, rating, comment, is_published, created_at) VALUES
    ('a1000001-0000-0000-0000-000000000011', v, 4, 'La grille d''évaluation en entretien est un outil que j''utilise maintenant à chaque recrutement.', true, now() - interval '4 weeks')
    ON CONFLICT (user_id, course_id) DO NOTHING;
  END IF;

  -- IA → cible 4.4 (actuellement ~4.5)
  SELECT id INTO v FROM courses WHERE title ILIKE '%Intelligence Artificielle%' LIMIT 1;
  IF v IS NOT NULL THEN
    UPDATE reviews SET rating = 4,
      comment = 'Contenu bien expliqué. Le module prompt engineering mérite d''être approfondi mais c''est un bon départ.',
      updated_at = now()
    WHERE user_id = 'a1000001-0000-0000-0000-000000000011' AND course_id = v;
    INSERT INTO reviews (user_id, course_id, rating, comment, is_published, created_at) VALUES
    ('a1000001-0000-0000-0000-000000000012', v, 4, 'Très utile pour comprendre les limites de l''IA. J''applique maintenant la vérification systématique des faits.', true, now() - interval '3 weeks')
    ON CONFLICT (user_id, course_id) DO NOTHING;
  END IF;

  -- COMMUNICATION → cible 4.4 (actuellement ~4.5)
  SELECT id INTO v FROM courses WHERE title ILIKE '%Communication%Professionnelle%' LIMIT 1;
  IF v IS NOT NULL THEN
    UPDATE reviews SET rating = 4,
      comment = 'Très bon module sur la communication écrite et la prise de parole. Aurait pu inclure des exercices pratiques enregistrés.',
      updated_at = now()
    WHERE user_id = 'a1000001-0000-0000-0000-000000000012' AND course_id = v;
  END IF;

  -- ENTREPRENEURIAT → cible 4.6 (déjà bien)
  -- Aucun changement nécessaire

  -- EXCEL → forcer 4.8 en gardant que des 5★ et 4★ (déjà bon)
  -- COMPTABILITÉ → garder autour de 4.5 (déjà bon avec 5+4+5=4.67, on ajuste 1 avis)
  SELECT id INTO v FROM courses WHERE title ILIKE '%Comptabilit%OHADA%' LIMIT 1;
  IF v IS NOT NULL THEN
    UPDATE reviews SET rating = 4,
      comment = 'Bonne formation sur le SYSCOHADA. Le module sur la liasse fiscale est particulièrement utile.',
      updated_at = now()
    WHERE user_id = 'a1000001-0000-0000-0000-000000000001' AND course_id = v;
    -- Maintenant (4★ + 4★ + 5★) / 3 = 4.33
  END IF;

END $$;


-- ============================================================
-- 2. THUMBNAILS : Images thématiques cohérentes sans ambiguité
--    On évite les photos avec personnes non identifiables
--    On choisit des visuels clairs, professionnels, thématiques
-- ============================================================

UPDATE courses SET thumbnail_url = CASE

  -- EXCEL : écran d'ordinateur avec graphiques/données (clair et net)
  WHEN title ILIKE '%Excel%Google Sheets%'
    THEN 'https://images.unsplash.com/photo-1543286386-713bdd548da4?w=800&h=450&fit=crop&q=80'

  -- IA : circuit imprimé / intelligence artificielle (bleu tech)
  WHEN title ILIKE '%Intelligence Artificielle%'
    THEN 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&h=450&fit=crop&q=80'

  -- MARKETING DIGITAL : téléphone avec réseaux sociaux / icônes digitales
  WHEN slug = 'marketing-digital-pme-africaines'
    THEN 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800&h=450&fit=crop&q=80'

  -- FINANCE : billets, pièces, graphique de croissance
  WHEN slug = 'finance-personnelle-investissement-afrique'
    THEN 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&h=450&fit=crop&q=80'

  -- COMPTABILITÉ : bureau avec calculatrice, stylo, documents
  WHEN title ILIKE '%Comptabilit%OHADA%'
    THEN 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&h=450&fit=crop&q=80'

  -- MANAGEMENT : personnes autour d'une table de réunion (groupe mixte, vue aérienne)
  WHEN title ILIKE '%Management%Leadership%'
    THEN 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=450&fit=crop&q=80'

  -- RH : deux personnes en entretien / poignée de main professionnelle
  WHEN title ILIKE '%Ressources Humaines%'
    THEN 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&h=450&fit=crop&q=80'

  -- E-COMMERCE : boîtes de livraison / logistique / achats en ligne
  WHEN slug = 'ecommerce-vente-en-ligne-afrique'
    THEN 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&h=450&fit=crop&q=80'

  -- COMMUNICATION : micro / scène de conférence / prise de parole
  WHEN title ILIKE '%Communication%Professionnelle%'
    THEN 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&h=450&fit=crop&q=80'

  -- ENTREPRENEURIAT : tableau blanc / post-its / brainstorming équipe
  WHEN title ILIKE '%Entrepren%'
    THEN 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&h=450&fit=crop&q=80'

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
