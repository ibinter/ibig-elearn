
-- ============================================================
-- FORMATION 2 : Marketing Digital pour PME Africaines
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
    'Marketing Digital pour PME Africaines',
    'marketing-digital-pme-africaines',
    'Apprenez à développer votre présence en ligne, acquérir des clients via les réseaux sociaux, créer du contenu percutant et rentabiliser votre marketing digital — adapté aux réalités des PME africaines avec de petits budgets.',
    'Attirez des clients en ligne et faites croître votre PME africaine avec le digital.',
    v_instructor,
    30000, 46, 50,
    'debutant', 15, 'fr', true, true,
    3241, 4.6, 428,
    ARRAY['marketing digital', 'réseaux sociaux', 'PME', 'Facebook', 'contenu'],
    ARRAY['Créer et optimiser une page Facebook/Instagram professionnelle', 'Lancer des campagnes publicitaires avec un petit budget', 'Produire du contenu engageant adapté à l''Afrique', 'Utiliser WhatsApp Business pour fidéliser ses clients'],
    ARRAY['Avoir un smartphone et un accès internet', 'Posséder ou gérer une activité commerciale']
  ) RETURNING id INTO v_course_id;

  INSERT INTO modules (course_id, title, position) VALUES
    (v_course_id, 'Les bases du marketing digital en Afrique', 1),
    (v_course_id, 'Facebook & Instagram pour les PME', 2),
    (v_course_id, 'WhatsApp Business & stratégie de contenu', 3),
    (v_course_id, 'Publicité digitale avec un petit budget', 4);

  SELECT id INTO v_mod1 FROM modules WHERE course_id = v_course_id ORDER BY position OFFSET 0 LIMIT 1;
  SELECT id INTO v_mod2 FROM modules WHERE course_id = v_course_id ORDER BY position OFFSET 1 LIMIT 1;
  SELECT id INTO v_mod3 FROM modules WHERE course_id = v_course_id ORDER BY position OFFSET 2 LIMIT 1;
  SELECT id INTO v_mod4 FROM modules WHERE course_id = v_course_id ORDER BY position OFFSET 3 LIMIT 1;

  INSERT INTO lessons (module_id, course_id, title, type, position, is_free_preview, content) VALUES
  (v_mod1, v_course_id, 'Le digital en Afrique : chiffres et opportunités', 'document', 1, true,
   E'# Le Digital en Afrique : Chiffres et Opportunités\n\n## Les chiffres clés 2024\n- 600 millions d''Africains ont accès à internet\n- 490 millions d''utilisateurs de réseaux sociaux actifs\n- 70% des achats en ligne commencent sur les réseaux sociaux\n- Le marché e-commerce africain croît de 25% par an\n\n## Pourquoi votre PME doit être présente en ligne\n\n### 1. Vos clients y sont déjà\nLe consommateur africain consulte Facebook, Instagram et WhatsApp en moyenne 4h30 par jour.\n\n### 2. Le coût publicitaire est encore faible\nEn Afrique de l''Ouest, le coût par clic (CPC) sur Facebook est 5 à 10 fois moins cher qu''en Europe.\n\n### 3. La concurrence n''est pas encore saturée\nLes PME africaines qui adoptent le digital maintenant ont un avantage concurrentiel réel.\n\n## Les 3 piliers d''une présence digitale efficace\n1. Visibilité : être trouvable (pages sociales, Google My Business)\n2. Engagement : créer du contenu que votre audience partage\n3. Conversion : transformer les abonnés en clients payants\n\n## Les plateformes par pays\n\n| Pays | Plateforme dominante |\n|------|---------------------|\n| Côte d''Ivoire | Facebook, WhatsApp |\n| Sénégal | Facebook, TikTok |\n| Cameroun | Facebook, WhatsApp |\n| Kenya | Instagram, Twitter/X |\n| Nigeria | Instagram, TikTok |'),

  (v_mod2, v_course_id, 'Optimiser votre page Facebook professionnelle', 'document', 1, false,
   E'# Optimiser votre Page Facebook Professionnelle\n\n## La configuration de base — checklist\n\n- Nom de la page = nom exact de votre entreprise\n- Photo de profil = logo haute résolution (400x400 px minimum)\n- Photo de couverture = image professionnelle (820x312 px)\n- Description courte = en 155 caractères ce que vous faites et où\n- Bouton appel à action = WhatsApp ou appeler\n- Horaires d''ouverture renseignés\n- Localisation précise ajoutée\n- Nom d''utilisateur personnalisé choisi\n\n## Les types de publications qui fonctionnent en Afrique\n\n### Format 1 : Avant / Après\nMontrez la transformation que vous apportez. Puissant pour coiffeurs, réparateurs, services.\n\n### Format 2 : La preuve sociale\nCitez un client satisfait avec sa permission : "Voici ce que dit notre client Jean-Baptiste"\n\n### Format 3 : Le contenu éducatif\n"3 choses à savoir sur..." — positionne comme expert dans votre domaine.\n\n### Format 4 : Les coulisses\nMontrez votre équipe, votre processus, votre atelier. Crée de la proximité humaine.\n\n## La fréquence idéale\n- Minimum : 3 publications par semaine\n- Idéal : 5 publications par semaine\n- Jamais : 10 posts par jour (perçu comme spam)\n\n## Les horaires de publication optimaux en Afrique de l''Ouest\n- 7h-9h : les navetteurs\n- 12h-14h : la pause déjeuner\n- 19h-22h : le prime time numérique'),

  (v_mod3, v_course_id, 'WhatsApp Business : votre outil de vente le plus puissant', 'document', 1, false,
   E'# WhatsApp Business : L''Outil de Vente N°1 en Afrique\n\n## Pourquoi WhatsApp domine\n- Taux d''ouverture des messages WhatsApp : 98% (vs 20% pour l''email)\n- Utilisé par 90%+ des Africains connectés\n- Conversation directe, personnelle, instantanée\n- Totalement gratuit\n\n## Configuration de WhatsApp Business\n\n### Fonctionnalités essentielles\n\n**1. Le profil professionnel**\nNom commercial, adresse, site web, email, description en 256 caractères.\n\n**2. Le catalogue produits**\nPrésentez vos produits avec photos et prix. Les clients commandent directement depuis le catalogue.\n\n**3. Les messages automatiques**\n- Message d''accueil : envoyé quand quelqu''un vous écrit pour la 1ère fois\n- Message d''absence : quand vous n''êtes pas disponible\n- Réponses rapides : pour les questions fréquentes (FAQ)\n\n**4. Les étiquettes (tags)**\nClassifiez vos contacts : Nouveau client / En cours / Commande livrée / Fidèle\n\n## Liste de diffusion vs Groupes\n\n| | Liste de diffusion | Groupe |\n|--|--|--|\n| Destinataires se voient | Non | Oui |\n| Message reçu en privé | Oui | Non |\n| Idéal pour promotions | Oui | Non |\n| Taille maximale | 256 | 1024 |\n\nToujours préférer la liste de diffusion pour vos communications commerciales.\n\n## Script de qualification client\nQuand un prospect vous contacte :\n1. "Bonjour ! Je suis [nom] de [entreprise]. Comment puis-je vous aider ?"\n2. Qualifiez : quel est votre besoin exact ?\n3. Proposez : voici ce que nous pouvons faire pour vous\n4. Closez : on peut commencer dès quand ?'),

  (v_mod4, v_course_id, 'Lancer une campagne Facebook Ads avec 10 000 XOF', 'document', 1, false,
   E'# Campagne Facebook Ads avec 10 000 XOF\n\n## Avant de dépenser : 3 questions\n1. Quel est l''objectif de cette campagne ? (notoriété, trafic, ventes)\n2. A qui je m''adresse exactement ? (âge, ville, intérêts)\n3. Quelle est mon offre concrète ?\n\n## Créer votre première campagne pas à pas\n\n### Étape 1 : Accéder au Gestionnaire de publicités\nFacebook.com/adsmanager (nécessite une page Facebook professionnelle)\n\n### Étape 2 : Choisir l''objectif\nPour débutants : "Interactions" ou "Trafic vers WhatsApp"\n\n### Étape 3 : Définir l''audience\n- Pays : Côte d''Ivoire (ou votre pays)\n- Age : 25-45 ans (à adapter selon votre cible)\n- Centres d''intérêt : Mode, Entrepreneurs, Immobilier selon votre secteur\n- Taille estimée idéale : 50 000 à 500 000 personnes\n\n### Étape 4 : Budget et calendrier\n- Budget quotidien : 2 000 XOF/jour x 5 jours = 10 000 XOF total\n- Programmation : 8h-22h pour maximiser les vues\n\n### Étape 5 : Créer le visuel\n- Photo ou vidéo courte (15 secondes max)\n- Texte accrocheur commençant par une question ou un chiffre\n- Bouton d''action "Envoyer un message" (redirige vers WhatsApp)\n\n## Analyser les résultats après 3 jours\n- CPM (coût pour 1000 impressions) < 1 000 XOF = bon\n- CTR (taux de clic) > 2% = bon\n- CPC (coût par clic) < 100 XOF = excellent\n\nSi les métriques sont mauvaises, changez le visuel avant de couper la campagne.');

