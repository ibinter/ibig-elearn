-- ============================================================
-- QUIZ : Formations restantes (IA, RH, Communication, Entrepreneuriat)
-- ============================================================

-- ============================================================
-- INTELLIGENCE ARTIFICIELLE & OUTILS IA
-- ============================================================
DO $$ DECLARE
  v_course_id uuid;
  v_module_id uuid;
  v_lesson_id uuid;
BEGIN
  SELECT id INTO v_course_id FROM courses WHERE title ILIKE '%Intelligence Artificielle%' LIMIT 1;
  IF v_course_id IS NULL THEN RAISE NOTICE 'IA non trouvée'; RETURN; END IF;

  SELECT id INTO v_module_id FROM modules WHERE course_id = v_course_id ORDER BY position LIMIT 1;
  IF v_module_id IS NOT NULL THEN
    INSERT INTO lessons (module_id, course_id, title, type, position, is_free_preview)
    VALUES (v_module_id, v_course_id, 'Quiz : Comprendre l''Intelligence Artificielle', 'quiz', 99, false)
    RETURNING id INTO v_lesson_id;

    INSERT INTO quiz_questions (lesson_id, question, options, correct_option, explanation, position) VALUES
    (v_lesson_id, 'Qu''est-ce que le "Machine Learning" (apprentissage automatique) ?',
     '["Un logiciel qui copie le travail humain manuellement","Un système qui apprend à partir de données sans être explicitement programmé","Un robot physique qui effectue des tâches","Un langage de programmation"]', 1,
     'Le Machine Learning permet aux machines d''apprendre à partir d''exemples (données) et d''améliorer leurs performances sans reprogrammation manuelle.', 0),
    (v_lesson_id, 'ChatGPT est basé sur quel type de modèle d''IA ?',
     '["Réseau de neurones convolutif (CNN)","Grand Modèle de Langage (LLM - Large Language Model)","Intelligence artificielle générale (AGI)","Algorithme de tri"]', 1,
     'ChatGPT est un LLM (Large Language Model) entraîné sur d''immenses quantités de texte pour comprendre et générer du langage naturel.', 1),
    (v_lesson_id, 'Qu''est-ce qu''un "prompt" dans le contexte de l''IA générative ?',
     '["Un bug informatique","Une instruction ou question donnée à l''IA pour obtenir un résultat","Un type de modèle d''IA","Un logiciel de traitement d''images"]', 1,
     'Le prompt est votre instruction à l''IA. La qualité du prompt détermine directement la qualité de la réponse — c''est la compétence clé du "prompt engineering".', 2),
    (v_lesson_id, 'Quel outil IA est le plus adapté pour générer des images professionnelles ?',
     '["ChatGPT","Google Sheets","Midjourney ou DALL-E","Microsoft Word"]', 2,
     'Midjourney, DALL-E (OpenAI) et Stable Diffusion sont spécialisés dans la génération d''images à partir de descriptions textuelles.', 3),
    (v_lesson_id, 'Quelle précaution essentielle prendre avec les informations fournies par une IA générative ?',
     '["Les accepter telles quelles, l''IA ne fait jamais d''erreurs","Toujours vérifier les faits importants car l''IA peut halluciner (inventer des informations)","Uniquement utiliser l''IA pour les questions simples","Ne jamais utiliser l''IA en entreprise"]', 1,
     'Les LLM peuvent "halluciner" — inventer des faits, citations, statistiques qui semblent convaincants mais sont faux. Vérifiez toujours les informations critiques.', 4);
  END IF;

  -- Quiz 2 : Outils IA pratiques
  SELECT id INTO v_module_id FROM modules WHERE course_id = v_course_id ORDER BY position OFFSET 1 LIMIT 1;
  IF v_module_id IS NOT NULL THEN
    INSERT INTO lessons (module_id, course_id, title, type, position, is_free_preview)
    VALUES (v_module_id, v_course_id, 'Quiz : Outils IA et productivité au quotidien', 'quiz', 99, false)
    RETURNING id INTO v_lesson_id;

    INSERT INTO quiz_questions (lesson_id, question, options, correct_option, explanation, position) VALUES
    (v_lesson_id, 'Quel outil IA est le plus efficace pour résumer automatiquement de longs documents PDF ?',
     '["Google Translate","Claude (Anthropic) ou ChatGPT avec upload de fichier","Microsoft Paint","WinRAR"]', 1,
     'Claude et ChatGPT (versions payantes) peuvent analyser et résumer des PDF directement uploadés. Idéal pour les rapports, contrats, articles longs.', 0),
    (v_lesson_id, 'Comment améliorer un prompt pour obtenir une réponse plus précise de ChatGPT ?',
     '["Écrire en majuscules","Donner du contexte, préciser le rôle, le format souhaité et un exemple","Utiliser des emojis","Poser plusieurs questions à la fois"]', 1,
     'Un bon prompt : contexte (qui vous êtes), rôle de l''IA (expert en...), tâche précise, format de sortie (liste, tableau...), et exemple si possible.', 1),
    (v_lesson_id, 'Pour créer une présentation PowerPoint rapidement avec l''IA, quel outil est le mieux adapté ?',
     '["ChatGPT seul","Gamma.app ou Beautiful.ai (IA spécialisée slides)","Google Maps","Canva classique sans IA"]', 1,
     'Gamma.app et Beautiful.ai génèrent des présentations complètes avec mise en page professionnelle à partir d''un simple texte ou sujet.', 2),
    (v_lesson_id, 'Qu''est-ce que la "prompt injection" et pourquoi est-ce un risque de sécurité ?',
     '["Une technique pour améliorer les prompts","Une attaque où du texte malveillant dans un document manipule l''IA pour qu''elle agisse à l''encontre de ses instructions","Un type d''erreur grammaticale dans un prompt","Un plugin ChatGPT"]', 1,
     'La prompt injection : un attaquant insère des instructions dans un document traité par une IA pour détourner son comportement. Risque réel pour les apps IA en production.', 3),
    (v_lesson_id, 'Quel est le principal avantage de l''IA pour les PME africaines disposant de ressources limitées ?',
     '["Remplacer tous les employés","Automatiser les tâches répétitives (rédaction, analyse, service client) pour se concentrer sur la valeur ajoutée","Accéder gratuitement à tous les logiciels","Supprimer les frais de marketing"]', 1,
     'L''IA permet aux petites équipes d''accomplir le travail d''équipes plus grandes : rédaction, analyse de données, service client 24h/24, traduction, etc.', 4);
  END IF;
