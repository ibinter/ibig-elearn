-- ============================================================
-- Force le nom IBIG Academy sur tous les profils formateurs
-- ============================================================
UPDATE profiles
SET
  full_name = 'IBIG Academy',
  bio = 'IBIG Academy regroupe des formateurs experts en gestion, finance, marketing et digital, engagés à proposer des formations de qualité adaptées aux réalités des professionnels d''Afrique francophone.',
  updated_at = now()
WHERE id IN (
  SELECT DISTINCT instructor_id FROM courses
);

-- ============================================================
-- Thumbnails diversifiés et thématiques
-- Images Unsplash sans biais — mix de personnes et d'abstractions
-- ============================================================
UPDATE courses SET thumbnail_url = CASE

  -- Excel & Google Sheets → écran avec tableur, abstrait
  WHEN title ILIKE '%Excel%Google Sheets%'
    THEN 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=450&fit=crop&q=80'

  -- Intelligence Artificielle → réseau neuronal, tech bleu
  WHEN title ILIKE '%Intelligence Artificielle%'
    THEN 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&h=450&fit=crop&q=80'

  -- Marketing Digital → analytics, graphiques sur écran
  WHEN slug = 'marketing-digital-pme-africaines'
    THEN 'https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=800&h=450&fit=crop&q=80'

  -- Finance Personnelle → pièces, croissance, graphique
  WHEN slug = 'finance-personnelle-investissement-afrique'
    THEN 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=450&fit=crop&q=80'

  -- Comptabilité OHADA → calculatrice, documents, stylo
  WHEN title ILIKE '%Comptabilit%OHADA%'
    THEN 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&h=450&fit=crop&q=80'

  -- Management & Leadership → équipe diverse autour d'une table
  WHEN title ILIKE '%Management%Leadership%'
    THEN 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&h=450&fit=crop&q=80'

  -- RH → poignée de mains, collaboration diverse
  WHEN title ILIKE '%Ressources Humaines%'
    THEN 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&h=450&fit=crop&q=80'

  -- E-commerce → colis, livraison, boutique en ligne
  WHEN slug = 'ecommerce-vente-en-ligne-afrique'
    THEN 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=450&fit=crop&q=80'

  -- Communication Professionnelle → présentation, micro, scène
  WHEN title ILIKE '%Communication%Professionnelle%'
    THEN 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&h=450&fit=crop&q=80'

  -- Entrepreneuriat → bureau co-working diverse, startup
  WHEN title ILIKE '%Entrepren%'
    THEN 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=450&fit=crop&q=80'

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
