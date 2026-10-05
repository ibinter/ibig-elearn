
-- ============================================================
-- FORMATION 5 : Comptabilité OHADA pour PME
-- ============================================================
DO $$ DECLARE
  v_course_id uuid;
  v_instructor uuid;
  v_mod1 uuid; v_mod2 uuid; v_mod3 uuid; v_mod4 uuid;
BEGIN
  v_instructor := 'f51aedf1-d9dc-4864-b74f-d5802bed8f47'::uuid;

  INSERT INTO courses (
    title, slug, description, short_description,
    instructor_id, price_xof, price_eur, price_usd,
    level, duration_hours, language, is_published, is_featured,
    enrollment_count, rating_average, rating_count,
    tags, objectives, requirements
  ) VALUES (
    'Comptabilité OHADA pour PME — Sans Être Comptable',
    'comptabilite-ohada-pme-sans-etre-comptable',
    'Comprenez les états financiers de votre entreprise, maîtrisez le plan comptable OHADA, lisez un bilan et un compte de résultat, et pilotez votre trésorerie. Une formation accessible aux non-comptables dirigeants de PME en Afrique.',
    'Lisez vos chiffres et pilotez votre PME avec le référentiel OHADA.',
    v_instructor,
    35000, 53, 58,
    'intermediaire', 18, 'fr', true, true,
    1342, 4.6, 189,
    ARRAY['comptabilité', 'OHADA', 'PME', 'bilan', 'trésorerie', 'finance'],
    ARRAY['Comprendre le plan comptable OHADA', 'Lire et interpréter un bilan et un compte de résultat', 'Gérer la trésorerie de sa PME', 'Communiquer efficacement avec son comptable', 'Éviter les erreurs fiscales courantes'],
    ARRAY['Diriger ou gérer une PME', 'Aucune connaissance préalable en comptabilité requise']
  ) RETURNING id INTO v_course_id;

  INSERT INTO modules (course_id, title, position) VALUES
    (v_course_id, 'Introduction à la comptabilité OHADA', 1),
    (v_course_id, 'Lire et comprendre le bilan', 2),
    (v_course_id, 'Le compte de résultat et la rentabilité', 3),
    (v_course_id, 'Gérer sa trésorerie et éviter les crises', 4);

  SELECT id INTO v_mod1 FROM modules WHERE course_id = v_course_id ORDER BY position OFFSET 0 LIMIT 1;
  SELECT id INTO v_mod2 FROM modules WHERE course_id = v_course_id ORDER BY position OFFSET 1 LIMIT 1;
  SELECT id INTO v_mod3 FROM modules WHERE course_id = v_course_id ORDER BY position OFFSET 2 LIMIT 1;
  SELECT id INTO v_mod4 FROM modules WHERE course_id = v_course_id ORDER BY position OFFSET 3 LIMIT 1;

  INSERT INTO lessons (module_id, course_id, title, type, position, is_free_preview, content) VALUES
  (v_mod1, v_course_id, 'Le système OHADA : pourquoi c''est important pour votre PME', 'document', 1, true,
   
   E'# Le Système OHADA\n\n## Qu''est-ce que l''OHADA ?\nL''Organisation pour l''Harmonisation en Afrique du Droit des Affaires (OHADA) regroupe 17 pays africains et harmonise leur droit des affaires.\n\nPays membres : Bénin, Burkina Faso, Cameroun, Centrafrique, Comores, Congo, Côte d''Ivoire, Gabon, Guinée, Guinée-Bissau, Guinée équatoriale, Mali, Niger, RDC, Sénégal, Tchad, Togo.\n\n## Le Système Comptable OHADA (SYSCOHADA)\nLe SYSCOHADA est le référentiel comptable obligatoire pour toutes les entreprises des pays membres.\n\n### Les 3 systèmes selon la taille de l''entreprise\n\n**Système minimal de trésorerie**\n- Pour : microentreprises, chiffre d''affaires < 30 millions XOF\n- Principe : enregistrement des encaissements et décaissements uniquement\n\n**Système allégé**\n- Pour : petites entreprises, CA entre 30M et 150M XOF\n- Principe : comptabilité simplifiée avec bilan et compte de résultat\n\n**Système normal**\n- Pour : entreprises moyennes et grandes, CA > 150M XOF\n- Principe : comptabilité complète avec toutes les annexes\n\n## Le plan comptable OHADA : les grandes classes\n\n| Classe | Description |\n|--------|-------------|\n| 1 | Capitaux et emprunts |\n| 2 | Immobilisations |\n| 3 | Stocks |\n| 4 | Tiers (clients, fournisseurs) |\n| 5 | Trésorerie |\n| 6 | Charges |\n| 7 | Produits |\n\n## Pourquoi un dirigeant doit comprendre la comptabilité\nVous ne deviendrez pas comptable. Mais vous devez pouvoir :\n- Poser les bonnes questions à votre comptable\n- Détecter les anomalies dans vos états financiers\n- Prendre des décisions basées sur des chiffres réels'),

  (v_mod2, v_course_id, 'Lire un bilan OHADA en 15 minutes', 'document', 1, false,
   
   E'# Lire un Bilan OHADA en 15 Minutes\n\n## Le bilan : la photo de votre entreprise\nLe bilan vous dit ce que votre entreprise POSSÈDE (actif) et d''où vient l''argent pour le financer (passif).\n\n**Règle d''or : Actif = Passif (toujours)**\n\n## La structure du bilan OHADA\n\n### ACTIF (ce que possède l''entreprise)\n\n**Actif immobilisé (long terme)**\n- Terrains et bâtiments\n- Matériels et équipements\n- Véhicules\n- Immobilisations incorporelles (logiciels, brevets)\n\n**Actif circulant (court terme)**\n- Stocks de marchandises\n- Créances clients (argent qu''on vous doit)\n- Disponibilités (trésorerie)\n\n### PASSIF (d''où vient l''argent)\n\n**Capitaux propres (financement par les actionnaires)**\n- Capital social\n- Réserves\n- Résultat de l''exercice\n\n**Dettes (financement externe)**\n- Emprunts bancaires long terme\n- Fournisseurs (dettes courtes)\n- Impôts à payer\n\n## Les ratios à calculer immédiatement\n\n### Fonds de roulement (FR)\nFR = Capitaux permanents - Actif immobilisé\nSi FR > 0 : l''entreprise a des ressources longues pour financer ses actifs courts. Bonne santé.\n\n### Ratio d''endettement\nEndettement = Dettes totales / Capitaux propres\nSi > 2 : l''entreprise est trop endettée\n\n### Liquidité générale\nLiquidité = Actif circulant / Dettes court terme\nSi > 1 : l''entreprise peut faire face à ses obligations court terme'),

  (v_mod3, v_course_id, 'Le compte de résultat : mesurer la rentabilité', 'document', 1, false,
   
   E'# Le Compte de Résultat OHADA\n\n## Qu''est-ce que le compte de résultat ?\nLe compte de résultat vous dit si votre entreprise a GAGNÉ ou PERDU de l''argent sur une période.\n\nContrairement au bilan (photo à un instant T), le compte de résultat est un FILM sur 12 mois.\n\n## Structure du compte de résultat OHADA\n\n### Produits d''exploitation\n- Chiffre d''affaires (ventes de biens et services)\n- Autres produits\n\n### Charges d''exploitation\n- Achats de marchandises\n- Charges de personnel (salaires + cotisations)\n- Loyers et charges locatives\n- Amortissements\n- Autres charges\n\n### Calcul du résultat\n\nRésultat d''exploitation = Produits d''exploitation - Charges d''exploitation\n\nRésultat financier = Produits financiers - Charges financières\n\nRésultat avant impôt = Résultat d''exploitation + Résultat financier\n\nRésultat net = Résultat avant impôt - Impôt sur les bénéfices\n\n## Les marges à surveiller\n\n**Taux de marge brute**\n= (CA - Coût des marchandises vendues) / CA x 100\nObjectif : > 30% pour une activité commerciale\n\n**Taux de résultat net**\n= Résultat net / CA x 100\nObjectif : > 5% minimum pour être viable\n\n## Exemple concret\n\nCA : 50 000 000 XOF\nCharges totales : 44 000 000 XOF\nRésultat net : 6 000 000 XOF\nTaux de résultat net : 6 000 000 / 50 000 000 = 12%\n\nC''est une rentabilité correcte pour une PME africaine.'),

  (v_mod4, v_course_id, 'Gérer sa trésorerie et éviter les crises de liquidités', 'document', 1, false,
   E'# Gérer sa Trésorerie et Éviter les Crises\n\n## La vérité sur les PME africaines qui ferment\n80% des PME africaines qui ferment ne ferment pas parce qu''elles sont non rentables.\nElles ferment parce qu''elles manquent de TRÉSORERIE au mauvais moment.\n\nUne entreprise peut être rentable et mourrir faute de cash.\n\n## Le plan de trésorerie mensuel\n\nCréez un tableau avec 12 colonnes (12 mois) et les lignes suivantes :\n\n**ENCAISSEMENTS PRÉVUS**\n- Ventes comptant\n- Encaissements sur créances\n- Apports des associés\n- Emprunts reçus\n\n**DÉCAISSEMENTS PRÉVUS**\n- Achats fournisseurs\n- Salaires et charges\n- Loyers\n- Remboursements d''emprunts\n- Impôts et taxes\n\n**SOLDE MENSUEL = Encaissements - Décaissements**\n\n**SOLDE CUMULÉ = Solde du mois précédent + Solde mensuel**\n\nSi le solde cumulé devient négatif sur un mois, vous avez un problème de trésorerie à anticiper MAINTENANT.\n\n## Les 5 règles d''or de la trésorerie\n\n1. Facturez immédiatement (ne laissez pas les factures dans un tiroir)\n2. Relancez systématiquement les impayés à J+7, J+30, J+60\n3. Négociez des délais fournisseurs plus longs que vos délais clients\n4. Constituez une réserve de trésorerie = 3 mois de charges fixes\n5. Ne confondez JAMAIS trésorerie personnelle et trésorerie de l''entreprise\n\n## Outils simples de suivi\n- Livre de caisse quotidien (cahier ou Excel)\n- Relevé bancaire vérifié chaque semaine\n- Rapprochement bancaire mensuel');

