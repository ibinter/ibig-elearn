-- ============================================================
-- DEVOIRS PRATIQUES + EXAMENS FINAUX — Toutes formations
-- ============================================================

-- ============================================================
-- COMPTABILITÉ OHADA
-- ============================================================
DO $$ DECLARE
  v_course_id uuid; v_module_id uuid; v_lesson_id uuid;
BEGIN
  SELECT id INTO v_course_id FROM courses WHERE title ILIKE '%Comptabilit%OHADA%' LIMIT 1;
  IF v_course_id IS NULL THEN RAISE NOTICE 'Comptabilité OHADA non trouvée'; RETURN; END IF;
  SELECT id INTO v_module_id FROM modules WHERE course_id = v_course_id ORDER BY position DESC LIMIT 1;

  -- Devoir pratique
  INSERT INTO lessons (module_id, course_id, title, type, position, is_free_preview, content)
  VALUES (v_module_id, v_course_id, 'Devoir : Saisir et équilibrer un journal comptable', 'assignment', 90, false,
    E'# Devoir Pratique — Journal Comptable OHADA\n\n## Consignes\nVous êtes le comptable d''une PME ivoirienne "TECH CI SARL". Pour le mois de janvier 2024, enregistrez les opérations suivantes dans le journal comptable SYSCOHADA.\n\n## Opérations à enregistrer\n\n**01/01/2024** — Apport en capital : les associés versent 5 000 000 FCFA sur le compte bancaire de la société.\n\n**05/01/2024** — Achat de matériel informatique : 2 ordinateurs à 450 000 FCFA chacun, payés par chèque bancaire.\n\n**10/01/2024** — Achat de fournitures de bureau : 85 000 FCFA, payés en espèces.\n\n**15/01/2024** — Vente de services informatiques à un client : facture N°001 de 800 000 FCFA + TVA 18% = 944 000 FCFA. Règlement à 30 jours.\n\n**20/01/2024** — Règlement du loyer du mois : 150 000 FCFA par virement bancaire.\n\n**25/01/2024** — Paiement des salaires du mois : 600 000 FCFA brut, dont 37 800 FCFA de retenues salariales CNPS.\n\n**31/01/2024** — Encaissement de la facture N°001 : le client règle par virement.\n\n## Travail demandé\n1. Enregistrez chaque opération dans le journal en précisant : date, numéros de compte SYSCOHADA, libellé, débit, crédit\n2. Vérifiez que pour chaque écriture : Total Débit = Total Crédit\n3. Établissez la balance simplifiée (liste des comptes avec soldes débiteurs/créditeurs)\n\n## Rappel des comptes SYSCOHADA utiles\n- 101 : Capital social\n- 244 : Matériels informatiques\n- 601 : Achats de marchandises\n- 604 : Achats de fournitures\n- 411 : Clients\n- 512 : Banque\n- 571 : Caisse\n- 614 : Loyers\n- 661 : Rémunérations du personnel\n- 432 : Organismes sociaux (CNPS)\n- 445 : État — TVA\n- 704 : Ventes de services\n\n## Format de rendu\nTableau Excel ou fichier PDF. Joignez votre balance récapitulative.')
  RETURNING id INTO v_lesson_id;
  INSERT INTO assignments (lesson_id, course_id, title, instructions, submission_type, max_score, passing_score)
  VALUES (v_lesson_id, v_course_id, 'Journal comptable OHADA janvier 2024',
    'Enregistrez les 7 opérations dans le journal SYSCOHADA et établissez la balance. Fichier Excel ou PDF.',
    'file', 100, 60);

  -- Examen final
  INSERT INTO lessons (module_id, course_id, title, type, position, is_free_preview, exam_duration_minutes, exam_passing_score, exam_max_attempts)
  VALUES (v_module_id, v_course_id, 'Examen Final : Comptabilité OHADA pour PME', 'final_exam', 99, false, 45, 70, 3)
  RETURNING id INTO v_lesson_id;
  INSERT INTO quiz_questions (lesson_id, question, options, correct_option, explanation, position) VALUES
  (v_lesson_id, 'Dans le plan SYSCOHADA, dans quelle classe trouve-t-on les comptes de charges ?',
   '["Classe 1 (Comptes de capitaux)","Classe 4 (Comptes de tiers)","Classe 6 (Comptes de charges)","Classe 7 (Comptes de produits)"]', 2,
   'Classe 6 = charges (achats, salaires, loyers...). Classe 7 = produits (ventes, prestations). Classe 1 = capitaux. Classe 4 = tiers (clients, fournisseurs).', 0),
  (v_lesson_id, 'Une facture client impayée au 31/12 doit être enregistrée dans quel compte ?',
   '["512 Banque","411 Clients","701 Ventes de marchandises","401 Fournisseurs"]', 1,
   'Le compte 411 (Clients) enregistre les créances sur les clients. Quand la facture est émise : Débit 411 / Crédit 704. Quand elle est payée : Débit 512 / Crédit 411.', 1),
  (v_lesson_id, 'Comment calcule-t-on la TVA à reverser à l''État ?',
   '["TVA collectée uniquement","TVA déductible - TVA collectée","TVA collectée - TVA déductible","(TVA collectée + TVA déductible) / 2"]', 2,
   'TVA à payer = TVA collectée (sur ventes) - TVA déductible (sur achats). Si négatif = crédit de TVA remboursable.', 2),
  (v_lesson_id, 'Quel est le taux de TVA standard en Côte d''Ivoire ?',
   '["10%","15%","18%","20%"]', 2,
   'Le taux normal de TVA est de 18% en Côte d''Ivoire. Certains produits bénéficient de taux réduits (médicaments, produits alimentaires de base).', 3),
  (v_lesson_id, 'Qu''est-ce que l''amortissement d''une immobilisation ?',
   '["La revente d''un bien","La réduction progressive de la valeur d''un bien dans les comptes sur sa durée d''utilisation","Le financement d''un bien par crédit","La valeur de revente d''un bien"]', 1,
   'L''amortissement répartit le coût d''un bien sur sa durée de vie. Exemple : ordinateur acheté 500 000 FCFA, durée 5 ans → 100 000 FCFA d''amortissement/an.', 4),
  (v_lesson_id, 'Quelle est la formule du résultat net comptable ?',
   '["Actif - Passif","Produits - Charges","CA - Charges variables","Trésorerie finale - Trésorerie initiale"]', 1,
   'Résultat net = Total produits (classe 7) - Total charges (classe 6). Positif = bénéfice. Négatif = perte.', 5),
  (v_lesson_id, 'Qu''est-ce que la règle de la "partie double" en comptabilité ?',
   '["Chaque compte a deux colonnes : débit et crédit, et chaque opération touche au moins deux comptes avec total débit = total crédit","Chaque facture est enregistrée deux fois","On tient deux journaux comptables en parallèle","On fait deux bilans par an"]', 0,
   'La partie double : chaque opération génère au moins une écriture au débit ET une au crédit de montants égaux. C''est le fondement de la comptabilité en partie double.', 6),
  (v_lesson_id, 'Un bien immobilisé (véhicule) est amorti sur 5 ans. Quel est le taux d''amortissement linéaire annuel ?',
   '["5%","10%","20%","25%"]', 2,
   'Taux linéaire = 100% / durée = 100/5 = 20%/an. Un véhicule de 5 000 000 FCFA → 1 000 000 FCFA d''amortissement annuel pendant 5 ans.', 7);