END $$;

-- ============================================================
-- FORMATION 3 : Excel & Google Sheets Avancé
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
    'Excel & Google Sheets Avancé pour Professionnels',
    'excel-google-sheets-avance-professionnels',
    'Maîtrisez les formules avancées, tableaux croisés dynamiques, automatisation et visualisation de données pour transformer votre productivité professionnelle. Formation orientée cas pratiques africains.',
    'Devenez expert Excel/Sheets et automatisez votre travail quotidien.',
    v_instructor,
    25000, 38, 42,
    'intermediaire', 20, 'fr', true, false,
    1893, 4.8, 267,
    ARRAY['Excel', 'Google Sheets', 'tableur', 'données', 'automatisation'],
    ARRAY['Maîtriser les formules avancées (INDEX/MATCH, SUMIFS)', 'Créer des tableaux de bord dynamiques', 'Automatiser avec les macros', 'Analyser avec les tableaux croisés dynamiques'],
    ARRAY['Connaître les bases d''Excel ou Google Sheets', 'Avoir accès à Excel ou Google Sheets']
  ) RETURNING id INTO v_course_id;

  INSERT INTO modules (course_id, title, position) VALUES
    (v_course_id, 'Formules avancées et fonctions essentielles', 1),
    (v_course_id, 'Tableaux croisés dynamiques (TCD)', 2),
    (v_course_id, 'Tableaux de bord et visualisation', 3),
    (v_course_id, 'Automatisation et macros', 4);

  SELECT id INTO v_mod1 FROM modules WHERE course_id = v_course_id ORDER BY position OFFSET 0 LIMIT 1;
  SELECT id INTO v_mod2 FROM modules WHERE course_id = v_course_id ORDER BY position OFFSET 1 LIMIT 1;
  SELECT id INTO v_mod3 FROM modules WHERE course_id = v_course_id ORDER BY position OFFSET 2 LIMIT 1;
  SELECT id INTO v_mod4 FROM modules WHERE course_id = v_course_id ORDER BY position OFFSET 3 LIMIT 1;

  INSERT INTO lessons (module_id, course_id, title, type, position, is_free_preview, content) VALUES
  (v_mod1, v_course_id, 'RECHERCHEV, INDEX/EQUIV : les formules qui changent tout', 'document', 1, true,
   E'# RECHERCHEV et INDEX/EQUIV\n\n## RECHERCHEV (VLOOKUP)\nLa formule la plus utilisée dans les entreprises.\n\n### Syntaxe\n=RECHERCHEV(valeur_cherchee; tableau; numero_colonne; FAUX)\n\n### Exemple : trouver le salaire d''un employé\n=RECHERCHEV(A2; Employes!A:D; 4; FAUX)\n- A2 = Matricule à chercher\n- Employes!A:D = tableau de données\n- 4 = 4ème colonne = colonne Salaire\n- FAUX = correspondance exacte\n\n### Limitations de RECHERCHEV\n- Ne peut chercher qu''à droite\n- Sensible à l''insertion de colonnes\n\n## INDEX/EQUIV — La formule des experts\n\n### Syntaxe\n=INDEX(colonne_resultat; EQUIV(valeur_cherchee; colonne_recherche; 0))\n\n### Avantages\n- Peut chercher à gauche ET à droite\n- Non affecté par l''insertion de colonnes\n- Plus rapide sur grands tableaux\n\n## SOMME.SI.ENS (SUMIFS)\nSommer selon plusieurs critères simultanément.\n\n=SOMME.SI.ENS(plage_somme; plage_critere1; critere1; plage_critere2; critere2)\n\n**Exemple :** Total ventes de "Koné" en "Janvier" dans la région "Nord"\n=SOMME.SI.ENS(D:D; B:B; "Koné"; C:C; "Janvier"; E:E; "Nord")\n\n## NB.SI.ENS (COUNTIFS)\nCompter selon plusieurs critères.\n=NB.SI.ENS(A:A; "Koné"; B:B; "Janvier")\n\n## Exercice pratique\nCréez un tableau de 100 ventes et calculez :\n1. Total des ventes de chaque vendeur\n2. Nombre de transactions par région\n3. Meilleure vente de chaque mois'),

  (v_mod2, v_course_id, 'Tableaux Croisés Dynamiques : analyser 10 000 lignes en 5 minutes', 'document', 1, false,
   E'# Tableaux Croisés Dynamiques (TCD)\n\n## Pourquoi les TCD sont révolutionnaires\nAvec un TCD, analysez 10 000 lignes en moins de 5 minutes sans écrire une formule.\n\n## Préparer vos données\n- Première ligne = en-têtes de colonnes\n- Pas de colonnes vides\n- Pas de cellules fusionnées\n- Chaque ligne = un enregistrement\n\n## Créer votre premier TCD\n**Excel :** Insertion > Tableau croisé dynamique\n**Google Sheets :** Insertion > Tableau croisé dynamique\n\n## Configurer le TCD\nGlissez les champs dans les zones :\n- Lignes : catégories à analyser (ex: Vendeur)\n- Colonnes : sous-catégories (ex: Mois)\n- Valeurs : ce qu''on calcule (ex: Somme des ventes)\n- Filtres : pour filtrer l''ensemble du TCD\n\n## Cas pratique : Analyser les ventes d''une boutique\n\nDonnées disponibles : Date, Vendeur, Produit, Région, Montant\n\n**Question :** "Quel vendeur a le plus vendu par région en Novembre ?"\n\n**Configuration TCD :**\n- Lignes : Vendeur\n- Colonnes : Région\n- Valeurs : Somme(Montant)\n- Filtre : Mois = Novembre\n\nRéponse obtenue en 10 secondes !\n\n## Les segments (Slicers)\nAjoutez des boutons de filtre visuels pour que votre direction puisse filtrer par période ou région en un clic — sans toucher au TCD.'),

  (v_mod3, v_course_id, 'Créer un tableau de bord professionnel', 'document', 1, false,
   E'# Créer un Tableau de Bord Professionnel\n\n## Les principes d''un bon dashboard\n\n### 1. Un objectif clair\nUn tableau de bord répond à une seule question métier :\n- "Comment évoluent nos ventes ce mois ?"\n- "Quel département dépense le plus ?"\n\n### 2. Des KPIs sélectionnés\nChoisissez 5 à 7 métriques maximum. Trop d''informations = aucune information.\n\n**KPIs courants pour PME africaines :**\n- Chiffre d''affaires mensuel\n- Nombre de transactions\n- Ticket moyen\n- Taux de recouvrement\n- Stock restant\n\n## Structure recommandée\n\nRangée 1 : 3-4 indicateurs clés en gros (cellules de couleur)\nRangée 2 : Graphique évolution CA mensuelle (courbe)\nRangée 3 gauche : Top 5 produits (tableau)\nRangée 3 droite : Répartition par région (camembert)\n\n## Les graphiques adaptés\n\n| Situation | Graphique |\n|-----------|----------|\n| Évolution dans le temps | Courbe ou Barres |\n| Comparaison catégories | Barres horizontales |\n| Proportions | Secteurs (camembert) |\n| Avancement objectif | Jauge |\n\n## Mettre à jour automatiquement\n- Liez toutes les formules à votre feuille de données source\n- Quand vous ajoutez des données dans la feuille source, le dashboard se met à jour seul\n- Utilisez CTRL+ALT+F5 pour forcer le recalcul'),

  (v_mod4, v_course_id, 'Automatiser avec les macros Excel (VBA simplifié)', 'document', 1, false,
   E'# Automatiser avec les Macros Excel\n\n## Qu''est-ce qu''une macro ?\nUne macro est une séquence d''actions enregistrées que vous rejouez en un clic.\n\n**Exemple concret :** Chaque lundi matin vous :\n1. Ouvrez le fichier de ventes\n2. Copiez les données dans le rapport\n3. Formatez le tableau\n4. Exportez en PDF\n\nUne macro peut faire tout cela automatiquement.\n\n## Enregistrer votre première macro dans Excel\n\n1. Onglet Développeur > Enregistrer une macro\n2. Donnez un nom (sans espaces : "FormatRapport")\n3. Assignez un raccourci clavier (ex: Ctrl+Shift+R)\n4. Effectuez vos actions normalement\n5. Cliquez Arrêter l''enregistrement\n\n## Comprendre le code VBA généré\n\nExemple de macro de formatage :\n\nSub FormatRapport()\n    Rows("1:1").Select\n    Selection.Font.Bold = True\n    Selection.Interior.Color = RGB(11, 61, 145)\n    Selection.Font.Color = RGB(255, 255, 255)\nEnd Sub\n\n## 5 macros utiles pour les PME africaines\n1. Formatage automatique de rapports mensuels\n2. Import et nettoyage de données exportées\n3. Génération de factures numérotées automatiquement\n4. Consolidation de plusieurs feuilles en une\n5. Copie des données vers une feuille d''archive\n\n## Google Apps Script (équivalent pour Google Sheets)\nFunction formate() {\n  var feuille = SpreadsheetApp.getActiveSheet();\n  var plage = feuille.getRange("A1:Z1");\n  plage.setFontWeight("bold");\n  plage.setBackground("#0B3D91");\n  plage.setFontColor("#FFFFFF");\n}');