END $$;


-- ============================================================
-- RESSOURCES HUMAINES : RECRUTER, FORMER, FIDÉLISER
-- ============================================================
DO $$ DECLARE
  v_course_id uuid;
  v_module_id uuid;
  v_lesson_id uuid;
BEGIN
  SELECT id INTO v_course_id FROM courses WHERE slug = 'ressources-humaines-recruter-former-fideliser';
  IF v_course_id IS NULL THEN
    SELECT id INTO v_course_id FROM courses WHERE title ILIKE '%Ressources Humaines%' LIMIT 1;
  END IF;
  IF v_course_id IS NULL THEN RAISE NOTICE 'RH non trouvée'; RETURN; END IF;

  -- Quiz Recrutement
  SELECT id INTO v_module_id FROM modules WHERE course_id = v_course_id AND title ILIKE '%Recrut%' LIMIT 1;
  IF v_module_id IS NOT NULL THEN
    INSERT INTO lessons (module_id, course_id, title, type, position, is_free_preview)
    VALUES (v_module_id, v_course_id, 'Quiz : Recrutement et sélection', 'quiz', 99, false)
    RETURNING id INTO v_lesson_id;

    INSERT INTO quiz_questions (lesson_id, question, options, correct_option, explanation, position) VALUES
    (v_lesson_id, 'Qu''est-ce qu''une "fiche de poste" et à quoi sert-elle ?',
     '["Un document de paie","Un document décrivant les missions, compétences requises et conditions du poste","Un contrat de travail","Un bilan de compétences"]', 1,
     'La fiche de poste définit : intitulé, missions principales, compétences requises (hard & soft skills), hiérarchie, conditions. C''est la base du recrutement.', 0),
    (v_lesson_id, 'Quelle méthode d''entretien est la plus prédictive des performances futures d''un candidat ?',
     '["Questions générales (parlez-moi de vous)","Entretien comportemental STAR (Situation, Tâche, Action, Résultat)","Test de personnalité uniquement","Entretien de groupe uniquement"]', 1,
     'La méthode STAR demande des exemples concrets de situations passées. Le comportement passé est le meilleur prédicteur du comportement futur.', 1),
    (v_lesson_id, 'Qu''est-ce que le "coût de remplacement" d''un collaborateur ?',
     '["Son salaire mensuel","En moyenne 3 à 6 mois de salaire (recrutement + formation + perte de productivité)","Le coût de son matériel informatique","Le montant de ses indemnités de licenciement"]', 1,
     'Remplacer un collaborateur coûte 3 à 6 mois de son salaire : annonces, entretiens, formation, perte de productivité pendant la montée en compétences.', 2),
    (v_lesson_id, 'Dans un processus de recrutement éthique, quelle question est INTERDITE lors d''un entretien ?',
     '["Quels sont vos points forts ?","Où vous voyez-vous dans 5 ans ?","Êtes-vous enceinte ou prévoyez-vous de l''être ?","Décrivez une réussite professionnelle récente"]', 2,
     'Les questions sur la grossesse, religion, état de santé, situation familiale, appartenance syndicale sont discriminatoires et illégales dans la plupart des pays africains.', 3),
    (v_lesson_id, 'Qu''est-ce que l''onboarding (intégration) d''un nouveau collaborateur ?',
     '["Le processus de licenciement","Le processus d''accueil et d''intégration dans l''entreprise pendant les premières semaines","La période d''essai juridique","La négociation salariale"]', 1,
     'L''onboarding couvre les premières semaines : accueil, présentation équipe, outils, culture entreprise, missions progressives. Un bon onboarding réduit le turnover de 82%.', 4);
  END IF;

  -- Quiz Droit du travail
  SELECT id INTO v_module_id FROM modules WHERE course_id = v_course_id AND title ILIKE '%Droit%' LIMIT 1;
  IF v_module_id IS NOT NULL THEN
    INSERT INTO lessons (module_id, course_id, title, type, position, is_free_preview)
    VALUES (v_module_id, v_course_id, 'Quiz : Droit du travail en zone OHADA', 'quiz', 99, false)
    RETURNING id INTO v_lesson_id;

    INSERT INTO quiz_questions (lesson_id, question, options, correct_option, explanation, position) VALUES
    (v_lesson_id, 'En Côte d''Ivoire, quelle est la durée de la période d''essai pour un cadre en CDI ?',
     '["1 mois renouvelable une fois","3 mois renouvelable une fois","6 mois non renouvelable","12 mois"]', 1,
     'En Côte d''Ivoire : Cadres = 3 mois renouvelable 1 fois (6 mois max). Agents de maîtrise = 2 mois. Employés/Ouvriers = 1 mois.', 0),
    (v_lesson_id, 'Quel est le nombre de jours ouvrables de congés payés acquis par mois de travail en Côte d''Ivoire ?',
     '["1 jour","1,5 jour","2,5 jours","5 jours"]', 2,
     '2,5 jours ouvrables/mois = 30 jours ouvrables/an (après 12 mois complets). Des majorations s''appliquent après 5, 15 et 20 ans d''ancienneté.', 1),
    (v_lesson_id, 'Quelle est la première étape obligatoire d''une procédure de licenciement en Afrique de l''Ouest ?',
     '["Envoyer la lettre de licenciement immédiatement","Convoquer le salarié à un entretien préalable (au minimum 5 jours avant)","Contacter l''inspection du travail","Bloquer le salaire du mois"]', 1,
     'Sans convocation préalable à un entretien, la procédure de licenciement est viciée et peut être annulée par le tribunal du travail.', 2),
    (v_lesson_id, 'Qu''est-ce que la CNPS en Côte d''Ivoire ?',
     '["Caisse Nationale de Prévoyance Sociale — organisme de sécurité sociale des salariés du privé","Chambre Nationale des Professions et Syndicats","Centre National des Petites Structures","Conseil National de la Paie Salariale"]', 0,
     'La CNPS (Caisse Nationale de Prévoyance Sociale) gère : retraite, allocations familiales, accidents du travail pour les salariés du secteur privé en CI.', 3),
    (v_lesson_id, 'Quel est le taux approximatif total de cotisation employeur à la CNPS en Côte d''Ivoire ?',
     '["3%","8%","16%","25%"]', 2,
     'Environ 16% à la charge de l''employeur (retraite 7,7% + allocations familiales 5,75% + accidents du travail 2-5%). Le salarié cotise 6,3% en plus.', 4);
  END IF;