END $$;


-- ============================================================
-- MANAGEMENT ET LEADERSHIP
-- ============================================================
DO $$ DECLARE
  v_course_id uuid; v_module_id uuid; v_lesson_id uuid;
BEGIN
  SELECT id INTO v_course_id FROM courses WHERE title ILIKE '%Management%Leadership%' LIMIT 1;
  IF v_course_id IS NULL THEN RAISE NOTICE 'Management non trouvé'; RETURN; END IF;
  SELECT id INTO v_module_id FROM modules WHERE course_id = v_course_id ORDER BY position DESC LIMIT 1;

  -- Devoir
  INSERT INTO lessons (module_id, course_id, title, type, position, is_free_preview, content)
  VALUES (v_module_id, v_course_id, 'Devoir : Plan de développement de votre équipe', 'assignment', 90, false,
    E'# Devoir Pratique — Plan de Développement d''Équipe\n\n## Contexte\nVous êtes responsable d''une équipe de 5 personnes dans une PME africaine. Votre mission : élaborer un plan de management pour améliorer la performance et la cohésion de votre équipe.\n\n## Travail demandé\n\n### Partie 1 : Diagnostic (30 points)\n- Décrivez votre équipe réelle ou fictive (3-5 personnes, rôles, points forts, axes d''amélioration)\n- Identifiez 3 défis principaux de management que vous rencontrez\n- Évaluez le niveau de motivation actuel (1-5) avec justification\n\n### Partie 2 : Objectifs SMART (30 points)\nFormalisez 3 objectifs pour votre équipe sur les 3 prochains mois en format SMART :\n- Spécifique\n- Mesurable\n- Atteignable\n- Réaliste\n- Temporel\n\n### Partie 3 : Plan d''action (40 points)\nPour chaque objectif :\n- Actions concrètes à mettre en œuvre\n- Ressources nécessaires\n- Indicateurs de suivi (KPIs)\n- Fréquence de suivi (hebdomadaire/mensuel)\n\n## Format\n2 à 3 pages maximum, format PDF ou Word.\n\n## Critères d''évaluation\n- Pertinence du diagnostic : 30 pts\n- Qualité des objectifs SMART : 30 pts\n- Réalisme et cohérence du plan d''action : 40 pts')
  RETURNING id INTO v_lesson_id;
  INSERT INTO assignments (lesson_id, course_id, title, instructions, submission_type, max_score, passing_score)
  VALUES (v_lesson_id, v_course_id, 'Plan de développement équipe', 'Rédigez votre plan de management en 2-3 pages.', 'file', 100, 60);

  -- Examen final
  INSERT INTO lessons (module_id, course_id, title, type, position, is_free_preview, exam_duration_minutes, exam_passing_score, exam_max_attempts)
  VALUES (v_module_id, v_course_id, 'Examen Final : Management et Leadership', 'final_exam', 99, false, 40, 70, 3)
  RETURNING id INTO v_lesson_id;
  INSERT INTO quiz_questions (lesson_id, question, options, correct_option, explanation, position) VALUES
  (v_lesson_id, 'Quelle est la caractéristique principale du style de leadership "transformationnel" ?',
   '["Contrôler chaque tâche des collaborateurs","Inspirer et motiver les équipes vers une vision commune en développant leur potentiel","Récompenser uniquement les performances financières","Éviter tout conflit dans l''équipe"]', 1,
   'Le leadership transformationnel développe les collaborateurs, crée du sens, inspire par l''exemple. À distinguer du leadership transactionnel (récompenses/punitions).', 0),
  (v_lesson_id, 'Qu''est-ce qu''un objectif "SMART" ?',
   '["Simple, Motivant, Ambitieux, Rapide, Traçable","Spécifique, Mesurable, Atteignable, Réaliste, Temporel","Stratégique, Managérial, Actionnable, Responsable, Transversal","Suivi, Maîtrisé, Appliqué, Renforcé, Testé"]', 1,
   'SMART : Spécifique (précis), Mesurable (indicateur), Atteignable (réaliste), Réaliste (dans les moyens), Temporel (délai défini). Cadre universel de fixation d''objectifs.', 1),
  (v_lesson_id, 'Qu''est-ce que la matrice Eisenhower dans la gestion du temps ?',
   '["Un outil de gestion budgétaire","Un tableau qui classe les tâches selon leur urgence ET leur importance pour prioriser","Un modèle de réunion efficace","Un outil d''évaluation des collaborateurs"]', 1,
   '4 quadrants : Urgent+Important (faire maintenant), Important+Pas urgent (planifier), Urgent+Pas important (déléguer), Pas urgent+Pas important (éliminer).', 2),
  (v_lesson_id, 'Comment animer une réunion d''équipe efficace ?',
   '["Réunir toute l''équipe dès qu''un problème survient","Préparer un ordre du jour précis, distribuer les rôles, commencer et terminer à l''heure, rédiger un compte-rendu","Laisser la discussion libre sans agenda","Faire des réunions quotidiennes de 2 heures"]', 1,
   'Réunion efficace : ordre du jour envoyé 24h avant, rôles (animateur, secrétaire), time-boxing, actions avec responsables et délais, compte-rendu dans les 24h.', 3),
  (v_lesson_id, 'Quel est le rôle du manager dans la gestion des conflits d''équipe ?',
   '["Ignorer le conflit pour ne pas envenimer","Prendre systématiquement le parti du collaborateur le plus ancien","Faciliter le dialogue, identifier les besoins sous-jacents et orienter vers une solution acceptable par tous","Sanctionner immédiatement les deux parties"]', 2,
   'Le manager-médiateur crée un espace sûr, écoute chaque partie séparément, fait exprimer les besoins (pas les positions), et co-construit une solution. Ni juge ni arbitre.', 4),
  (v_lesson_id, 'Qu''est-ce que la "délégation" et pourquoi est-elle essentielle pour un manager ?',
   '["Transférer les tâches dont on ne veut pas","Confier une mission avec autonomie adaptée pour développer les collaborateurs et libérer du temps stratégique pour le manager","Demander à un collaborateur de travailler plus","Externaliser à un prestataire"]', 1,
   'Déléguer = développer + libérer. Développe les compétences du collaborateur ET libère le manager pour des tâches à plus haute valeur ajoutée. Un manager qui ne délègue pas est un goulot d''étranglement.', 5);