END $$;

-- ============================================================
-- FORMATION 4 : Management et Leadership en Afrique
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
    'Management et Leadership en Afrique',
    'management-leadership-afrique',
    'Développez vos compétences de manager et de leader dans le contexte africain : gestion d''équipes multigénérationnelles, leadership situationnel, résolution de conflits, et création d''une culture d''excellence adaptée aux réalités locales.',
    'Devenez le leader que votre équipe et votre organisation méritent.',
    v_instructor,
    40000, 61, 67,
    'intermediaire', 22, 'fr', true, true,
    1654, 4.5, 198,
    ARRAY['management', 'leadership', 'équipe', 'RH', 'organisation'],
    ARRAY['Comprendre les styles de leadership et choisir le bon', 'Motiver une équipe africaine multigénérationnelle', 'Gérer les conflits et situations difficiles', 'Déléguer efficacement et faire confiance'],
    ARRAY['Être manager ou aspirer à le devenir', 'Avoir une expérience professionnelle de 2 ans minimum']
  ) RETURNING id INTO v_course_id;

  INSERT INTO modules (course_id, title, position) VALUES
    (v_course_id, 'Comprendre le leadership en contexte africain', 1),
    (v_course_id, 'Motiver et engager son équipe', 2),
    (v_course_id, 'Déléguer, contrôler et faire confiance', 3),
    (v_course_id, 'Gérer les conflits et situations difficiles', 4);

  SELECT id INTO v_mod1 FROM modules WHERE course_id = v_course_id ORDER BY position OFFSET 0 LIMIT 1;
  SELECT id INTO v_mod2 FROM modules WHERE course_id = v_course_id ORDER BY position OFFSET 1 LIMIT 1;
  SELECT id INTO v_mod3 FROM modules WHERE course_id = v_course_id ORDER BY position OFFSET 2 LIMIT 1;
  SELECT id INTO v_mod4 FROM modules WHERE course_id = v_course_id ORDER BY position OFFSET 3 LIMIT 1;

  INSERT INTO lessons (module_id, course_id, title, type, position, is_free_preview, content) VALUES
  (v_mod1, v_course_id, 'Les 4 styles de leadership et lequel vous convient', 'document', 1, true,
   
   E'# Les 4 Styles de Leadership\n\n## Le leadership situationnel (Hersey & Blanchard)\nIl n''existe pas de style universellement supérieur. Le bon leader adapte son style à la situation.\n\n## Les 4 styles\n\n### Style 1 : Directif (Dire)\n- Directives précises, contrôle fort, peu d''écoute\n- Idéal pour : nouveau collaborateur, tâche urgente\n- Risque : démotivation si utilisé trop longtemps\n\n### Style 2 : Persuasif (Vendre)\n- Explique les décisions, encourage, répond aux questions\n- Idéal pour : collaborateur motivé mais peu compétent\n- Avantage : développe la compréhension et l''adhésion\n\n### Style 3 : Participatif (Consulter)\n- Partage la décision, écoute les idées, soutient\n- Idéal pour : collaborateur compétent mais peu confiant\n- Avantage : développe l''autonomie et la confiance\n\n### Style 4 : Délégatif (Déléguer)\n- Confie la responsabilité entière, vérifie les résultats\n- Idéal pour : collaborateur compétent ET motivé\n- Avantage : libère le manager et valorise le collaborateur\n\n## Le contexte africain : ce qui est différent\n\n### La dimension de l''ancienneté\nEn Afrique, l''ancienneté et l''âge confèrent une autorité sociale qui peut compliquer le management de collaborateurs plus âgés. Solution : reconnaître publiquement leur expérience tout en maintenant les objectifs.\n\n### Le collectivisme\nLes cultures africaines sont majoritairement collectivistes. Les récompenses d''équipe fonctionnent mieux que les récompenses individuelles.\n\n### L''oralité\nLes décisions orales ont autant de poids que les écrits. Confirmez toujours les accords par écrit APRES la conversation orale.'),

  (v_mod2, v_course_id, 'Les 7 leviers de motivation d''une équipe africaine', 'document', 1, false,
   E'# Les 7 Leviers de Motivation\n\n## Au-delà du salaire\nUne étude dans 8 pays africains montre que le salaire n''est que le 3ème facteur de motivation.\n\n## Les 7 leviers\n\n### 1. La reconnaissance\n"Vous avez fait un excellent travail." Simple, gratuit, puissant.\n67% des employés africains se sentent sous-reconnus.\n\nActions concrètes :\n- Félicitez publiquement en réunion\n- Créez un "Employé du mois" avec photo et prime symbolique\n- Envoyez un SMS personnel de remerciement\n\n### 2. Le sens et la mission\nLes collaborateurs qui comprennent pourquoi leur travail est important donnent 40% de meilleurs résultats.\nExpliquez systématiquement le "pourquoi" avant le "quoi".\n\n### 3. La rémunération équitable\nPas nécessairement élevée, mais perçue comme juste par rapport aux collègues.\n\n### 4. Les perspectives d''évolution\nProposez un plan de carrière explicite. La promesse crédible d''évolution retient les talents.\n\n### 5. L''environnement de travail\nOrganisation, propreté, outils fonctionnels. Travailler avec du matériel cassé envoie un signal fort : tu ne mérites pas mieux.\n\n### 6. La formation continue\nInvestir dans la formation crée un sentiment de loyauté fort.\n\n### 7. L''équilibre vie professionnelle / personnelle\nRespectez les engagements familiaux et religieux. Un manager inflexible sur les cérémonies familiales perd ses meilleurs éléments.'),

  (v_mod3, v_course_id, 'L''art de déléguer sans perdre le contrôle', 'document', 1, false,
   E'# L''Art de Déléguer\n\n## Pourquoi les managers délèguent peu en Afrique\n1. Peur de perdre le contrôle\n2. Perfectionnisme : "Personne ne le fera aussi bien que moi"\n3. Manque de temps : "Expliquer prend plus de temps que faire"\n4. Culture du chef : dans certaines cultures africaines déléguer semble une faiblesse\n\nChacune de ces croyances est fausse et coûteuse.\n\n## Le processus de délégation en 5 étapes\n\n### Étape 1 : Choisir QUOI déléguer\nDéléguez : tâches récurrentes, tâches techniques que d''autres maîtrisent mieux.\nNe déléguez PAS : évaluations de performance, décisions stratégiques, sanctions.\n\n### Étape 2 : Choisir À QUI déléguer\nQui a la compétence ET la disponibilité pour cette tâche ?\n\n### Étape 3 : Briefer clairement\nLe brief parfait répond à :\n- Quoi : quel est le livrable attendu ?\n- Pourquoi : quelle est l''importance ?\n- Quand : quelle est la deadline ?\n- Avec quoi : quelles ressources ?\n- Marge : quelle liberté a le collaborateur ?\n\n### Étape 4 : Faire confiance ET vérifier\nFixer des points d''étape réguliers sans microgérer.\nRègle : vérifiez le résultat, pas le processus.\n\n### Étape 5 : Donner du feedback\nToujours clôturer une délégation par un retour constructif.\n\n## L''échelle de délégation (7 niveaux)\n1. Faites ce que je vous dis\n2. Étudiez le problème, proposez une solution, j''approuve\n3. Faites puis informez-moi immédiatement\n4. Faites puis informez-moi régulièrement\n5. Faites, informez si problème\n6. Faites, ne m''informez pas sauf exception\n7. Décidez à ma place sur ce sujet'),

  (v_mod4, v_course_id, 'Gérer les conflits dans une équipe africaine', 'document', 1, false,
   E'# Gérer les Conflits dans une Équipe Africaine\n\n## Les types de conflits les plus fréquents\n1. Conflit de ressources : deux départements veulent le même budget\n2. Conflit de personnalités : deux collaborateurs ne s''entendent pas\n3. Conflit de valeurs : désaccord sur les méthodes ou l''éthique\n4. Conflit de rôles : ambiguïté sur qui fait quoi\n5. Conflit interculturel ou inter-ethnique\n\n## La méthode DESC pour résoudre un conflit\n\n### D - Décrire les faits\n"J''ai observé que depuis 3 semaines, les rapports sont remis en retard."\nPas de jugement, que des faits observables.\n\n### E - Exprimer l''impact\n"Cela m''inquiète car cela retarde les décisions de toute l''équipe."\n\n### S - Spécifier le changement souhaité\n"Je souhaite que les rapports soient remis chaque vendredi avant 17h."\n\n### C - Conséquences positives\n"Ainsi, nous pourrons anticiper les problèmes en réunion de lundi."\n\n## La médiation entre deux collaborateurs\n\nRègles de la séance :\n1. Lieu neutre, en privé\n2. Chaque partie parle sans être interrompue\n3. Reformuler avant de répondre\n4. Chercher les besoins sous-jacents, pas les positions\n5. Trouver un accord concret avec suivi à J+15\n\n## La règle des 24 heures\nNe jamais traiter un conflit à chaud. Laissez passer 24 heures, puis abordez le sujet avec calme.');

END $$;