END $$;

-- ============================================================
-- FORMATION 6 : Communication Professionnelle et Prise de Parole
-- ============================================================
DO $$ DECLARE
  v_course_id uuid;
  v_instructor uuid;
  v_mod1 uuid; v_mod2 uuid; v_mod3 uuid; v_mod4 uuid;
BEGIN
  v_instructor := 'f51aedf1-d9dc-4864-b74f-d5802bed8f47'::uuid;

  INSERT INTO courses (
    title, slug, description, short_description,
    instructor_id, price_xof, price_eur, price_usd,
    level, duration_hours, language, is_published, is_featured,
    enrollment_count, rating_average, rating_count,
    tags, objectives, requirements
  ) VALUES (
    'Communication Professionnelle et Prise de Parole en Public',
    'communication-professionnelle-prise-de-parole',
    'Développez votre impact à l''oral et à l''écrit : prise de parole en réunion, présentation en public, rédaction professionnelle, communication interculturelle africaine et assertivité. Une formation transformatrice pour les professionnels ambitieux.',
    'Captivez votre audience, convainquez vos interlocuteurs, développez votre leadership.',
    v_instructor,
    28000, 43, 47,
    'intermediaire', 16, 'fr', true, false,
    2105, 4.7, 298,
    ARRAY['communication', 'prise de parole', 'présentation', 'assertivité', 'leadership'],
    ARRAY['Prendre la parole en public avec assurance et impact', 'Structurer et présenter des idées de manière convaincante', 'Rédiger des emails et rapports professionnels percutants', 'Développer son assertivité en contexte africain', 'Gérer le stress de la prise de parole'],
    ARRAY['Aucun prérequis', 'Être dans un contexte professionnel']
  ) RETURNING id INTO v_course_id;

  INSERT INTO modules (course_id, title, position) VALUES
    (v_course_id, 'Les fondamentaux de la communication impactante', 1),
    (v_course_id, 'Prise de parole en public et présentation', 2),
    (v_course_id, 'Communication écrite professionnelle', 3),
    (v_course_id, 'Assertivité et communication interculturelle', 4);

  SELECT id INTO v_mod1 FROM modules WHERE course_id = v_course_id ORDER BY position OFFSET 0 LIMIT 1;
  SELECT id INTO v_mod2 FROM modules WHERE course_id = v_course_id ORDER BY position OFFSET 1 LIMIT 1;
  SELECT id INTO v_mod3 FROM modules WHERE course_id = v_course_id ORDER BY position OFFSET 2 LIMIT 1;
  SELECT id INTO v_mod4 FROM modules WHERE course_id = v_course_id ORDER BY position OFFSET 3 LIMIT 1;

  INSERT INTO lessons (module_id, course_id, title, type, position, is_free_preview, content) VALUES
  (v_mod1, v_course_id, 'Le modèle de communication de Mehrabian : les 3 canaux', 'document', 1, true,
   E'# Les 3 Canaux de Communication\n\n## Le modèle de Mehrabian\nSelon les recherches d''Albert Mehrabian sur la communication émotionnelle :\n\n- 7% du message passe par les MOTS\n- 38% passe par le TON (voix, débit, intonation)\n- 55% passe par le NON-VERBAL (posture, gestes, regard)\n\n## Ce que cela signifie pour vous\nVous pouvez dire les mots parfaits et tout gâcher avec une voix hésitante et les bras croisés.\nInversement, vous pouvez capter l''attention avec une présence physique forte même avec un discours simple.\n\n## Maîtriser votre voix\n\n### Le débit\n- Trop rapide = nervosité, incompréhension\n- Trop lent = ennui\n- Idéal : 130-150 mots/minute, avec des pauses\n\n### Les pauses\nLa pause est une arme de communication redoutable. 3 secondes de silence avant une idée importante la rendent 10 fois plus mémorable.\n\n### Le volume\nVariez le volume. Parler plus doucement pour une information clé force l''audience à se concentrer.\n\n### L''intonation\nTerminez vos affirmations avec une voix descendante. Une voix montante sur une affirmation sonne comme une question (doute).\n\n## Maîtriser votre non-verbal\n\n### La posture\n- Dos droit, épaules relâchées\n- Poids équilibré sur les deux pieds\n- Mains visibles (pas dans les poches)\n\n### Le regard\nEn Afrique, le contact visuel direct peut être perçu différemment selon les cultures. En contexte professionnel, un regard direct et bienveillant = confiance et respect.\n\n### Les gestes\nGestes ouverts = invitation, accueil. Gestes fermés (bras croisés, poings serrés) = défense, désaccord.'),

  (v_mod2, v_course_id, 'Structurer une présentation en public avec la méthode SPRI', 'document', 1, false,
   E'# Structurer une Présentation avec SPRI\n\n## La méthode SPRI\nSPRI est une structure narrative puissante pour tout discours ou présentation :\n\n**S - Situation**\nDécrivez le contexte actuel, ce que tout le monde sait déjà.\n"Nous sommes en fin d''exercice, notre chiffre d''affaires est en baisse de 12%."\n\n**P - Problème**\nIdentifiez la tension, le problème ou l''enjeu.\n"Si nous n''agissons pas maintenant, nous ne pourrons pas honorer nos engagements en janvier."\n\n**R - Résolution**\nProposez votre solution, votre recommandation.\n"Je vous propose de lancer une campagne commerciale ciblée sur nos 50 clients premium."\n\n**I - Information**\nDétaillez le plan d''action avec les chiffres, étapes et responsabilités.\n"Voici les 3 actions concrètes à engager dès demain matin..."\n\n## Pourquoi SPRI fonctionne\nNotre cerveau est câblé pour les histoires. La structure Situation-Problème crée naturellement une tension que la Résolution vient soulager. L''audience est accrochée.\n\n## L''ouverture percutante\nVous avez 30 secondes pour capter l''attention. 5 techniques :\n1. La question rhétorique : "Combien d''entre vous ont déjà perdu un client à cause d''un email mal rédigé ?"\n2. La statistique choc : "En Afrique de l''Ouest, 67% des PME ferment dans les 5 ans."\n3. L''histoire personnelle brève : "Il y a 3 ans, j''ai failli perdre mon entreprise à cause de..."\n4. La citation d''autorité\n5. Le silence + regard panoramique de 5 secondes\n\n## La conclusion mémorable\nTerminez toujours avec un appel à l''action clair : "Ce que je vous demande, c''est de faire X avant vendredi."'),

  (v_mod3, v_course_id, 'Rédiger des emails professionnels qui obtiennent des réponses', 'document', 1, false,
   
   E'# Emails Professionnels qui Obtiennent des Réponses\n\n## Pourquoi vos emails sont ignorés\n1. Objet flou ou absent\n2. Trop long (> 150 mots)\n3. Aucun appel à l''action clair\n4. Style formel inadapté au contexte\n5. Envoyé au mauvais moment\n\n## La structure d''un email efficace\n\n### L''objet (le plus important)\nFormule : [Action] + [Contexte] + [Date si applicable]\n\nExemples :\n- "Validation demandée : budget Q4 — avant vendredi 18h"\n- "Compte-rendu réunion équipe commerciale 15 octobre"\n- "Question rapide : disponibilité pour mardi matin ?"\n\n### Le corps de l''email\n\n**Ligne 1 :** Contexte en 1 phrase (Pourquoi j''écris)\n**Lignes 2-4 :** Information principale (Quoi)\n**Dernière ligne :** Appel à l''action clair (Ce que j''attends de vous)\n\n### La signature professionnelle\nNom complet | Poste | Entreprise | Téléphone WhatsApp | Email\n\n## Les erreurs à ne jamais commettre\n\n- "En espérant une suite favorable à..." → vague et faible\n- "Veuillez trouver ci-joint..." → archaïque\n- "Je me permets de..." → vous sous-estime\n- Répondre à tous par accident → catastrophe professionnelle\n- Email en colère envoyé immédiatement → toujours attendre 24h\n\n## Rédiger un rapport professionnel\n\n### Structure type\n1. Résumé exécutif (1 page max) — lit-on seulement si pressé\n2. Contexte et objectifs\n3. Méthodologie (ce qu''on a fait)\n4. Résultats et analyses\n5. Conclusions et recommandations\n6. Annexes\n\nRègle : le résumé exécutif doit permettre à votre directeur de prendre une décision SANS lire le reste.'),

  (v_mod4, v_course_id, 'Développer son assertivité en contexte africain', 'document', 1, false,
   E'# Développer son Assertivité en Contexte Africain\n\n## Qu''est-ce que l''assertivité ?\nL''assertivité est la capacité à exprimer ses opinions, besoins et sentiments de manière directe et respectueuse, sans agressivité ni soumission.\n\n## Les 4 styles de communication\n\n### Style passif\nN''exprime pas ses besoins, subit, dit oui par peur du conflit.\nConséquence : frustration accumulée, perte de respect.\n\n### Style agressif\nImpose ses idées, coupe la parole, manque de respect.\nConséquence : conflits, isolement, turnover dans les équipes.\n\n### Style manipulateur\nManipule indirectement, culpabilise, utilise l''ironie.\nConséquence : perte de confiance, relations toxiques.\n\n### Style assertif (l''objectif)\nExprime clairement, écoute l''autre, cherche un compromis respectueux.\nConséquence : respect mutuel, relations saines, performance collective.\n\n## L''assertivité en Afrique : adapter sans trahir\n\nEn contexte africain, l''assertivité directe peut être perçue comme du manque de respect, surtout face à un supérieur ou un ancien.\n\n### Technique du sandwich\nPositif + Message difficile + Positif\n"J''apprécie votre engagement. Cependant, ce délai ne peut pas être respecté car... Je suis convaincu que nous pouvons trouver une solution."\n\n### Dire non avec respect\n"Je comprends l''importance de votre demande. Ma contrainte actuelle est... Puis-je vous proposer une alternative ?"\n\n### Exprimer un désaccord avec un supérieur\n"Je partage votre objectif. Permettez-moi de vous soumettre une réserve que j''ai identifiée, afin que nous puissions l''adresser ensemble."');