END $$;


-- ============================================================
-- COMMUNICATION PROFESSIONNELLE ET PRISE DE PAROLE EN PUBLIC
-- ============================================================
DO $$ DECLARE
  v_course_id uuid;
  v_module_id uuid;
  v_lesson_id uuid;
BEGIN
  SELECT id INTO v_course_id FROM courses WHERE slug = 'communication-professionnelle-prise-de-parole';
  IF v_course_id IS NULL THEN
    SELECT id INTO v_course_id FROM courses WHERE title ILIKE '%Communication%Parole%' LIMIT 1;
  END IF;
  IF v_course_id IS NULL THEN RAISE NOTICE 'Communication non trouvée'; RETURN; END IF;

  SELECT id INTO v_module_id FROM modules WHERE course_id = v_course_id ORDER BY position LIMIT 1;
  IF v_module_id IS NOT NULL THEN
    INSERT INTO lessons (module_id, course_id, title, type, position, is_free_preview)
    VALUES (v_module_id, v_course_id, 'Quiz : Communication professionnelle', 'quiz', 99, false)
    RETURNING id INTO v_lesson_id;

    INSERT INTO quiz_questions (lesson_id, question, options, correct_option, explanation, position) VALUES
    (v_lesson_id, 'Selon les études de communication, quelle proportion du message est transmise par le langage non-verbal (gestes, posture, expressions) ?',
     '["7%","38%","55%","80%"]', 2,
     'La règle de Mehrabian : 7% mots, 38% ton de la voix, 55% langage non-verbal. En communication professionnelle, le corps parle autant que les mots.', 0),
    (v_lesson_id, 'Quelle technique est la plus efficace pour gérer le trac avant une prise de parole en public ?',
     '["Éviter de penser à la présentation jusqu''au dernier moment","Respiration abdominale profonde + répétition à voix haute avant","Boire un café fort","Lire ses notes pendant toute la présentation"]', 1,
     'La respiration abdominale active le système nerveux parasympathique et réduit physiquement le stress. La répétition à voix haute renforce la confiance.', 1),
    (v_lesson_id, 'Qu''est-ce que la méthode SCORE pour structurer une communication persuasive ?',
     '["Situation, Complication, Objectif, Résolution, Évaluation","Style, Couleur, Organisation, Rythme, Émotion","Sujet, Contexte, Offre, Résultat, Exemple","Source, Clarté, Originalité, Répétition, Efficacité"]', 0,
     'SCORE : Situation (contexte), Complication (problème), Objectif (ce qu''on veut atteindre), Résolution (solution), Évaluation (résultats attendus). Structure narrative puissante.', 2),
    (v_lesson_id, 'Dans un email professionnel, quelle est la règle pour l''objet ?',
     '["L''objet peut être vide","L''objet doit être court, précis et inciter à l''ouverture (action + contexte)","L''objet doit résumer tout l''email en détail","L''objet en majuscules pour attirer l''attention"]', 1,
     'Objet email : max 50 caractères, précis, avec le contexte ou l''action attendue. Ex: "Validation devis formation RH — Réponse avant vendredi".', 3),
    (v_lesson_id, 'Lors d''une négociation, quelle posture est recommandée ?',
     '["Imposer sa position dès le départ et ne pas céder","Chercher un accord gagnant-gagnant en comprenant les besoins réels de l''autre partie","Accepter toutes les demandes de l''autre pour maintenir la relation","Mentir sur ses marges de manœuvre"]', 1,
     'La négociation intégrative (win-win) cherche à satisfaire les intérêts des deux parties. Elle préserve la relation et crée plus de valeur que la négociation distributive (gagnant-perdant).', 4);
  END IF;

  SELECT id INTO v_module_id FROM modules WHERE course_id = v_course_id ORDER BY position OFFSET 1 LIMIT 1;
  IF v_module_id IS NOT NULL THEN
    INSERT INTO lessons (module_id, course_id, title, type, position, is_free_preview)
    VALUES (v_module_id, v_course_id, 'Quiz : Prise de parole et présentation en public', 'quiz', 99, false)
    RETURNING id INTO v_lesson_id;

    INSERT INTO quiz_questions (lesson_id, question, options, correct_option, explanation, position) VALUES
    (v_lesson_id, 'Quelle est la structure narrative la plus efficace pour une présentation professionnelle ?',
     '["Commencer par les données techniques","Hook (accroche) → Problème → Solution → Bénéfices → Appel à l''action","Lire toutes les diapositives mot à mot","Commencer par se présenter longuement"]', 1,
     'La structure narrative : accroche forte (histoire, chiffre choc, question) → problème que l''audience connaît → votre solution → bénéfices concrets → CTA clair.', 0),
    (v_lesson_id, 'Quel est le nombre maximum de mots recommandé par diapositive PowerPoint ?',
     '["100 mots","50 mots","20-30 mots (une idée principale par slide)","Pas de limite"]', 2,
     'Une slide = une idée. 20 à 30 mots maximum. Les slides surchargées font que l''audience lit au lieu d''écouter. Images et graphiques > texte long.', 1),
    (v_lesson_id, 'Comment gérer une question difficile ou un contradicteur lors d''une présentation ?',
     '["Ignorer la question et continuer","Reformuler la question, remercier, répondre avec des faits et rebondir positivement","Se mettre en colère pour montrer sa conviction","Dire que vous ne savez pas et terminer la présentation"]', 1,
     'Reformuler (montre que vous avez compris) + remercier (valorise la question) + répondre factuellement + rebondir vers votre message. Si vous ne savez pas : "Je vérifierai et reviendrai vers vous."', 2),
    (v_lesson_id, 'Pourquoi le contact visuel est-il crucial lors d''une prise de parole ?',
     '["Pour intimider l''audience","Pour créer une connexion, montrer la confiance et vérifier la compréhension de l''audience","Pour mémoriser son discours en regardant les yeux des gens","Ce n''est pas important en Afrique"]', 1,
     'Le contact visuel crée la connexion humaine, montre votre assurance, engage l''audience et vous permet de voir si les gens suivent ou sont perdus.', 3),
    (v_lesson_id, 'Qu''est-ce que le "storytelling" appliqué à une présentation professionnelle ?',
     '["Raconter des histoires fictives pour divertir","Utiliser des récits concrets (cas client, anecdote, situation vécue) pour rendre un message mémorable et émotionnellement engageant","Lire un roman pendant la présentation","Inventer des données pour convaincre"]', 1,
     'Le storytelling ancre les messages abstraits dans des histoires concrètes. Le cerveau retient 22 fois mieux une information présentée sous forme de récit que sous forme de données brutes.', 4);
  END IF;
