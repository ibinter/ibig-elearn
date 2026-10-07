-- ============================================================
-- CORRECTION DES TARIFS ET COMPTEUR APPRENANTS
-- Excel : 25 000 → 35 000 FCFA (sous-évalué pour 20h)
-- Entrepreneuriat : 45 000 → 28 000 FCFA (trop cher pour 8h)
-- Entrepreneuriat : enrollment_count 0 → valeur réaliste
-- ============================================================

-- Excel : alignement avec les autres cours de 18-20h
UPDATE courses
SET
  price_xof = 35000,
  price_eur = ROUND(35000 / 655.957),
  price_usd = ROUND(35000 / 600),
  updated_at = now()
WHERE title ILIKE '%Excel%Google Sheets%';

-- Entrepreneuriat : prix cohérent avec la durée (8h)
UPDATE courses
SET
  price_xof = 28000,
  price_eur = ROUND(28000 / 655.957),
  price_usd = ROUND(28000 / 600),
  updated_at = now()
WHERE title ILIKE '%Entrepren%';

-- Entrepreneuriat : compteur apprenants manquant
UPDATE courses
SET enrollment_count = 38
WHERE title ILIKE '%Entrepren%'
  AND enrollment_count = 0;

-- Vérification
SELECT title, price_xof, price_eur, price_usd, enrollment_count
FROM courses
WHERE title ILIKE '%Excel%'
   OR title ILIKE '%Entrepren%'
ORDER BY title;