END $$;


-- ============================================================
-- INTELLIGENCE ARTIFICIELLE
-- ============================================================
DO $$ DECLARE
  v_course_id uuid; v_module_id uuid; v_lesson_id uuid;
BEGIN
  SELECT id INTO v_course_id FROM courses WHERE title ILIKE '%Intelligence Artificielle%' LIMIT 1;
  IF v_course_id IS NULL THEN RAISE NOTICE 'IA non trouvée'; RETURN; END IF;
  SELECT id INTO v_module_id FROM modules WHERE course_id = v_course_id ORDER BY position DESC LIMIT 1;

  -- Devoir
  INSERT INTO lessons (module_id, course_id, title, type, position, is_free_preview, content)
  VALUES (v_module_id, v_course_id, 'Devoir : Automatiser une tâche de votre travail avec l''IA', 'assignment', 90, false,
    E'# Devoir Pratique — Automatisation IA en Contexte Professionnel\n\n## Objectif\nIdentifier une tâche répétitive de votre travail et la semi-automatiser avec un outil IA.\n\n## Étapes\n\n### 1. Choix de la tâche (20 points)\nIdentifiez une tâche que vous faites régulièrement :\n- Rédaction d''emails types\n- Résumé de documents\n- Génération de rapports\n- Réponse aux questions clients\n- Création de contenu\n- Analyse de données\n\nDécrivez : la tâche, la fréquence, le temps actuel, la frustration associée.\n\n### 2. Solution IA retenue (30 points)\nChoisissez l''outil adapté (ChatGPT, Claude, Gemini, Midjourney, Gamma...) et créez :\n- Le prompt principal que vous allez utiliser\n- Testez-le et montrez 2 exemples de résultats obtenus\n- Expliquez pourquoi cet outil est le plus adapté\n\n### 3. Résultats et impact (30 points)\n- Temps gagné estimé par semaine\n- Qualité du résultat : meilleur / équivalent / à améliorer ?\n- Limites identifiées (ce que l''IA fait mal)\n- Ajustements apportés au prompt après le premier test\n\n### 4. Recommandation (20 points)\nConseilleriez-vous cet outil à un collègue ? Pourquoi ? Quelles précautions prendre ?\n\n## Format\nRapport de 1-2 pages avec captures d''écran des résultats IA.')
  RETURNING id INTO v_lesson_id;
  INSERT INTO assignments (lesson_id, course_id, title, instructions, submission_type, max_score, passing_score)
  VALUES (v_lesson_id, v_course_id, 'Automatisation IA d''une tâche professionnelle', 'Rapport avec captures d''écran des résultats.', 'both', 100, 60);

  -- Examen final
  INSERT INTO lessons (module_id, course_id, title, type, position, is_free_preview, exam_duration_minutes, exam_passing_score, exam_max_attempts)
  VALUES (v_module_id, v_course_id, 'Examen Final : Intelligence Artificielle et Outils IA', 'final_exam', 99, false, 35, 70, 3)
  RETURNING id INTO v_lesson_id;
  INSERT INTO quiz_questions (lesson_id, question, options, correct_option, explanation, position) VALUES
  (v_lesson_id, 'Quelle est la différence entre l''IA "générative" et l''IA "discriminative" ?',
   '["Aucune différence","L''IA générative crée du nouveau contenu (texte, images), l''IA discriminative classe/prédit à partir de données existantes","L''IA discriminative est plus chère","L''IA générative est réservée aux entreprises"]', 1,
   'Génératives (GPT, DALL-E) : créent du contenu. Discriminatives (classification d''images, détection de spam) : analysent et classent. Les deux ont des usages complémentaires.', 0),
  (v_lesson_id, 'Qu''est-ce que le "prompt engineering" ?',
   '["La programmation de robots physiques","L''art de formuler des instructions précises et efficaces pour obtenir les meilleurs résultats d''une IA","Un type de logiciel de gestion","La formation des ingénieurs en IA"]', 1,
   'Le prompt engineering est une compétence clé : contexte, rôle, tâche précise, format souhaité, exemples. Un bon prompt multiplie la qualité du résultat.', 1),
  (v_lesson_id, 'Quel outil IA est spécialisé dans la génération d''images professionnelles ?',
   '["ChatGPT-3","Excel IA","Midjourney ou DALL-E","Google Docs"]', 2,
   'Midjourney, DALL-E (OpenAI), Stable Diffusion et Adobe Firefly sont spécialisés dans la génération d''images à partir de descriptions textuelles.', 2),
  (v_lesson_id, 'Pourquoi ne faut-il pas partager des données confidentielles avec une IA publique comme ChatGPT ?',
   '["L''IA ne comprend pas les données confidentielles","Les données peuvent être utilisées pour entraîner les modèles ou être accessibles aux équipes du fournisseur","ChatGPT est trop lent pour traiter ces données","Les données confidentielles plantent l''IA"]', 1,
   'Les données saisies dans ChatGPT public peuvent être utilisées pour l''entraînement. Pour les données sensibles (contrats, RH, finances) : utilisez des versions entreprise (ChatGPT Enterprise, Claude for Work) ou des modèles locaux.', 3),
  (v_lesson_id, 'Qu''est-ce que l''"hallucination" d''un modèle de langage ?',
   '["L''IA qui génère des images trop créatives","L''IA qui invente des faits, citations ou données avec confiance alors qu''ils sont faux","Un bug technique qui plante l''IA","L''IA qui répond trop lentement"]', 1,
   'Les LLM peuvent "halluciner" — inventer des informations plausibles mais fausses (statistiques, citations, lois). Toujours vérifier les faits importants dans des sources primaires.', 4),
  (v_lesson_id, 'Quelle est la meilleure utilisation de l''IA pour une PME africaine avec budget limité ?',
   '["Remplacer tous les employés par des robots","Automatiser les tâches répétitives à faible valeur (emails, résumés, traductions) pour que l''équipe se concentre sur la relation client et la stratégie","Acheter le meilleur modèle IA au prix le plus élevé","Attendre que l''IA soit parfaite avant de l''adopter"]', 1,
   'L''IA démultiplie les équipes réduites. Commencez par les tâches chronophages à faible valeur ajoutée (rédaction, résumés, traduction). ROI immédiat, sans investissement majeur.', 5);