END $$;


-- ============================================================
-- COMMENT ENTREPRENDRE EFFICACEMENT
-- ============================================================
DO $$ DECLARE
  v_course_id uuid;
  v_module_id uuid;
  v_lesson_id uuid;
BEGIN
  SELECT id INTO v_course_id FROM courses WHERE slug = 'comment-entreprendre-efficacement-afrique';
  IF v_course_id IS NULL THEN
    SELECT id INTO v_course_id FROM courses WHERE title ILIKE '%Entreprendre%' LIMIT 1;
  END IF;
  IF v_course_id IS NULL THEN RAISE NOTICE 'Entrepreneuriat non trouvé'; RETURN; END IF;

  SELECT id INTO v_module_id FROM modules WHERE course_id = v_course_id ORDER BY position LIMIT 1;
  IF v_module_id IS NOT NULL THEN
    INSERT INTO lessons (module_id, course_id, title, type, position, is_free_preview)
    VALUES (v_module_id, v_course_id, 'Quiz : Idée, validation et modèle économique', 'quiz', 99, false)
    RETURNING id INTO v_lesson_id;

    INSERT INTO quiz_questions (lesson_id, question, options, correct_option, explanation, position) VALUES
    (v_lesson_id, 'Quelle est la méthode recommandée pour valider une idée d''entreprise avant d''investir massivement ?',
     '["Garder l''idée secrète et lancer directement","Construire un MVP (Produit Minimum Viable) et tester avec de vrais clients","Faire une étude de marché de 6 mois","Attendre d''avoir tout le financement"]', 1,
     'Le MVP permet de tester l''idée réelle avec de vrais clients en minimisant le temps et l''argent investi. Mieux vaut apprendre tôt que d''investir sur une mauvaise hypothèse.', 0),
    (v_lesson_id, 'Qu''est-ce qu''un "Business Model Canvas" ?',
     '["Un logiciel de comptabilité","Un outil visuel en 9 blocs pour décrire et tester un modèle économique","Un type de contrat commercial","Un plan financier à 5 ans"]', 1,
     'Le BMC (Alexander Osterwalder) structure sur 1 page : proposition de valeur, segments clients, canaux, revenus, ressources, activités clés, partenaires, structure de coûts.', 1),
    (v_lesson_id, 'Quelle est la différence entre un "besoin" et un "désir" en marketing ?',
     '["Il n''y a pas de différence","Un besoin est fondamental (manger, se loger), un désir est la façon préférée de satisfaire ce besoin","Un désir est plus important qu''un besoin","Un besoin est créé par la publicité"]', 1,
     'Besoin : état de manque fondamental. Désir : la façon culturelle de satisfaire ce besoin. En Afrique, le besoin de communication = universel, le désir = iPhone vs Nokia vs WhatsApp.', 2),
    (v_lesson_id, 'Quel est le principal avantage de créer une SARL en Afrique de l''Ouest ?',
     '["Pas de capital minimum requis","Responsabilité limitée des associés au montant de leurs apports","Zéro impôt les 3 premières années","Accès automatique aux marchés publics"]', 1,
     'La SARL protège le patrimoine personnel des associés : en cas de faillite, les créanciers ne peuvent pas saisir les biens personnels (maison, voiture) au-delà des apports.', 3),
    (v_lesson_id, 'Qu''est-ce que le "point mort" (ou seuil de rentabilité) d''une entreprise ?',
     '["Le moment où l''entreprise fait faillite","Le niveau de chiffre d''affaires à partir duquel l''entreprise couvre toutes ses charges et commence à dégager des bénéfices","Le capital minimum pour créer une société","Le taux d''imposition des bénéfices"]', 1,
     'Point mort = Charges fixes / Taux de marge sur coût variable. En dessous : perte. Au-dessus : bénéfice. Tout entrepreneur doit connaître ce chiffre clé.', 4);
  END IF;

  SELECT id INTO v_module_id FROM modules WHERE course_id = v_course_id ORDER BY position OFFSET 1 LIMIT 1;
  IF v_module_id IS NOT NULL THEN
    INSERT INTO lessons (module_id, course_id, title, type, position, is_free_preview)
    VALUES (v_module_id, v_course_id, 'Quiz : Financement et croissance de la PME', 'quiz', 99, false)
    RETURNING id INTO v_lesson_id;

    INSERT INTO quiz_questions (lesson_id, question, options, correct_option, explanation, position) VALUES
    (v_lesson_id, 'Quelle est la principale source de financement des startups africaines à leurs débuts ?',
     '["Capital-risque international","Fonds propres et famille/amis (Love Money)","Prêt bancaire classique","Fonds de l''Union Européenne"]', 1,
     'La majorité des startups africaines démarrent avec leurs propres économies et l''aide de la famille (Love Money). Les banques refusent souvent sans garanties ni historique.', 0),
    (v_lesson_id, 'Qu''est-ce qu''un "Business Angel" ?',
     '["Un consultant en stratégie","Un investisseur individuel fortuné qui investit son propre argent en échange de parts dans une startup prometteuse","Un type de prêt bancaire","Un label de qualité pour les entreprises"]', 1,
     'Les Business Angels apportent de l''argent ET leur réseau ET leur expérience. Ils investissent à un stade précoce où les fonds VC n''interviennent pas encore.', 1),
    (v_lesson_id, 'Quelle est la meilleure stratégie de croissance pour une PME africaine en phase de démarrage ?',
     '["S''étendre immédiatement dans 5 pays","Se concentrer sur UN segment précis, le maîtriser, puis étendre","Lever des fonds le plus tôt possible","Copier exactement le modèle d''une entreprise occidentale"]', 1,
     'Concentrez-vous sur un segment précis ("niche") pour devenir le leader incontesté dans ce créneau avant d''élargir. Essayer de tout faire dès le début mène souvent à l''échec.', 2),
    (v_lesson_id, 'Qu''est-ce que le "cashflow" et pourquoi est-il plus critique que le bénéfice comptable ?',
     '["C''est la même chose que le bénéfice","Le cashflow est la trésorerie disponible au quotidien — une entreprise bénéficiaire peut faire faillite par manque de liquidités","Le chiffre d''affaires mensuel","Le capital social de l''entreprise"]', 1,
     'On peut être bénéficiaire sur le papier mais fauchés en trésorerie (clients qui ne paient pas, stocks immobilisés). "Cash is king" : sans cash disponible, pas de paie, pas de fournisseurs.', 3),
    (v_lesson_id, 'Quel est l''indicateur clé pour mesurer la santé commerciale d''une PME ?',
     '["Le nombre d''employés","Le chiffre d''affaires seul","La marge nette ET le taux de croissance du CA combinés","Le nombre de produits proposés"]', 2,
     'La marge nette (est-ce qu''on gagne vraiment de l''argent ?) ET la croissance du CA (est-ce qu''on développe notre activité ?) ensemble donnent une image complète de la santé commerciale.', 4);
  END IF;
END $$;
