-- ============================================================
-- Thumbnails pour les cartes formations
-- Images Unsplash gratuites, thématiques, format paysage 800x450
-- ============================================================

UPDATE courses SET thumbnail_url = CASE
  -- Excel & Google Sheets → bureau, tableur, données
  WHEN title ILIKE '%Excel%Google Sheets%'
    THEN 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&h=450&fit=crop&q=80'

  -- Intelligence Artificielle → tech, IA, futuriste
  WHEN title ILIKE '%Intelligence Artificielle%'
    THEN 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&h=450&fit=crop&q=80'

  -- Marketing Digital → réseaux sociaux, digital
  WHEN slug = 'marketing-digital-pme-africaines'
    THEN 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=450&fit=crop&q=80'

  -- Finance Personnelle → argent, investissement
  WHEN slug = 'finance-personnelle-investissement-afrique'
    THEN 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&h=450&fit=crop&q=80'

  -- Comptabilité OHADA → comptabilité, livres, chiffres
  WHEN title ILIKE '%Comptabilit%OHADA%'
    THEN 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=450&fit=crop&q=80'

  -- Management & Leadership → équipe, réunion, leadership
  WHEN title ILIKE '%Management%Leadership%'
    THEN 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=450&fit=crop&q=80'

  -- Ressources Humaines → personnes, recrutement
  WHEN title ILIKE '%Ressources Humaines%'
    THEN 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&h=450&fit=crop&q=80'

  -- E-commerce → boutique en ligne, achats
  WHEN slug = 'ecommerce-vente-en-ligne-afrique'
    THEN 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=450&fit=crop&q=80'

  -- Communication Professionnelle → présentation, prise de parole
  WHEN title ILIKE '%Communication%Professionnelle%'
    THEN 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=450&fit=crop&q=80'

  -- Entrepreneuriat → startup, entrepreneur, succès
  WHEN title ILIKE '%Entrepren%'
    THEN 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&h=450&fit=crop&q=80'

  ELSE thumbnail_url
END
WHERE thumbnail_url IS NULL
   OR thumbnail_url = '';