END $$;


-- ============================================================
-- RESSOURCES HUMAINES
-- ============================================================
DO $$ DECLARE
  v_course_id uuid; v_module_id uuid; v_lesson_id uuid;
BEGIN
  SELECT id INTO v_course_id FROM courses WHERE slug = 'ressources-humaines-recruter-former-fideliser';
  IF v_course_id IS NULL THEN SELECT id INTO v_course_id FROM courses WHERE title ILIKE '%Ressources Humaines%' LIMIT 1; END IF;
  IF v_course_id IS NULL THEN RAISE NOTICE 'RH non trouvée'; RETURN; END IF;
  SELECT id INTO v_module_id FROM modules WHERE course_id = v_course_id ORDER BY position DESC LIMIT 1;

  -- Devoir
  INSERT INTO lessons (module_id, course_id, title, type, position, is_free_preview, content)
  VALUES (v_module_id, v_course_id, 'Devoir : Processus de recrutement complet pour un poste', 'assignment', 90, false,
    E'# Devoir Pratique — Recrutement d''un Comptable Junior\n\n## Contexte\nVotre PME (secteur au choix) doit recruter un(e) Comptable Junior. Vous êtes responsable RH. Réalisez le processus complet.\n\n## Travail demandé\n\n### 1. Fiche de poste (25 points)\nRédigez la fiche de poste complète :\n- Intitulé du poste\n- Rattachement hiérarchique\n- Missions principales (5-7 missions)\n- Compétences requises (techniques + comportementales)\n- Formation et expérience souhaitées\n- Conditions (lieu, type de contrat, fourchette salariale)\n\n### 2. Annonce de recrutement (25 points)\nRédigez l''annonce à publier (250 mots max) :\n- Présentation de l''entreprise (3 lignes)\n- Description du poste (missions clés)\n- Profil recherché\n- Ce que vous offrez\n- Modalités de candidature\n\n### 3. Guide d''entretien (30 points)\nPréparez 8 questions d''entretien STAR :\n- 3 questions techniques (comptabilité OHADA, logiciels)\n- 3 questions comportementales (situations vécues)\n- 2 questions de mise en situation\nPour chaque question : indiquez ce que vous évaluez et les réponses idéales attendues.\n\n### 4. Grille d''évaluation (20 points)\nCréez une grille de notation sur 100 points avec les critères pondérés.')
  RETURNING id INTO v_lesson_id;
  INSERT INTO assignments (lesson_id, course_id, title, instructions, submission_type, max_score, passing_score)
  VALUES (v_lesson_id, v_course_id, 'Processus de recrutement complet', 'Fiche de poste + annonce + guide entretien + grille. Format PDF.', 'file', 100, 60);

  -- Examen final
  INSERT INTO lessons (module_id, course_id, title, type, position, is_free_preview, exam_duration_minutes, exam_passing_score, exam_max_attempts)
  VALUES (v_module_id, v_course_id, 'Examen Final : Ressources Humaines', 'final_exam', 99, false, 45, 70, 3)
  RETURNING id INTO v_lesson_id;
  INSERT INTO quiz_questions (lesson_id, question, options, correct_option, explanation, position) VALUES
  (v_lesson_id, 'Quelle est la durée légale du congé de maternité en Côte d''Ivoire ?',
   '["6 semaines","8 semaines","14 semaines (6 avant + 8 après accouchement)","6 mois"]', 2,
   '14 semaines = 6 semaines avant + 8 semaines après l''accouchement. L''indemnité est versée par la CNPS (66% du salaire moyen).', 0),
  (v_lesson_id, 'Qu''est-ce que le "taux de turnover" et comment se calcule-t-il ?',
   '["Le taux d''absentéisme","(Nombre de départs / Effectif moyen) × 100 — mesure la rotation du personnel","Le taux de productivité","Le taux d''accidents du travail"]', 1,
   'Turnover = (Départs sur la période / Effectif moyen) × 100. Un turnover >20%/an signale un problème de fidélisation. Le coût d''un départ = 3 à 6 mois de salaire.', 1),
  (v_lesson_id, 'Qu''est-ce qu''un SIRH ?',
   '["Système Informatique de Rémunération et d''Horaires","Système d''Information des Ressources Humaines — logiciel centralisant paie, congés, formation, recrutement","Service Interne de Réclamation des Heures","Simulation Intégrée des Ressources et Humains"]', 1,
   'Un SIRH automatise la gestion RH : paie, congés, dossiers salariés, déclarations sociales, onboarding. Réduit les erreurs et libère du temps pour la RH stratégique.', 2),
  (v_lesson_id, 'Quelle est la différence entre une "faute grave" et une "faute lourde" ?',
   '["Il n''y a pas de différence","Faute grave = licenciement sans préavis mais avec indemnités. Faute lourde = licenciement sans préavis NI indemnités","Faute lourde = avertissement écrit. Faute grave = licenciement","Faute grave = sanctions pénales automatiques"]', 1,
   'Faute grave (vol, violence, abandon de poste) : pas de préavis mais indemnités légales. Faute lourde (actes intentionnels de nuisance) : ni préavis ni indemnités. À prouver devant tribunal.', 3),
  (v_lesson_id, 'Qu''est-ce que la Gestion Prévisionnelle des Emplois et Compétences (GPEC) ?',
   '["Un outil de paie avancée","Une démarche anticipant les besoins en compétences à 3-5 ans pour adapter les effectifs et les formations en conséquence","Un type de contrat de travail","Un bilan social annuel"]', 1,
   'La GPEC anticipe les écarts entre les compétences actuelles et les besoins futurs. Elle alimente le plan de formation, la mobilité interne et la gestion des départs.', 4),
  (v_lesson_id, 'Quel document doit obligatoirement être remis au salarié à la fin de son contrat ?',
   '["Uniquement son dernier bulletin de salaire","Solde de tout compte + Certificat de travail + Attestation Pôle Emploi (selon pays)","Uniquement la lettre de rupture","Le dossier médical du salarié"]', 1,
   'À la rupture du contrat : solde de tout compte (récapitulatif des sommes dues), certificat de travail (dates + fonctions), et selon les pays une attestation pour les droits chômage.', 5);
