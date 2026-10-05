-- ============================================================
-- Ramener les chiffres enrollment_count et rating_count
-- à des valeurs crédibles pour une plateforme récente
-- ============================================================

UPDATE courses SET
  enrollment_count = CASE
    WHEN title ILIKE '%Excel%Google Sheets%'           THEN 127
    WHEN title ILIKE '%Intelligence Artificielle%'     THEN 89
    WHEN title ILIKE '%Marketing Digital%'             THEN 74
    WHEN title ILIKE '%Finance Personnelle%'           THEN 61
    WHEN title ILIKE '%Comptabilit%OHADA%'             THEN 108
    WHEN title ILIKE '%Management%Leadership%'         THEN 93
    WHEN title ILIKE '%Ressources Humaines%'           THEN 57
    WHEN title ILIKE '%E-commerce%'                    THEN 48
    WHEN title ILIKE '%Communication%'                 THEN 52
    WHEN title ILIKE '%Entrepreneuriat%'               THEN 63
    ELSE enrollment_count
  END,
  rating_count = CASE
    WHEN title ILIKE '%Excel%Google Sheets%'           THEN 14
    WHEN title ILIKE '%Intelligence Artificielle%'     THEN 9
    WHEN title ILIKE '%Marketing Digital%'             THEN 8
    WHEN title ILIKE '%Finance Personnelle%'           THEN 7
    WHEN title ILIKE '%Comptabilit%OHADA%'             THEN 12
    WHEN title ILIKE '%Management%Leadership%'         THEN 10
    WHEN title ILIKE '%Ressources Humaines%'           THEN 6
    WHEN title ILIKE '%E-commerce%'                    THEN 5
    WHEN title ILIKE '%Communication%'                 THEN 6
    WHEN title ILIKE '%Entrepreneuriat%'               THEN 7
    ELSE rating_count
  END,
  rating_average = CASE
    WHEN title ILIKE '%Excel%Google Sheets%'           THEN 4.8
    WHEN title ILIKE '%Intelligence Artificielle%'     THEN 4.7
    WHEN title ILIKE '%Marketing Digital%'             THEN 4.6
    WHEN title ILIKE '%Finance Personnelle%'           THEN 4.7
    WHEN title ILIKE '%Comptabilit%OHADA%'             THEN 4.5
    WHEN title ILIKE '%Management%Leadership%'         THEN 4.6
    WHEN title ILIKE '%Ressources Humaines%'           THEN 4.4
    WHEN title ILIKE '%E-commerce%'                    THEN 4.5
    WHEN title ILIKE '%Communication%'                 THEN 4.5
    WHEN title ILIKE '%Entrepreneuriat%'               THEN 4.6
    ELSE rating_average
  END;
