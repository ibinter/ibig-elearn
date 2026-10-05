
-- ============================================================
-- FORMATION 8 : E-commerce et Vente en Ligne en Afrique
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
    'E-commerce et Vente en Ligne en Afrique',
    'ecommerce-vente-en-ligne-afrique',
    'Lancez et développez votre boutique en ligne adaptée au marché africain : choix de la plateforme, gestion des paiements Mobile Money, logistique, marketing digital e-commerce, et stratégies pour conquérir les clients africains sur internet.',
    'Créez votre boutique en ligne et vendez dans toute l''Afrique francophone.',
    v_instructor,
    32000, 49, 53,
    'debutant', 17, 'fr', true, true,
    1456, 4.5, 201,
    ARRAY['e-commerce', 'vente en ligne', 'Mobile Money', 'logistique', 'boutique en ligne'],
    ARRAY['Créer une boutique en ligne adaptée au marché africain', 'Intégrer les paiements Mobile Money et carte bancaire', 'Gérer la logistique et les livraisons en Afrique', 'Attirer des clients via les réseaux sociaux', 'Analyser et optimiser ses ventes en ligne'],
    ARRAY['Avoir un produit ou service à vendre', 'Maîtrise de base d''un smartphone ou ordinateur']
  ) RETURNING id INTO v_course_id;

  INSERT INTO modules (course_id, title, position) VALUES
    (v_course_id, 'Choisir et créer sa boutique en ligne', 1),
    (v_course_id, 'Paiements et logistique en Afrique', 2),
    (v_course_id, 'Attirer et convertir des clients', 3),
    (v_course_id, 'Analyser et faire croître son e-commerce', 4);

  SELECT id INTO v_mod1 FROM modules WHERE course_id = v_course_id ORDER BY position OFFSET 0 LIMIT 1;
  SELECT id INTO v_mod2 FROM modules WHERE course_id = v_course_id ORDER BY position OFFSET 1 LIMIT 1;
  SELECT id INTO v_mod3 FROM modules WHERE course_id = v_course_id ORDER BY position OFFSET 2 LIMIT 1;
  SELECT id INTO v_mod4 FROM modules WHERE course_id = v_course_id ORDER BY position OFFSET 3 LIMIT 1;

  INSERT INTO lessons (module_id, course_id, title, type, position, is_free_preview, content) VALUES
  (v_mod1, v_course_id, 'Choisir la bonne plateforme e-commerce pour l''Afrique', 'document', 1, true,
   E'# Choisir la Bonne Plateforme E-commerce\n\n## Les réalités du e-commerce africain\n\n### Ce qui est différent par rapport à l''Occident\n- Faible taux de bancarisation : Mobile Money domine\n- Infrastructure logistique limitée dans les zones périphériques\n- Faible confiance initiale envers les achats en ligne\n- Forte utilisation du smartphone vs ordinateur (90% du trafic)\n- Préférence pour le "Social Commerce" (Facebook, Instagram, WhatsApp)\n\n## Les plateformes disponibles\n\n### Option 1 : Les réseaux sociaux (Social Commerce)\nVendre directement via Facebook Shop, Instagram Shopping ou WhatsApp Business.\n\nAvantages :\n- Gratuit à créer\n- Vos clients y sont déjà\n- Simple à gérer\n\nLimites :\n- Pas de gestion de stock automatique\n- Paiement manuel à organiser\n- Pas de visibilité sur Google\n\n### Option 2 : Shopify\nPlateforme e-commerce internationale disponible en Afrique.\n\nAvantages :\n- Professionnel et fiable\n- Intégration Mobile Money via plugins tiers\n- Multilingue\n\nCout : à partir de 29 USD/mois\n\n### Option 3 : WooCommerce (WordPress)\nPlugin e-commerce open-source pour WordPress.\n\nAvantages :\n- Contrôle total\n- Intégration CinetPay, Fedapay, etc.\n- Moins cher long terme\n\nDifficulté : demande des compétences techniques ou un développeur\n\n### Option 4 : Plateformes africaines spécialisées\n- Jumia (place de marché, vendre via un tiers)\n- Afrimarket, JIJI\n- Expat-Dakar, Afrimalin (annonces)\n\n## Notre recommandation\n- Démarrage avec budget < 100 USD/mois : Social Commerce + WhatsApp Business\n- Croissance confirmée : WooCommerce avec CinetPay\n- Vente rapide produits physiques : Jumia'),

  (v_mod2, v_course_id, 'Intégrer les paiements Mobile Money sur votre boutique', 'document', 1, false,
   E'# Intégrer les Paiements Mobile Money\n\n## Les solutions de paiement disponibles en Afrique de l''Ouest\n\n### CinetPay (Côte d''Ivoire, Sénégal, Cameroun, Mali...)\nAggregateur de paiement qui regroupe :\n- Orange Money CI\n- MTN Mobile Money\n- Wave\n- Moov Money\n- Visa/Mastercard\n\nFrais : 2,5 à 3,5% par transaction\nInscription : cinetpay.com\n\n### FedaPay (Bénin, Togo, Niger...)\nAlternative pour les pays de l''UEMOA non couverts par CinetPay.\n\n### Flutterwave (toute l''Afrique)\nSolution pan-africaine couvrant 34 pays africains.\n\n## Intégration sur votre boutique\n\n### Avec WooCommerce\n1. Téléchargez le plugin CinetPay WooCommerce\n2. Activez le plugin dans WooCommerce > Extensions\n3. Configurez avec votre API Key CinetPay (trouvée dans votre tableau de bord CinetPay)\n4. Activez les modes de paiement souhaités\n5. Testez avec un paiement en mode sandbox\n\n### Avec Social Commerce (WhatsApp)\n1. Créez un lien de paiement CinetPay depuis votre dashboard\n2. Spécifiez le montant et la description\n3. Envoyez le lien au client sur WhatsApp\n4. Le client paie, vous recevez une notification\n\n## Gérer les remboursements\nCinetPay permet les remboursements depuis le dashboard.\nDélai standard : 3-5 jours ouvrables sur Mobile Money.\n\n## La confiance : élément clé\nAffichez clairement :\n- Les logos des modes de paiement acceptés\n- Le badge "Paiement sécurisé SSL"\n- Votre politique de remboursement\n- Vos coordonnées téléphoniques visibles'),

  (v_mod3, v_course_id, 'Logistique et livraison : les solutions africaines', 'document', 1, false,
   E'# Logistique et Livraison en Afrique\n\n## Les défis logistiques africains\n- Adressage incomplet dans beaucoup de villes (pas de numéros de rue)\n- Infrastructures routières variables selon les zones\n- Taux de "tentatives infructueuses" élevé (client absent ou injoignable)\n- Confiance client : préférence pour la livraison contre remboursement (paiement à la livraison)\n\n## Les modes de livraison\n\n### 1. Livraison express en ville (J+1)\nOpérateurs : DHL, Jumia Logistics, Gozem, YANGO Delivery\nTarif : 1 000 à 3 000 XOF en zone urbaine\nIdéal pour : Abidjan, Dakar, Douala, Cotonou intramuros\n\n### 2. Livraison nationale (J+3 à J+7)\nOpérateurs : Colissimo (ex-La Poste), SOCOPAM (CI)\nTarif : 2 000 à 8 000 XOF selon le poids\n\n### 3. Click and Collect (retrait en boutique)\nLe client commande en ligne, retire en magasin.\nAvantages : 0 coût de livraison, taux de conversion final plus élevé\n\n### 4. Livraison par point relais\nRéseau de points relais en kiosques ou pharmacies.\nEmerge en Afrique de l''Ouest, encore limité.\n\n## Gérer le paiement à la livraison (cash on delivery)\nEn Afrique, 60-70% des clients préfèrent payer à la livraison.\n\nContre-indications :\n- Vous payez la livraison même si le client refuse\n- Risque de commandes frauduleuses\n\nBonne pratique : demandez un acompte de 30% à la commande, solde à la livraison.\n\n## Le suivi de commande\nInformez le client à chaque étape par SMS WhatsApp :\n1. Commande reçue et confirmée\n2. Commande en préparation\n3. Commande en livraison (avec heure estimée)\n4. Commande livrée — invitation à noter l''expérience'),

  (v_mod4, v_course_id, 'Analyser et faire croître votre e-commerce', 'document', 1, false,
   E'# Analyser et Faire Croître Votre E-commerce\n\n## Les KPIs (indicateurs) e-commerce à suivre\n\n### Trafic et acquisition\n- Visiteurs uniques mensuels\n- Sources du trafic (réseaux sociaux, SEO, direct)\n- Coût d''acquisition par canal\n\n### Conversion\n- Taux de conversion = Commandes / Visiteurs x 100\n  Référence : 1-3% est bon pour un e-commerce africain débutant\n- Taux d''abandon de panier (idéalement < 70%)\n- Délai moyen entre visite et achat\n\n### Revenu\n- Chiffre d''affaires mensuel\n- Panier moyen\n- Valeur vie client (LTV = combien un client dépense sur 12 mois)\n\n## Les 5 actions pour doubler ses ventes\n\n### 1. Réduire l''abandon de panier\nRelancez automatiquement les clients qui ont mis un article en panier mais n''ont pas commandé.\nMessage WhatsApp : "Bonjour ! Vous avez laissé des articles dans votre panier. Voici un lien direct pour finaliser votre commande."\n\n### 2. Upsell et cross-sell\nProposez des produits complémentaires à la commande.\n"Les clients qui ont acheté ceci ont aussi aimé..."\n\n### 3. Programme de fidélité\nPoints de fidélité, remises aux clients récurrents, livraison offerte dès X achats.\n\n### 4. Avis et témoignages\nRecueillez et affichez les avis clients. 85% des Africains consultatent les avis avant d''acheter en ligne.\n\n### 5. Optimiser pour mobile\nVérifiez que votre boutique charge en moins de 3 secondes sur un smartphone avec connexion 3G.\nGoogle PageSpeed Insights vous donne le score gratuitement.');