END $$;


-- ============================================================
-- MARKETING DIGITAL
-- ============================================================
DO $$ DECLARE
  v_course_id uuid; v_module_id uuid; v_lesson_id uuid;
BEGIN
  SELECT id INTO v_course_id FROM courses WHERE slug = 'marketing-digital-pme-africaines';
  IF v_course_id IS NULL THEN RAISE NOTICE 'Marketing Digital non trouvé'; RETURN; END IF;
  SELECT id INTO v_module_id FROM modules WHERE course_id = v_course_id ORDER BY position DESC LIMIT 1;

  -- Devoir
  INSERT INTO lessons (module_id, course_id, title, type, position, is_free_preview, content)
  VALUES (v_module_id, v_course_id, 'Devoir : Créer votre stratégie digitale sur 90 jours', 'assignment', 90, false,
    E'# Devoir Pratique — Plan Marketing Digital 90 Jours\n\n## Contexte\nChoisissez une entreprise réelle (la vôtre ou une PME que vous connaissez) et créez son plan marketing digital pour les 90 prochains jours.\n\n## Travail demandé\n\n### 1. Analyse de la situation actuelle (20 points)\n- Présentation de l''entreprise (secteur, taille, localisation)\n- Présence digitale actuelle (réseaux, site, avis...)\n- 3 forces et 3 faiblesses digitales\n- 1-2 concurrents et leur stratégie digitale\n\n### 2. Persona client (20 points)\nCréez 1 persona détaillé :\n- Profil démographique\n- Comportements digitaux\n- Problèmes et motivations\n- Canaux de découverte préférés\n\n### 3. Calendrier éditorial (30 points)\nCréez un calendrier pour 4 semaines :\n- Plateforme(s) choisie(s) avec justification\n- 20 idées de posts avec type de contenu\n- Répartition 80% valeur / 20% commercial\n- Exemple de 3 textes de publication rédigés\n\n### 4. Campagne publicitaire (30 points)\nConcevez une campagne Facebook/Instagram :\n- Objectif et budget (5 000 - 50 000 FCFA)\n- Ciblage détaillé\n- Texte et description du visuel de la pub\n- KPIs de mesure du succès')
  RETURNING id INTO v_lesson_id;
  INSERT INTO assignments (lesson_id, course_id, title, instructions, submission_type, max_score, passing_score)
  VALUES (v_lesson_id, v_course_id, 'Plan marketing digital 90 jours', 'Document PDF avec persona, calendrier éditorial et plan de campagne.', 'file', 100, 60);

  -- Examen final
  INSERT INTO lessons (module_id, course_id, title, type, position, is_free_preview, exam_duration_minutes, exam_passing_score, exam_max_attempts)
  VALUES (v_module_id, v_course_id, 'Examen Final : Marketing Digital pour PME Africaines', 'final_exam', 99, false, 40, 70, 3)
  RETURNING id INTO v_lesson_id;
  INSERT INTO quiz_questions (lesson_id, question, options, correct_option, explanation, position) VALUES
  (v_lesson_id, 'Qu''est-ce que le "taux de conversion" en marketing digital ?',
   '["Le taux de clics sur une publicité","Le pourcentage de visiteurs qui réalisent l''action souhaitée (achat, inscription, appel)","Le nombre de followers gagnés","Le coût d''une publicité"]', 1,
   'Taux de conversion = (Nombre de conversions / Nombre de visiteurs) × 100. C''est l''indicateur clé de l''efficacité d''une page ou d''une campagne.', 0),
  (v_lesson_id, 'Qu''est-ce que le SEO (Search Engine Optimization) ?',
   '["La publicité payante sur Google","L''ensemble des techniques pour améliorer le positionnement naturel d''un site dans les moteurs de recherche","Un réseau social professionnel","Un type de publicité vidéo"]', 1,
   'Le SEO (référencement naturel) optimise votre site pour apparaître en haut des résultats Google sans payer. Il se travaille sur le long terme via le contenu, la technique et les liens entrants.', 1),
  (v_lesson_id, 'Qu''est-ce que le "ROAS" (Return On Ad Spend) ?',
   '["Le nombre de clics divisé par le budget","Le chiffre d''affaires généré par la publicité divisé par le budget publicitaire dépensé","Le taux d''ouverture des emails","Le nombre d''impressions d''une publicité"]', 1,
   'ROAS = CA généré / Budget pub. Ex : 450 000 FCFA de ventes pour 100 000 FCFA de pub = ROAS de 4,5. En dessous de 2-3, la campagne n''est généralement pas rentable.', 2),
  (v_lesson_id, 'Quelle est la principale règle pour éviter que vos emails marketing arrivent en spam ?',
   '["Envoyer le maximum d''emails possible","Envoyer uniquement à des contacts ayant consenti, avec un vrai lien de désinscription et un objet clair","Utiliser des mots comme GRATUIT et URGENT dans l''objet","Envoyer depuis une adresse Gmail personnelle"]', 1,
   'Anti-spam : consentement (opt-in), désinscription facile (obligatoire légalement), objet honnête, adresse professionnelle, contenu de valeur. Un taux de plaintes >0,1% peut faire bloquer votre domaine.', 3),
  (v_lesson_id, 'Quel est le principal indicateur pour mesurer la qualité d''une communauté sur les réseaux sociaux ?',
   '["Le nombre total de followers","Le taux d''engagement (interactions / portée × 100) plutôt que le nombre d''abonnés","Le nombre de publicités publiées","L''ancienneté du compte"]', 1,
   '10 000 followers avec 0,5% d''engagement = audience morte. 1 000 followers avec 8% d''engagement = communauté active et réelle. Qualité > Quantité.', 4),
  (v_lesson_id, 'En matière de publicité Facebook, qu''est-ce que le "CPL" (Coût Par Lead) ?',
   '["Le coût total de la campagne","Le montant dépensé pour obtenir un contact qualifié (email, numéro de téléphone)","Le coût par like","Le coût par vue vidéo"]', 1,
   'CPL = Budget pub / Nombre de leads obtenus. Si vous dépensez 50 000 FCFA et obtenez 25 contacts → CPL = 2 000 FCFA. À comparer avec la valeur moyenne d''un client converti.', 5);
END $$;


-- ============================================================
-- E-COMMERCE
-- ============================================================
DO $$ DECLARE
  v_course_id uuid; v_module_id uuid; v_lesson_id uuid;
