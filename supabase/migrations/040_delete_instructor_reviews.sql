-- ============================================================
-- SUPPRESSION DES AVIS DU FORMATEUR SUR SES PROPRES COURS
-- formateur.demo@ibiglearn.com ("Dr. Kouassi Ange-Brice")
-- apparaissait sur les 10 formations — incohérent
-- ============================================================

-- 1. Supprimer les avis du formateur (toutes variantes d'email)
DELETE FROM reviews
WHERE user_id IN (
  SELECT id FROM profiles
  WHERE email ILIKE '%formateur%'
     OR email ILIKE '%@ibiglearn.com'
     OR full_name ILIKE '%Kouassi Ange-Brice%'
     OR full_name ILIKE '%Dr.%'
);

-- 2. Sécurité : supprimer aussi via auth.users si la relation est directe
DELETE FROM reviews
WHERE user_id IN (
  SELECT id FROM auth.users
  WHERE email ILIKE '%formateur%'
     OR email ILIKE '%@ibiglearn.com'
);

-- 3. Corriger le nom du formateur → "IBIG Academy" (au cas où la migration 036 n'aurait pas tout couvert)
UPDATE profiles
SET
  full_name = 'IBIG Academy',
  updated_at = now()
WHERE email ILIKE '%formateur%'
   OR email ILIKE '%@ibiglearn.com'
   OR full_name ILIKE '%Kouassi Ange-Brice%';

-- 4. Vérification finale — doit retourner 0 lignes
SELECT COUNT(*) AS avis_restants_formateur
FROM reviews r
JOIN profiles p ON p.id = r.user_id
WHERE p.email ILIKE '%@ibiglearn.com'
   OR p.full_name ILIKE '%Dr.%';
