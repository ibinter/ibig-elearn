-- ============================================================
-- A. Mettre à jour le nom du formateur principal
-- ============================================================

UPDATE profiles
SET
  full_name = 'Patrice KOUAKOU',
  bio = 'Expert en formation professionnelle et développement des compétences en Afrique francophone. Fort d''une expérience de plus de 10 ans dans l''accompagnement des PME et des professionnels, Patrice KOUAKOU a fondé IBIG pour démocratiser l''accès à une formation de qualité adaptée au contexte africain.',
  updated_at = now()
WHERE full_name ILIKE '%Administrateur%IBIG%'
   OR email = 'patriceky@gmail.com';