BEGIN
  SELECT id INTO v_course_id FROM courses WHERE slug = 'ecommerce-vente-en-ligne-afrique';
  IF v_course_id IS NULL THEN RAISE NOTICE 'E-commerce non trouvé'; RETURN; END IF;
  SELECT id INTO v_module_id FROM modules WHERE course_id = v_course_id ORDER BY position DESC LIMIT 1;

  -- Devoir
  INSERT INTO lessons (module_id, course_id, title, type, position, is_free_preview, content)
  VALUES (v_module_id, v_course_id, 'Devoir : Créer et optimiser une fiche produit complète', 'assignment', 90, false,
    E'# Devoir Pratique — Fiche Produit E-commerce\n\n## Objectif\nCréer une fiche produit professionnelle pour votre boutique en ligne.\n\n## Travail demandé\n\n### 1. Choisissez un produit (le vôtre ou fictif)\nExemples : boubou wax femme, huile de karité bio, chaussures artisanales, smartphone reconditionné, formation en ligne...\n\n### 2. Rédigez la fiche produit complète (60 points)\n\n**Titre optimisé :**\n[Marque] + [Type de produit] + [Caractéristiques clés] + [Taille/Couleur/Quantité si pertinent]\n\n**Description courte (50-80 mots) :**\nBénéfice principal → caractéristiques clés → pour qui\n\n**Description longue (200-300 mots) :**\n- Présentation complète\n- Caractéristiques techniques détaillées\n- Avantages concurrentiels\n- Situations d''utilisation\n- Garanties et politique de retour\n\n**Prix et disponibilité :**\n- Prix en FCFA (et USD si diaspora visée)\n- Stock disponible\n- Délai de livraison\n- Frais de port\n\n### 3. Plan photos (20 points)\nListez et décrivez les 5-6 photos que vous prendriez :\n- Photo 1 : vue principale (fond, cadrage, lumière)\n- Photo 2-4 : angles complémentaires\n- Photo 5 : en situation d''utilisation\n- Photo 6 (optionnel) : détail important\n\n### 4. Mots-clés SEO (20 points)\nListez 10 mots-clés que vos clients taperaient dans Google pour trouver ce produit')
  RETURNING id INTO v_lesson_id;
  INSERT INTO assignments (lesson_id, course_id, title, instructions, submission_type, max_score, passing_score)
  VALUES (v_lesson_id, v_course_id, 'Fiche produit e-commerce optimisée', 'Rédigez la fiche produit complète avec titre, descriptions et plan photos. Format Word/PDF.', 'both', 100, 60);

  -- Examen final
  INSERT INTO lessons (module_id, course_id, title, type, position, is_free_preview, exam_duration_minutes, exam_passing_score, exam_max_attempts)
  VALUES (v_module_id, v_course_id, 'Examen Final : E-commerce et Vente en Ligne', 'final_exam', 99, false, 40, 70, 3)
  RETURNING id INTO v_lesson_id;
  INSERT INTO quiz_questions (lesson_id, question, options, correct_option, explanation, position) VALUES
  (v_lesson_id, 'Qu''est-ce que le "taux d''abandon de panier" et quel est le taux moyen mondial ?',
   '["Le % de clients qui retournent un produit — environ 10%","Le % de visiteurs qui ajoutent au panier mais ne finalisent pas l''achat — environ 70%","Le % de commandes livrées en retard — environ 30%","Le % de produits en rupture de stock — environ 15%"]', 1,
   'En moyenne, 70% des paniers sont abandonnés avant l''achat. Causes principales : frais de livraison surprises, obligation de créer un compte, processus trop long, manque de confiance.', 0),
  (v_lesson_id, 'Quelle est la meilleure stratégie pour récupérer les paniers abandonnés ?',
   '["Ne rien faire","Envoyer un email/WhatsApp de relance dans les 1-3h avec rappel du panier et éventuellement une petite réduction","Supprimer les produits du panier","Augmenter le prix pour créer l''urgence"]', 1,
   'La relance abandonment de panier est l''une des séquences marketing les plus rentables. Un email dans l''heure suivant l''abandon récupère 10-20% des ventes perdues.', 1),
  (v_lesson_id, 'Pour une boutique WooCommerce en Côte d''Ivoire, quel plugin permet d''accepter Orange Money ?',
   '["PayPal WooCommerce","GeniusPay ou CinetPay — plugins WooCommerce avec intégration Mobile Money","Stripe Africa","MoneyGram WC"]', 1,
   'GeniusPay et CinetPay proposent des plugins WooCommerce officiels qui intègrent Orange Money, MTN MoMo, Wave et cartes bancaires en une seule intégration.', 2),
  (v_lesson_id, 'Comment calculer la marge sur un produit e-commerce ?',
   '["Prix de vente - Frais de livraison","(Prix de vente - Coût d''achat - Frais variables) / Prix de vente × 100","Prix de vente / Coût d''achat","CA mensuel - Charges fixes"]', 1,
   'Marge nette e-commerce = Prix de vente - Coût produit - Livraison - Commission plateforme - Frais de paiement - Part pub. Sur 10 000 FCFA vendus, il peut rester 2 000-4 000 FCFA.', 3),
  (v_lesson_id, 'Qu''est-ce que le "Cross-selling" et le "Up-selling" ?',
   '["Vendre aux concurrents","Cross-selling = proposer des produits complémentaires. Up-selling = proposer une version supérieure du même produit","Vendre en dehors de son pays","Proposer des réductions groupées"]', 1,
   'Cross-selling : "Vous achetez ce téléphone, voici une coque assortie." Up-selling : "Pour 15 000 FCFA de plus, voici le modèle avec double caméra." Les deux augmentent le panier moyen.', 4),
  (v_lesson_id, 'Qu''est-ce que le "NPS" (Net Promoter Score) et à quoi sert-il ?',
   '["Net Profit Score — mesure la rentabilité","Net Promoter Score — mesure la probabilité que vos clients vous recommandent à leur entourage (échelle 0-10)","New Product Sales — CA des nouveaux produits","Night Priority Shipping — livraison nocturne"]', 1,
   'NPS : "De 0 à 10, recommanderiez-vous notre boutique à un ami ?" Promoteurs (9-10) - Détracteurs (0-6) = NPS. >50 = excellent. Indicateur clé de fidélisation et bouche-à-oreille.', 5);
END $$;


-- ============================================================
-- FINANCE PERSONNELLE
-- ============================================================
DO $$ DECLARE
  v_course_id uuid; v_module_id uuid; v_lesson_id uuid;