END $$;

-- ============================================================
-- FORMATION 9 : Intelligence Artificielle et Outils IA pour les Professionnels
-- ============================================================
DO $$ DECLARE
  v_course_id uuid;
  v_instructor uuid;
  v_mod1 uuid; v_mod2 uuid; v_mod3 uuid; v_mod4 uuid; v_mod5 uuid;
BEGIN
  v_instructor := 'f51aedf1-d9dc-4864-b74f-d5802bed8f47'::uuid;

  INSERT INTO courses (
    title, slug, description, short_description,
    instructor_id, price_xof, price_eur, price_usd,
    level, duration_hours, language, is_published, is_featured,
    enrollment_count, rating_average, rating_count,
    tags, objectives, requirements
  ) VALUES (
    'Intelligence Artificielle & Outils IA pour les Professionnels',
    'intelligence-artificielle-outils-ia-professionnels',
    'Maîtrisez les outils d''intelligence artificielle incontournables pour les professionnels africains : ChatGPT, Claude, Gemini, Midjourney, outils d''automatisation et de productivité. Apprenez à intégrer l''IA dans votre quotidien professionnel pour gagner du temps et créer plus de valeur.',
    'Maîtrisez l''IA et multipliez votre productivité professionnelle par 10.',
    v_instructor,
    42000, 64, 70,
    'debutant', 24, 'fr', true, true,
    3847, 4.8, 521,
    ARRAY['intelligence artificielle', 'ChatGPT', 'IA', 'productivité', 'automatisation', 'prompts'],
    ARRAY['Utiliser ChatGPT, Claude et Gemini comme des experts', 'Créer du contenu professionnel avec l''IA', 'Automatiser les tâches répétitives avec l''IA', 'Générer des images et visuels avec Midjourney', 'Intégrer l''IA dans sa stratégie professionnelle'],
    ARRAY['Aucun prérequis technique', 'Avoir un smartphone ou ordinateur avec accès internet', 'Être ouvert à l''adoption de nouvelles technologies']
  ) RETURNING id INTO v_course_id;

  INSERT INTO modules (course_id, title, position) VALUES
    (v_course_id, 'Comprendre l''IA et ses opportunités en Afrique', 1),
    (v_course_id, 'Maîtriser ChatGPT et Claude pour le travail', 2),
    (v_course_id, 'L''art du prompting : parler à l''IA comme un expert', 3),
    (v_course_id, 'IA pour la création de contenu et les visuels', 4),
    (v_course_id, 'Automatisation et intégration de l''IA dans votre workflow', 5);

  SELECT id INTO v_mod1 FROM modules WHERE course_id = v_course_id ORDER BY position OFFSET 0 LIMIT 1;
  SELECT id INTO v_mod2 FROM modules WHERE course_id = v_course_id ORDER BY position OFFSET 1 LIMIT 1;
  SELECT id INTO v_mod3 FROM modules WHERE course_id = v_course_id ORDER BY position OFFSET 2 LIMIT 1;
  SELECT id INTO v_mod4 FROM modules WHERE course_id = v_course_id ORDER BY position OFFSET 3 LIMIT 1;
  SELECT id INTO v_mod5 FROM modules WHERE course_id = v_course_id ORDER BY position OFFSET 4 LIMIT 1;

  INSERT INTO lessons (module_id, course_id, title, type, position, is_free_preview, content) VALUES
  (v_mod1, v_course_id, 'L''IA en Afrique : opportunités et enjeux', 'document', 1, true,
   
   E'# L''Intelligence Artificielle en Afrique\n\n## Qu''est-ce que l''IA concrètement ?\nL''intelligence artificielle est un ensemble de technologies capables d''effectuer des tâches qui nécessitaient jusqu''ici l''intelligence humaine : comprendre un texte, générer des images, traduire des langues, résoudre des problèmes.\n\nLes outils IA modernes (ChatGPT, Claude, Gemini) sont des LLM (Large Language Models) entraînés sur des milliards de textes.\n\n## L''Afrique et l''IA : une opportunité historique\n\n### Les avantages de l''Afrique\n- Pas de lourd héritage technologique à moderniser\n- Population jeune, adoptante rapide des nouvelles technologies\n- Problèmes africains qui nécessitent des solutions locales\n- Croissance digitale parmi les plus fortes au monde\n\n### Les défis à adresser\n- Connectivité encore limitée en zones rurales\n- Peu d''outils IA en langues africaines (Dioula, Bambara, Wolof...)\n- Fracture numérique entre urbains et ruraux\n\n## Qui va gagner et qui va perdre avec l''IA ?\n\n### Métiers menacés à moyen terme\n- Saisie de données et traitement manuel de documents\n- Traduction simple\n- Service client de niveau 1 (FAQ)\n- Rédaction de contenus répétitifs\n\n### Métiers enrichis et valorisés\n- Tout professionnel qui sait utiliser l''IA\n- Créatifs (l''IA est un outil, pas un créateur)\n- Managers et décideurs (l''IA conseille, l''humain décide)\n- Développeurs IA et data scientists\n\n## Les 5 outils IA essentiels pour les professionnels africains\n1. ChatGPT (OpenAI) — rédaction, analyse, code\n2. Claude (Anthropic) — documents longs, analyse profonde\n3. Gemini (Google) — intégration Google Workspace\n4. Midjourney — création d''images et visuels\n5. Make/Zapier — automatisation de processus'),

  (v_mod2, v_course_id, 'Maîtriser ChatGPT et Claude pour le travail professionnel', 'document', 1, false,
   E'# Maîtriser ChatGPT et Claude\n\n## Les différences entre ChatGPT, Claude et Gemini\n\n| Critère | ChatGPT | Claude | Gemini |\n|---------|---------|--------|--------|\n| Éditeur | OpenAI | Anthropic | Google |\n| Fenêtre contexte | 128K tokens | 200K tokens | 1M tokens |\n| Points forts | Polyvalent, plugins | Documents longs, précision | Intégration Google |\n| Prix | Gratuit / 20 USD/mois | Gratuit / 20 USD/mois | Gratuit |\n| Accès Afrique | Oui | Oui | Oui |\n\n## 10 usages professionnels immédiats\n\n### 1. Rédiger des emails professionnels\nPrompt : "Rédige un email professionnel pour demander un rendez-vous avec le directeur commercial de [Entreprise]. Contexte : je vends des formations en ligne pour PME. Ton : professionnel et concis."\n\n### 2. Analyser un contrat ou document\nCollez le texte et demandez : "Identifie les clauses potentiellement risquées pour l''acheteur dans ce contrat."\n\n### 3. Préparer une réunion\n"Je dois présenter les résultats Q3 à mon comité de direction dans 1 heure. Voici les chiffres : [collez les données]. Génère une structure de présentation en 5 points."\n\n### 4. Traduire des documents\nChatGPT traduit correctement entre Français, Anglais, Portugais (essentiel pour les marchés anglophones et lusophones d''Afrique).\n\n### 5. Créer des fiches de formation\n"Crée une fiche pratique sur la gestion de la trésorerie d''une PME. Format : 1 page, 5 points clés, style accessible pour non-comptables."\n\n### 6. Analyser des données (Code Interpreter)\nDans ChatGPT Plus, uploadez un fichier Excel et demandez :\n"Analyse ces données de ventes et identifie les 3 insights les plus importants."\n\n### 7. Corriger et améliorer des textes\n"Améliore ce texte pour le rendre plus professionnel et percutant : [collez votre texte]"\n\n### 8. Générer des idées marketing\n"Génère 10 idées de contenu Instagram pour une boutique de mode africaine basée à Abidjan."\n\n### 9. Préparer des entretiens\n"Je passe un entretien pour un poste de directeur marketing dans une banque. Génère les 10 questions les plus probables et les meilleures réponses."\n\n### 10. Créer des scripts WhatsApp\n"Rédige un script de vente pour contacter par WhatsApp des prospects intéressés par nos formations en gestion."'),

  (v_mod3, v_course_id, 'L''art du prompting : parler à l''IA comme un expert', 'document', 1, false,
   E'# L''Art du Prompting\n\n## Qu''est-ce qu''un prompt ?\nUn prompt est l''instruction que vous donnez à une IA. La qualité du résultat dépend directement de la qualité de votre prompt.\n\n**Mauvais prompt :** "Écris un email"\n**Bon prompt :** "Écris un email professionnel en français de 150 mots pour relancer un prospect qui n''a pas répondu depuis 2 semaines. Ton : chaleureux mais direct. Inclure un appel à l''action pour fixer un rendez-vous téléphonique."\n\n## La formule REACT pour des prompts efficaces\n\n**R - Rôle**\nDites à l''IA qui elle est.\n"Tu es un expert en marketing digital spécialisé dans les PME africaines."\n\n**E - Expertise/Contexte**\nDonnez le contexte nécessaire.\n"Notre entreprise vend des logiciels de comptabilité à des TPE en Côte d''Ivoire. Budget marketing mensuel : 200 000 XOF."\n\n**A - Action**\nDéfinissez précisément ce que vous voulez.\n"Crée un plan de contenu pour les réseaux sociaux pour le mois de novembre."\n\n**C - Contraintes**\nSpécifiez les limites.\n"Maximum 8 publications. Inclure 2 posts vidéo, 4 posts éducatifs et 2 témoignages clients. Langue : français."\n\n**T - Ton et format**\nDéfinissez le style et la structure du résultat.\n"Format : tableau avec colonnes Date, Plateforme, Type, Sujet, Hashtags."\n\n## Techniques avancées\n\n### Chain of Thought (raisonnement étape par étape)\n"Avant de répondre, réfléchis étape par étape à ce problème et explique ton raisonnement."\n\n### Few-shot learning (exemples)\n"Voici 2 exemples du style que je veux : [Exemple 1] [Exemple 2]. Maintenant crée 5 autres exemples dans le même style."\n\n### Critique et amélioration itérative\n1. Générez un premier résultat\n2. "Identifie les 3 principales faiblesses de ce texte"\n3. "Améliore-le en corrigeant ces faiblesses"\n\n## Les 10 mots déclencheurs de qualité\nAjoutez ces mots à vos prompts pour de meilleurs résultats :\n- "Professionnel"\n- "Concis et impactant"\n- "Avec des exemples concrets"\n- "Adapté au contexte africain"\n- "En utilisant des données chiffrées"\n- "Structuré en points numérotés"\n- "Sans jargon technique"\n- "Actionnable immédiatement"'),

  (v_mod4, v_course_id, 'Créer du contenu professionnel avec l''IA', 'document', 1, false,
   
   E'# Créer du Contenu Professionnel avec l''IA\n\n## La création d''images avec Midjourney\n\n### Qu''est-ce que Midjourney ?\nMidjourney est un générateur d''images IA qui crée des visuels professionnels à partir d''une description textuelle.\n\n### Accès\n- Via Discord : discord.gg/midjourney\n- Prix : à partir de 10 USD/mois\n\n### Prompts pour les professionnels africains\n\nPour le marketing :\n"Professional African businesswoman presenting to a board meeting in a modern office in Abidjan, natural lighting, corporate photography style, high quality"\n\nPour les visuels de formations :\n"Infographic about financial management for African SMEs, clean design, blue and orange color scheme, French text labels, professional"\n\n### Alternatives gratuites\n- DALL-E 3 (intégré dans ChatGPT Plus)\n- Adobe Firefly (gratuit avec quota)\n- Canva AI (intégré dans Canva)\n- Leonardo AI (plan gratuit)\n\n## Créer des présentations avec l''IA\n\n### Gamma.app\nCréez une présentation complète en 30 secondes :\n1. Allez sur gamma.app\n2. Cliquez "Create with AI"\n3. Décrivez votre présentation en 1 phrase\n4. Choisissez le style et le thème\n5. Exportez en PDF ou PowerPoint\n\n### Beautiful.ai\nAlternative premium avec des designs professionnels.\n\n## Créer des vidéos et contenus audio\n\n### Sous-titres automatiques\n- Captions.ai : génère des sous-titres animés pour vos Reels/TikTok\n- CapCut : sous-titres automatiques en français\n\n### Voix off IA\n- ElevenLabs : voix ultra-réalistes en français\n- Murf.ai : voix professionnelles pour formations en ligne\n\n### Avatars IA\n- HeyGen : créez un avatar IA qui parle à votre place (idéal pour créateurs de contenu sans apparaître à l''écran)'),

  (v_mod5, v_course_id, 'Automatiser son travail avec l''IA et No-Code', 'document', 1, false,
   E'# Automatiser son Travail avec l''IA\n\n## L''automatisation No-Code : révolution pour les PME africaines\nSans savoir programmer, vous pouvez aujourd''hui automatiser :\n- Répondre automatiquement aux emails clients\n- Publier sur les réseaux sociaux en automatique\n- Créer des rapports PDF automatiquement\n- Envoyer des alertes WhatsApp quand une condition est remplie\n- Synchroniser vos données entre différents outils\n\n## Make (anciennement Integromat)\n\n### Qu''est-ce que Make ?\nMake est une plateforme d''automatisation visuelle qui connecte des milliers d''applications entre elles.\n\n### Exemple de scénario Make utile\n\n"Quand un nouveau client passe une commande sur WooCommerce :\n1. Ajouter le client dans Google Sheets\n2. Envoyer un message WhatsApp de confirmation automatique\n3. Créer une tâche dans Notion pour l''équipe logistique\n4. Envoyer un email de bienvenue personnalisé"\n\nCe flux, qui prendrait 15 minutes manuellement, s''exécute en 3 secondes, automatiquement, 24h/24.\n\n### Plans Make\n- Gratuit : 1 000 opérations/mois (pour démarrer)\n- Starter : 9 USD/mois\n\n## Zapier\nAlternative à Make, plus simple mais moins puissante.\n- Gratuit jusqu''à 100 tâches/mois\n- 20 USD/mois pour les plans avancés\n\n## Les agents IA : la prochaine frontière\n\nUn agent IA est un programme IA capable de réaliser des tâches complexes de manière autonome.\n\n**Exemples d''agents disponibles aujourd''hui :**\n- Rechercher sur internet et rédiger un rapport\n- Lire vos emails et y répondre selon des règles\n- Analyser vos données et envoyer des alertes\n- Gérer votre calendrier et planifier des réunions\n\n**Outils :** AutoGPT, n8n, Crew AI, Dify\n\n## Plan d''action sur 30 jours\n\nSemaine 1 : Identifiez vos 5 tâches les plus répétitives\nSemaine 2 : Automatisez la 1ère avec Make ou Zapier\nSemaine 3 : Automatisez les 2 suivantes\nSemaine 4 : Mesurez le temps gagné et planifiez la suite\n\nObjectif : gagner 5 à 10 heures par semaine grâce à l''automatisation.');

END $$;