END $$;

-- ============================================================
-- FORMATION 7 : Ressources Humaines : Recruter, Former, Fidéliser
-- ============================================================
DO $$ DECLARE
  v_course_id uuid;
  v_instructor uuid;
  v_mod1 uuid; v_mod2 uuid; v_mod3 uuid; v_mod4 uuid;
BEGIN
  v_instructor := 'f51aedf1-d9dc-4864-b74f-d5802bed8f47'::uuid;

  INSERT INTO courses (
    title, slug, description, short_description,
    instructor_id, price_xof, price_eur, price_usd,
    level, duration_hours, language, is_published, is_featured,
    enrollment_count, rating_average, rating_count,
    tags, objectives, requirements
  ) VALUES (
    'Ressources Humaines : Recruter, Former, Fidéliser',
    'ressources-humaines-recruter-former-fideliser',
    'Maîtrisez les pratiques RH adaptées aux entreprises africaines : recrutement efficace, intégration, formation, évaluation des performances, gestion du droit du travail OHADA et fidélisation des talents dans un marché compétitif.',
    'Attirez, développez et retenez les meilleurs talents pour votre organisation.',
    v_instructor,
    38000, 58, 63,
    'intermediaire', 20, 'fr', true, false,
    987, 4.4, 134,
    ARRAY['RH', 'recrutement', 'formation', 'fidélisation', 'droit du travail', 'OHADA'],
    ARRAY['Concevoir un processus de recrutement efficace', 'Intégrer et former les nouveaux collaborateurs', 'Évaluer les performances avec équité', 'Connaître le droit du travail OHADA essentiel', 'Fidéliser les talents dans un marché compétitif'],
    ARRAY['Occuper ou aspirer à un poste RH ou de direction', 'Gérer ou superviser des collaborateurs']
  ) RETURNING id INTO v_course_id;

  INSERT INTO modules (course_id, title, position) VALUES
    (v_course_id, 'Recruter les bons profils efficacement', 1),
    (v_course_id, 'Intégration et formation des collaborateurs', 2),
    (v_course_id, 'Évaluation des performances', 3),
    (v_course_id, 'Droit du travail OHADA et fidélisation', 4);

  SELECT id INTO v_mod1 FROM modules WHERE course_id = v_course_id ORDER BY position OFFSET 0 LIMIT 1;
  SELECT id INTO v_mod2 FROM modules WHERE course_id = v_course_id ORDER BY position OFFSET 1 LIMIT 1;
  SELECT id INTO v_mod3 FROM modules WHERE course_id = v_course_id ORDER BY position OFFSET 2 LIMIT 1;
  SELECT id INTO v_mod4 FROM modules WHERE course_id = v_course_id ORDER BY position OFFSET 3 LIMIT 1;

  INSERT INTO lessons (module_id, course_id, title, type, position, is_free_preview, content) VALUES
  (v_mod1, v_course_id, 'Construire un processus de recrutement efficace', 'document', 1, true,
   E'# Construire un Processus de Recrutement Efficace\n\n## Le coût réel d''un mauvais recrutement\nUn mauvais recrutement coûte en moyenne 2 à 3 fois le salaire annuel du poste :\n- Temps de formation perdu\n- Erreurs et improductivité\n- Démotivation de l''équipe\n- Nouveau recrutement à lancer\n\n## Les 5 étapes d''un recrutement réussi\n\n### Étape 1 : Définir le profil avec précision\n\nLe profil de poste comporte :\n- Titre et positionnement dans l''organigramme\n- Missions principales (5-7 maximum)\n- Compétences techniques requises (savoir-faire)\n- Compétences comportementales (savoir-être)\n- Expérience minimale requise\n- Formation requise ou équivalence acceptée\n- Conditions : salaire, avantages, lieu\n\n### Étape 2 : Sourcer les candidats\n\nCanaux efficaces en Afrique :\n- LinkedIn (cadres et profils qualifiés)\n- Cooptation (recommandation en interne) — meilleur ROI\n- Universités et grandes écoles pour les juniors\n- Facebook (postes terrain et commerciaux)\n- Jobnet, Afriwork, MyJobMag\n- Candidatures spontanées en file d''attente\n\n### Étape 3 : Présélectionner les CV\nCritères de présélection rapide (< 30 secondes par CV) :\n1. Compétence technique clé présente ?\n2. Expérience dans le secteur ?\n3. Stabilité professionnelle (pas de changement tous les 6 mois) ?\n4. Cohérence du parcours ?\n\n### Étape 4 : L''entretien de recrutement\nStructure recommandée :\n- 5 min : accueil et présentation\n- 10 min : parcours du candidat\n- 20 min : questions comportementales (méthode STAR)\n- 10 min : mise en situation pratique\n- 5 min : questions du candidat et étapes suivantes\n\n### La méthode STAR pour les questions comportementales\n"Décrivez une situation où vous avez dû gérer un client mécontent."\n- Situation : contexte\n- Tâche : rôle du candidat\n- Action : ce qu''il a fait concrètement\n- Résultat : résultat obtenu avec chiffres si possible\n\n### Étape 5 : La vérification des références\nContactez 2 anciens managers directement. Questions clés :\n- "Quelle était sa principale force ?"\n- "Quel était son principal axe de développement ?"\n- "Le recruteriez-vous à nouveau ?"'),

  (v_mod2, v_course_id, 'Intégrer et former efficacement les nouveaux collaborateurs', 'document', 1, false,
   
   E'# Intégrer et Former les Nouveaux Collaborateurs\n\n## Pourquoi l''intégration est critique\n22% des nouvelles recrues quittent leur emploi dans les 45 premiers jours.\nLa principale raison : une mauvaise intégration.\n\n## Le plan d''intégration (onboarding) sur 90 jours\n\n### Semaine 1 : L''accueil\n- Bureau, équipements, accès informatiques prêts J-1\n- Tour de l''entreprise et présentation de l''équipe\n- Remise du livret d''accueil (organisation, règles internes, contacts clés)\n- Déjeuner avec le manager direct\n- Objectifs des 30 premiers jours clairement définis\n\n### Mois 1 : La découverte\n- Formation sur les produits et services\n- Observation des collègues expérimentés\n- Premiers dossiers simples en binôme\n- Point hebdomadaire avec le manager\n\n### Mois 2-3 : La montée en compétence\n- Missions progressivement autonomes\n- Bilan à 60 jours : forces et axes d''amélioration\n- Accès à la formation continue\n- Bilan final à 90 jours avec décision de confirmation\n\n## Construire un plan de formation\n\n### Identifier les besoins\n- Entretiens avec les managers\n- Analyse des performances et erreurs récurrentes\n- Évolution des métiers et nouvelles compétences requises\n\n### Formats de formation adaptés aux PME africaines\n\n| Format | Coût | Efficacité | Idéal pour |\n|--------|------|------------|------------|\n| Formation interne par pairs | Très faible | Élevée | Compétences techniques |\n| Formation externe (IBIG, etc.) | Moyen | Élevée | Compétences transversales |\n| E-learning | Faible | Moyenne | Connaissances théoriques |\n| Coaching par le manager | Nul | Très élevée | Développement comportemental |'),

  (v_mod3, v_course_id, 'Évaluer les performances avec équité', 'document', 1, false,
   
   E'# Évaluer les Performances avec Équité\n\n## Les erreurs classiques des évaluations en Afrique\n\n1. L''évaluation est un événement annuel, pas un processus continu\n2. Les critères sont flous et subjectifs\n3. Le manager évalue l''attitude, pas les résultats\n4. L''évaluation est uniquement descendante\n5. Les évaluations favorables ne sont jamais suivies d''augmentations\n\n## La méthode SMART pour définir les objectifs\n\nChaque objectif doit être :\n- Spécifique : pas "améliorer les ventes" mais "atteindre 15M XOF de CA au T3"\n- Mesurable : avec un indicateur quantifiable\n- Atteignable : ambitieux mais réaliste\n- Relevant : lié aux priorités de l''entreprise\n- Temporel : avec une date précise\n\n## Le calendrier d''évaluation recommandé\n\n| Moment | Type | Durée | Objectif |\n|--------|------|-------|----------|\n| Mensuel | Suivi informel | 15 min | Ajuster en cours de route |\n| Trimestriel | Bilan intermédiaire | 1h | Mesurer l''avancement |\n| Annuel | Évaluation formelle | 2h | Bilan complet + objectifs N+1 |\n\n## La grille d''évaluation équilibrée\n\n**50% : Résultats quantitatifs**\n- Objectifs atteints (oui/non/partiel)\n- Niveau d''atteinte en %\n\n**30% : Compétences techniques**\n- Maîtrise des outils et méthodes\n- Qualité du travail produit\n\n**20% : Compétences comportementales**\n- Travail en équipe\n- Communication\n- Initiatives\n\n## L''entretien d''évaluation : déroulement\n1. Auto-évaluation préalable envoyée par le collaborateur\n2. Bilan des objectifs atteints (faits et chiffres)\n3. Points forts de l''année\n4. Axes de développement\n5. Objectifs de l''année suivante\n6. Formation souhaitée\n7. Projet professionnel à moyen terme'),

  (v_mod4, v_course_id, 'Droit du travail OHADA et fidélisation des talents', 'document', 1, false,
   E'# Droit du Travail et Fidélisation des Talents\n\n## Les bases du droit du travail en Côte d''Ivoire (Code du Travail 2015)\n\n### Le contrat de travail\n- CDD (Contrat à Durée Déterminée) : maximum 2 ans, renouvelable 1 fois\n- CDI (Contrat à Durée Indéterminée) : recommandé après la période d''essai\n- Contrat d''apprentissage : pour les jeunes de 15 à 25 ans\n\n### La période d''essai\n- Ouvriers et employés : 1 mois\n- Agents de maîtrise : 3 mois\n- Cadres : 6 mois\n\n### Le salaire minimum (SMIG)\nEn Côte d''Ivoire : 75 000 XOF brut mensuel (vérifiez la valeur en vigueur)\n\n### Le préavis de licenciement\n- < 2 ans d''ancienneté : 1 mois\n- 2-5 ans : 2 mois\n- > 5 ans : 3 mois\n\n### Les obligations de l''employeur\n- Contrat de travail signé\n- Bulletin de paie mensuel\n- Affiliation à la CNPS (Caisse Nationale de Prévoyance Sociale)\n- Visite médicale d''embauche\n\n## Stratégies de fidélisation des talents\n\n### Le package global de rémunération\nAu-delà du salaire, pensez :\n- Assurance maladie (couverture famille)\n- Transport ou indemnité transport\n- Prime de résultats\n- Téléphone professionnel\n- Formation financée\n\n### La gestion des carrières\n- Entretien annuel de développement professionnel\n- Plan de succession identifié pour les postes clés\n- Politique de promotion interne prioritaire\n\n### La culture d''entreprise\nLes talents africains partent d''un mauvais manager, pas d''une mauvaise entreprise.\nInvestissez dans la formation de vos managers : c''est votre meilleur investissement de fidélisation.');

END $$;