BEGIN
  SELECT id INTO v_course_id FROM courses WHERE slug = 'finance-personnelle-investissement-afrique';
  IF v_course_id IS NULL THEN RAISE NOTICE 'Finance Personnelle non trouvée'; RETURN; END IF;
  SELECT id INTO v_module_id FROM modules WHERE course_id = v_course_id ORDER BY position DESC LIMIT 1;

  -- Devoir
  INSERT INTO lessons (module_id, course_id, title, type, position, is_free_preview, content)
  VALUES (v_module_id, v_course_id, 'Devoir : Votre plan financier personnel sur 5 ans', 'assignment', 90, false,
    E'# Devoir Pratique — Plan Financier Personnel 5 ans\n\n## Objectif\nÉlaborer votre plan financier personnel basé sur votre situation réelle ou fictive.\n\n## Travail demandé\n\n### 1. Bilan financier actuel (25 points)\nRemplissez le tableau :\n\n**ACTIFS**\n| Actif | Valeur estimée (FCFA) |\n|-------|----------------------|\n| Épargne liquide | |\n| Véhicule | |\n| Bien immobilier | |\n| Autres | |\n| **TOTAL ACTIFS** | |\n\n**PASSIFS**\n| Passif | Montant restant dû (FCFA) |\n|--------|---------------------------|\n| Crédit immobilier | |\n| Crédit auto | |\n| Autres dettes | |\n| **TOTAL PASSIFS** | |\n\n**Patrimoine Net = Total Actifs - Total Passifs**\n\n### 2. Budget mensuel (25 points)\nRépartissez votre revenu mensuel net selon la règle 50/30/20 adaptée :\n- Besoins essentiels (45%)\n- Obligations familiales/sociales (15%)\n- Loisirs personnels (20%)\n- Épargne et investissement (20%)\n\n### 3. Objectifs sur 5 ans (25 points)\nDéfinissez 3 objectifs financiers SMART :\n- Ex : constituer un fonds d''urgence de 900 000 FCFA d''ici 6 mois\n- Ex : acheter un terrain à Abidjan d''ici 3 ans (budget : 8 000 000 FCFA)\n- Ex : investir 50 000 FCFA/mois en OPCVM pendant 5 ans\n\n### 4. Plan d''action (25 points)\nPour chaque objectif : actions concrètes, montant mensuel à épargner, placement choisi et justification.')
  RETURNING id INTO v_lesson_id;
  INSERT INTO assignments (lesson_id, course_id, title, instructions, submission_type, max_score, passing_score)
  VALUES (v_lesson_id, v_course_id, 'Plan financier personnel 5 ans', 'Bilan + budget + objectifs SMART + plan d''action. Format Excel ou PDF.', 'file', 100, 60);

  -- Examen final
  INSERT INTO lessons (module_id, course_id, title, type, position, is_free_preview, exam_duration_minutes, exam_passing_score, exam_max_attempts)
  VALUES (v_module_id, v_course_id, 'Examen Final : Finance Personnelle et Investissement', 'final_exam', 99, false, 40, 70, 3)
  RETURNING id INTO v_lesson_id;
  INSERT INTO quiz_questions (lesson_id, question, options, correct_option, explanation, position) VALUES
  (v_lesson_id, 'Si vous investissez 30 000 FCFA/mois pendant 20 ans à un rendement de 8%/an, quel sera approximativement le capital accumulé ?',
   '["7 200 000 FCFA (sans intérêts)","17 500 000 FCFA","17 648 000 FCFA (environ)","25 000 000 FCFA"]', 2,
   'Avec les intérêts composés à 8%/an : environ 17,6M FCFA contre 7,2M FCFA sans intérêts. Les intérêts ont généré plus de 10M FCFA supplémentaires — la magie des intérêts composés.', 0),
  (v_lesson_id, 'Quelle est la règle des "72" en finance personnelle ?',
   '["Épargner 72% de son salaire","72 / taux d''intérêt annuel = nombre d''années pour doubler son capital","Investir 72 000 FCFA minimum pour débuter","Avoir 72 ans pour toucher sa retraite"]', 1,
   'Règle des 72 : à 8%/an → 72/8 = 9 ans pour doubler. À 6%/an → 72/6 = 12 ans. Outil de calcul mental rapide pour estimer la durée de doublement d''un capital.', 1),
  (v_lesson_id, 'Qu''est-ce que la "diversification" en investissement et pourquoi est-elle importante ?',
   '["Investir dans plusieurs devises uniquement","Répartir ses investissements entre plusieurs actifs décorrélés pour réduire le risque global","Acheter beaucoup d''actions de la même entreprise","Changer d''investissement tous les mois"]', 1,
   'Diversifier : immobilier + actions + obligations + épargne liquide. Si un actif perd de la valeur, les autres compensent. "Ne pas mettre tous ses œufs dans le même panier."', 2),
  (v_lesson_id, 'Quel est le taux d''endettement maximum recommandé par rapport au revenu mensuel ?',
   '["10%","20%","30-35%","50%"]', 2,
   'La règle universelle : le total des mensualités de crédit ne doit pas dépasser 30-35% du revenu net mensuel. Au-delà, le risque de surendettement devient élevé.', 3),
  (v_lesson_id, 'Qu''est-ce qu''un "bon de trésor" et quel est son avantage ?',
   '["Un bon d''achat dans un magasin","Un titre de dette émis par l''État, offrant un rendement garanti de 5-7%/an sur une durée déterminée","Une action en bourse très sûre","Un compte épargne bancaire ordinaire"]', 1,
   'Les bons de trésor (émis par les États africains) offrent 5-7%/an avec garantie de l''État. Parfaits pour l''épargne moyen terme (6 mois à 3 ans) supérieure au compte épargne classique.', 4),
  (v_lesson_id, 'Selon la règle LTV/CAC appliquée à votre vie personnelle, comment évaluer si un investissement en formation est rentable ?',
   '["Il n''est jamais rentable","Si le supplément de revenu généré sur 5 ans dépasse le coût de la formation, l''investissement est rentable","Uniquement si la formation coûte moins de 100 000 FCFA","Seulement les formations diplômantes sont rentables"]', 1,
   'ROI formation = (Augmentation de revenu annuelle × 5 ans) / Coût de la formation. Ex : formation à 200 000 FCFA → augmentation de 100 000 FCFA/an → ROI 5 ans = 500% !', 5);
END $$;


-- ============================================================
-- FORMATION EXCEL
-- ============================================================
DO $$ DECLARE
  v_course_id uuid; v_module_id uuid; v_lesson_id uuid;
BEGIN
  SELECT id INTO v_course_id FROM courses WHERE slug = 'formation-excel-muu7e33g';
  IF v_course_id IS NULL THEN RAISE NOTICE 'Excel non trouvé'; RETURN; END IF;
  SELECT id INTO v_module_id FROM modules WHERE course_id = v_course_id ORDER BY position DESC LIMIT 1;

  -- Devoir
  INSERT INTO lessons (module_id, course_id, title, type, position, is_free_preview, content)
  VALUES (v_module_id, v_course_id, 'Devoir : Tableau de bord des ventes avec TCD et graphiques', 'assignment', 90, false,
    E'# Devoir Pratique — Tableau de Bord Excel\n\n## Objectif\nCréer un tableau de bord complet des ventes d''une PME fictive à partir d''un jeu de données.\n\n## Données à utiliser\nCréez un fichier Excel avec les colonnes :\n- Date (janvier à juin 2024, une ligne par vente)\n- Vendeur (5 vendeurs : Ama, Kofi, Fatou, Moussa, Claire)\n- Région (Abidjan, Bouaké, Daloa, San Pedro)\n- Produit (Produit A : 45 000 FCFA, Produit B : 120 000 FCFA, Produit C : 85 000 FCFA)\n- Quantité (entre 1 et 10)\n- Chiffre d''Affaires (Quantité × Prix unitaire)\n\nSaisissez au minimum 60 lignes de données.\n\n## Travail demandé\n\n### 1. Mise en tableau structuré (10 points)\nConvertissez les données en tableau Excel structuré\n\n### 2. TCD N°1 : CA par Vendeur et Mois (25 points)\n- Lignes : Vendeurs\n- Colonnes : Mois\n- Valeurs : Somme CA\n- Ajoutez des totaux et une mise en forme conditionnelle (meilleur vendeur en vert)\n\n### 3. TCD N°2 : CA par Région et Produit (25 points)\n- Lignes : Régions\n- Colonnes : Produits\n- Valeurs : Somme CA + % du total\n\n### 4. Graphiques (25 points)\n- Histogramme : évolution mensuelle du CA total\n- Graphique en secteurs : répartition du CA par région\n\n### 5. Tableau de bord (15 points)\nUne feuille "Dashboard" avec :\n- Indicateurs clés (CA total, meilleur vendeur, meilleure région)\n- Les 2 graphiques\n- Un segment pour filtrer par vendeur')
  RETURNING id INTO v_lesson_id;
  INSERT INTO assignments (lesson_id, course_id, title, instructions, submission_type, max_score, passing_score)
  VALUES (v_lesson_id, v_course_id, 'Tableau de bord Excel avec TCD', 'Fichier Excel avec données + TCD + graphiques + dashboard.', 'file', 100, 60);

  -- Examen final
  INSERT INTO lessons (module_id, course_id, title, type, position, is_free_preview, exam_duration_minutes, exam_passing_score, exam_max_attempts)
  VALUES (v_module_id, v_course_id, 'Examen Final : Excel et Google Sheets', 'final_exam', 99, false, 35, 70, 3)
  RETURNING id INTO v_lesson_id;
  INSERT INTO quiz_questions (lesson_id, question, options, correct_option, explanation, position) VALUES
  (v_lesson_id, 'Quelle formule Excel compte le nombre de cellules dans A1:A100 contenant la valeur "Abidjan" ?',
   '["=SOMME(A1:A100,\"Abidjan\")","=NB.SI(A1:A100,\"Abidjan\")","=NBVAL(\"Abidjan\",A1:A100)","=COMPTER(A1:A100,\"Abidjan\")"]', 1,
   'NB.SI(plage, critère) compte les cellules correspondant à un critère. SOMME.SI additionne. NBVAL compte les cellules non vides.', 0),
  (v_lesson_id, 'Dans une formule, comment figer uniquement la ligne 1 (pas la colonne) ?',
   '["$A$1","A$1","$A1","A1"]', 1,
   'A$1 : la ligne 1 est figée ($), la colonne A peut changer. Utile pour des tableaux de multiplication ou des calculs avec un taux en ligne d''en-tête.', 1),
  (v_lesson_id, 'Quelle est la différence entre TROUVE() et CHERCHE() en Excel ?',
   '["Elles sont identiques","TROUVE est sensible à la casse (Majuscules/minuscules), CHERCHE ne l''est pas","CHERCHE est plus lente","TROUVE cherche de droite à gauche"]', 1,
   'CHERCHE("abc","ABC") = 1 (insensible). TROUVE("abc","ABC") = erreur (sensible à la casse). Dans la pratique, CHERCHE est plus souvent utilisée.', 2),
  (v_lesson_id, 'Comment afficher "Supérieur" si A1>100, "Inférieur" si A1<50, et "Moyen" sinon ?',
   '["=SI(A1>100,\"Supérieur\",\"Inférieur\")","=SI(A1>100,\"Supérieur\",SI(A1<50,\"Inférieur\",\"Moyen\"))","=CHOISIR(A1,\"Supérieur\",\"Moyen\",\"Inférieur\")","=SWITCH(A1,100,\"Supérieur\")"]', 1,
   'Les SI imbriqués permettent de gérer plusieurs conditions. Structure : =SI(condition1, résultat1, SI(condition2, résultat2, résultat_défaut)).', 3),
  (v_lesson_id, 'Qu''est-ce que la fonctionnalité "Flash Fill" (Remplissage instantané) dans Excel ?',
   '["Une mise en forme conditionnelle automatique","Une IA qui détecte le pattern de saisie et complète automatiquement les cellules suivantes","Un type de graphique animé","Une fonction de tri avancé"]', 1,
   'Flash Fill (Ctrl+E) : tapez un exemple de transformation en colonne B, Excel détecte le pattern et remplit le reste. Idéal pour extraire des prénoms, reformater des dates, etc.', 4),
  (v_lesson_id, 'Dans un TCD, comment obtenir le pourcentage de chaque ligne par rapport au total général ?',
   '["Ajouter une colonne calculée dans les données source","Clic droit sur une valeur → Afficher les valeurs → % du total général","Diviser manuellement chaque cellule par le total","Utiliser la formule =A2/SOMME(A:A)"]', 1,
   'Dans les paramètres de champ de valeur du TCD : "Afficher les valeurs en tant que" → "% du total général". Aucune formule manuelle nécessaire.', 5);
END $$;
