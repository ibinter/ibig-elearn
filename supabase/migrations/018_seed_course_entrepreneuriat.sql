-- ============================================================
-- Migration 018 : Seed contenu formation "Entrepreneuriat Efficacement"
-- Formateur : Patrice Kouakou
-- ============================================================

DO $$
DECLARE
  v_course_id    uuid;
  v_instructor   uuid;
  v_mod1 uuid; v_mod2 uuid; v_mod3 uuid;
  v_mod4 uuid; v_mod5 uuid; v_mod6 uuid;
BEGIN

-- 1. Trouver Patrice Kouakou
SELECT id INTO v_instructor
FROM public.profiles
WHERE full_name ILIKE '%patrice%kouakou%'
   OR email ILIKE '%patrice%'
ORDER BY created_at LIMIT 1;

IF v_instructor IS NULL THEN
  RAISE NOTICE 'Profil Patrice Kouakou introuvable — vérifiez le nom exact dans la table profiles';
  RETURN;
END IF;

-- 2. Trouver la formation
SELECT id INTO v_course_id
FROM public.courses
WHERE title ILIKE '%Entreprendre Efficacement%'
ORDER BY created_at LIMIT 1;

IF v_course_id IS NULL THEN
  RAISE NOTICE 'Formation introuvable';
  RETURN;
END IF;

-- 3. Mettre à jour l'instructeur
UPDATE public.courses
SET instructor_id = v_instructor,
    is_published   = true
WHERE id = v_course_id;

-- 4. Récupérer les modules (dans l'ordre de position)
SELECT id INTO v_mod1 FROM public.modules WHERE course_id = v_course_id ORDER BY position LIMIT 1 OFFSET 0;
SELECT id INTO v_mod2 FROM public.modules WHERE course_id = v_course_id ORDER BY position LIMIT 1 OFFSET 1;
SELECT id INTO v_mod3 FROM public.modules WHERE course_id = v_course_id ORDER BY position LIMIT 1 OFFSET 2;
SELECT id INTO v_mod4 FROM public.modules WHERE course_id = v_course_id ORDER BY position LIMIT 1 OFFSET 3;
SELECT id INTO v_mod5 FROM public.modules WHERE course_id = v_course_id ORDER BY position LIMIT 1 OFFSET 4;
SELECT id INTO v_mod6 FROM public.modules WHERE course_id = v_course_id ORDER BY position LIMIT 1 OFFSET 5;

-- ────────────────────────────────────────────────────────────────
-- MODULE 1 : Comprendre l'entrepreneuriat africain
-- ────────────────────────────────────────────────────────────────
IF v_mod1 IS NOT NULL THEN
  DELETE FROM public.lessons WHERE module_id = v_mod1;

  INSERT INTO public.lessons (module_id, course_id, title, type, position, content, description, is_free_preview)
  VALUES
  (v_mod1, v_course_id,
   'Bienvenue : L''entrepreneuriat africain, une opportunité unique',
   'document', 1,
   E'# Bienvenue dans cette formation !\n\nL''Afrique est le continent le plus jeune du monde, avec plus de **60 % de la population âgée de moins de 25 ans**. Cette réalité démographique, combinée à une urbanisation galopante et à la digitalisation croissante, crée des opportunités d''affaires considérables.\n\n## Pourquoi entreprendre en Afrique ?\n\n- 🌍 **1,4 milliard de consommateurs** et un marché unique en pleine expansion\n- 📱 **Le mobile-first** : plus de 650 millions de smartphones, des solutions de paiement innovantes (Mobile Money)\n- 🏗️ **Des besoins non satisfaits** dans la santé, l''éducation, l''agriculture, l''énergie, la logistique\n- 💡 **Des niches inexploitées** que les grandes multinationales n''ont pas encore adressées\n- 🔗 **La Zone de Libre-Échange Continentale Africaine (ZLECAf)** ouvre un marché de 3 400 milliards USD\n\n## Ce que vous allez apprendre dans cette formation\n\nEn 6 modules, vous allez passer de l''**idée** à l''**entreprise fonctionnelle** :\n1. Comprendre l''écosystème entrepreneurial africain\n2. Trouver et valider votre idée de business\n3. Construire votre business model\n4. Financer votre projet\n5. Lancer et gérer votre entreprise\n6. Faire grandir votre activité\n\n> 💬 *"Le meilleur moment pour planter un arbre, c''était il y a 20 ans. Le deuxième meilleur moment, c''est maintenant."* — Proverbe chinois adapté à l''Afrique entrepreneuriale\n\nPrêt ? Allons-y ! 🚀',
   'Introduction à la formation et à l''écosystème entrepreneurial africain',
   true),

  (v_mod1, v_course_id,
   'L''écosystème des startups en Afrique : acteurs et tendances',
   'document', 2,
   E'# L''écosystème startup africain\n\n## Les hubs d''innovation majeurs\n\nL''Afrique compte aujourd''hui plus de **650 hubs technologiques actifs**. Les plus importants :\n\n| Hub | Pays | Spécialités |\n|-----|------|-------------|\n| Silicon Savannah (Nairobi) | Kenya | Fintech, Agritech |\n| Lagos Tech | Nigeria | Fintech, E-commerce |\n| Kigali Innovation City | Rwanda | Smart City, EdTech |\n| Abidjan Tech | Côte d''Ivoire | Mobile Money, Commerce |\n| Dakar FinTech | Sénégal | Fintech, Services |\n| Casablanca Finance City | Maroc | Finance, Offshore |\n\n## Les secteurs porteurs\n\n### 🏦 Fintech\nAvec plus de **350 millions d''adultes non bancarisés** en Afrique, la fintech explose. Orange Money, MTN Mobile Money, Wave (Sénégal) transforment les transferts d''argent.\n\n### 🌾 Agritech\nL''agriculture représente **23 % du PIB africain**. Des solutions comme Hello Tractor (Nigeria) ou Twiga Foods (Kenya) révolutionnent la chaîne de valeur agricole.\n\n### 🏥 Healthtech\nAccès limité aux soins → opportunité massive pour la télémédecine, les diagnostics mobiles, la livraison de médicaments.\n\n### 📚 EdTech\n72 millions d''enfants non scolarisés + besoin de formation professionnelle continue = marché EdTech en pleine ébullition.\n\n## Les investissements dans les startups africaines\n\nEn 2023, les startups africaines ont levé **5,4 milliards USD** (malgré le ralentissement mondial). Les pays les plus attractifs : Nigeria, Égypte, Kenya, Afrique du Sud, Côte d''Ivoire.\n\n## Les défis spécifiques à l''Afrique\n\n1. **Infrastructures** : électricité, internet, routes encore insuffisants\n2. **Accès au financement** : peu de capital-risque local\n3. **Réglementation** : environnement des affaires variable selon les pays\n4. **Talents** : compétences techniques en développement\n5. **Confiance** : fidéliser des clients habitués au cash\n\n> 🔑 **Clé de réussite** : Adapter vos solutions aux réalités locales (faible bande passante, utilisation USSD, paiement cash, langues locales)',
   'Panorama des secteurs porteurs, des hubs d''innovation et des investissements en Afrique',
   false),

  (v_mod1, v_course_id,
   'Le profil de l''entrepreneur africain qui réussit',
   'document', 3,
   E'# Les qualités de l''entrepreneur africain qui réussit\n\n## Ce qui différencie ceux qui réussissent\n\nAprès analyse de dizaines d''entrepreneurs africains à succès (Tidjane Thiam, Bethlehem Tilahun Alemu, Aliko Dangote, Fatoumata Bah-Diallo…), des points communs émergent :\n\n### 1. La résilience face à l''adversité\nL''environnement africain des affaires est exigeant : coupures d''électricité, bureaucratie, instabilité monétaire. Les entrepreneurs qui réussissent transforment ces contraintes en avantages compétitifs.\n\n**Exemple :** M-Pesa (Kenya) est né parce que les banques traditionnelles étaient inaccessibles. La contrainte est devenue une innovation mondiale.\n\n### 2. L''ancrage communautaire\nEn Afrique, le business est profondément social. Comprendre et servir sa communauté est une force, pas une faiblesse. Le concept de *ubuntu* (« Je suis parce que nous sommes ») s''applique au business.\n\n### 3. La frugalité et l''innovation contrainte\nFaire plus avec moins : l''entrepreneur africain excelle dans l''"appropriate technology"* — des solutions simples, robustes, bon marché, adaptées aux réalités locales.\n\n### 4. La capacité à naviguer dans l''informel\n60-80 % des économies africaines sont informelles. Savoir opérer dans cet espace, tout en construisant progressivement une structure formelle, est une compétence clé.\n\n## Auto-évaluation : Quel entrepreneur êtes-vous ?\n\nPosez-vous ces questions :\n- ✅ Avez-vous une tolérance élevée à l''ambiguité et à l''incertitude ?\n- ✅ Êtes-vous capable de vendre votre vision à des inconnus ?\n- ✅ Apprenez-vous vite de vos erreurs ?\n- ✅ Avez-vous un réseau sur lequel vous appuyer ?\n- ✅ Êtes-vous prêt à sacrifier du confort à court terme pour une vision à long terme ?\n\n## Les ressources à mobiliser\n\n- **Famille et diaspora** : premier capital et réseau\n- **Associations professionnelles** : CCI, CGECI (Côte d''Ivoire), CNES (Sénégal)…\n- **Incubateurs** : Orange Fab, CTIC Dakar, Jokkolabs, Seedstars Africa\n- **Programmes d''accompagnement** : Tony Elumelu Foundation (5 000 entrepreneurs/an, 5 000 USD de seed money)',
   'Traits, comportements et ressources des entrepreneurs africains qui réussissent',
   false);
END IF;

-- ────────────────────────────────────────────────────────────────
-- MODULE 2 : Trouver et valider votre idée de business
-- ────────────────────────────────────────────────────────────────
IF v_mod2 IS NOT NULL THEN
  DELETE FROM public.lessons WHERE module_id = v_mod2;

  INSERT INTO public.lessons (module_id, course_id, title, type, position, content, description, is_free_preview)
  VALUES
  (v_mod2, v_course_id,
   'Comment trouver une idée de business rentable',
   'document', 1,
   E'# Trouver votre idée de business\n\n## Les 5 sources d''idées entrepreneuriales\n\n### 1. 🔍 Identifier un problème non résolu\nLa méthode la plus efficace : **observez les frustrations autour de vous**.\n\n> *"Chaque problème est une opportunité déguisée"* — Paul Kagame\n\nExercice : Listez 10 choses qui vous énervent dans votre quotidien. Chacune peut être une business opportunity.\n\n**Exemples africains :**\n- Yassir (Algérie) → taxis peu fiables → application VTC\n- Jumia → e-commerce fragmenté → marketplace panafricaine\n- Flutterwave → paiements transfrontaliers complexes → gateway de paiement unifié\n\n### 2. 💡 Importer un modèle qui marche ailleurs\nAdaptez à l''Afrique ce qui fonctionne dans d''autres marchés.\n\n| Modèle étranger | Adaptation africaine |\n|----------------|---------------------|\n| Airbnb | Cheki (immobilier), Jumia House |\n| Uber | Yassir, InDriver, Heetch |\n| Amazon | Jumia, Kilimall |\n| Coursera | IBIG E-LEARNING 😉 |\n\n### 3. 🌾 Valoriser une ressource locale sous-exploitée\nL''Afrique regorge de ressources (agricoles, minières, culturelles) peu transformées localement.\n\n**Opportunités :** transformation du cacao en chocolat haut de gamme local, huile de karité premium, textiles kente ou bogolan pour l''export.\n\n### 4. 🔧 Résoudre un problème d''infrastructure\nÉlectricité, eau, logistique, déchets — chaque gap d''infrastructure est un marché.\n\n### 5. 🤝 Digitaliser un secteur traditionnel\nAgences de voyage, salons de coiffure, marchés de gros, artisans — beaucoup n''ont pas encore de présence digitale.\n\n## La matrice Passion × Compétences × Marché\n\nVotre idée idéale est à l''intersection de :\n- **Ce que vous aimez faire** (Passion)\n- **Ce pour quoi vous avez des compétences** (Expertise)\n- **Ce pour quoi les gens paient** (Marché)\n\n> Sans les 3 piliers, l''idée est fragile. Avec les 3, elle a toutes les chances de réussir.',
   'Méthodes et frameworks pour générer des idées de business à fort potentiel',
   false),

  (v_mod2, v_course_id,
   'Valider votre idée avant d''investir : le MVP africain',
   'document', 2,
   E'# Valider votre idée : ne pas brûler les étapes\n\n## Pourquoi la validation est cruciale\n\n**90 % des startups échouent.** La première cause : construire un produit que personne ne veut.\n\nLa validation vous permet de tester vos hypothèses **avant** d''investir du temps et de l''argent.\n\n## Le MVP (Minimum Viable Product) adapté à l''Afrique\n\nUn MVP est la version la plus simple de votre produit qui permet de tester vos hypothèses clés.\n\n### Types de MVP à faible coût\n\n**1. Le MVP "Concierge"** (100 % manuel)\nFaites manuellement ce que votre futur système automatisera.\n> *Exemple :* Avant de coder une app de livraison, livrez vous-même en moto pendant 2 semaines. Vous apprendrez plus qu''en 6 mois de développement.\n\n**2. Le MVP "Landing Page"**\nCréez une page web simple (Carrd, Notion, WordPress) qui décrit votre offre. Si les gens donnent leur email ou paient d''avance → validation.\n\n**3. Le MVP "WhatsApp Business"**\nEn Afrique, WhatsApp est le CRM des entrepreneurs. Vendez via WhatsApp avant de construire quoi que ce soit.\n> *Exemple :* 78 % des PME ivoiriennes utilisent WhatsApp pour vendre. Commencez là.\n\n**4. Le MVP "Bouche à Oreille"**\nVendez à 5-10 premiers clients via votre réseau. Si vous ne pouvez pas convaincre vos proches, le marché sera encore plus difficile.\n\n## Les 3 questions à valider\n\n1. **Le problème existe-t-il vraiment ?**\n   → Interviewez 20 personnes. Ont-elles ce problème ? Le jugent-elles important ?\n\n2. **Ma solution résout-elle ce problème ?**\n   → Faites tester votre prototype. Observez leur comportement, pas leurs paroles.\n\n3. **Les gens sont-ils prêts à payer ?**\n   → C''est LA question. "Je paierais" ≠ "Je paye maintenant". Demandez un pré-paiement, même symbolique.\n\n## Template d''entretien de validation (20 min)\n\n```\n1. Parlez-moi de votre journée type [contexte]\n2. Quel est le plus grand problème que vous rencontrez pour [domaine] ?\n3. Comment le gérez-vous aujourd''hui ?\n4. Avez-vous déjà essayé [solution existante] ? Pourquoi ça n''a pas marché ?\n5. Si vous aviez une baguette magique, quelle serait la solution idéale ?\n6. [Présentez votre idée] Qu''en pensez-vous ? Seriez-vous prêt à payer X pour ça ?\n```\n\n> 🎯 **Règle d''or :** Validez avec votre portefeuille de clients, pas avec votre famille. Vos proches vous diront que c''est "super" par affection.',
   'Méthodes de validation d''idée à faible coût adaptées au contexte africain',
   false),

  (v_mod2, v_course_id,
   'Étude de marché : connaître son client africain',
   'document', 3,
   E'# Étude de marché : comprendre votre client\n\n## Le profil de votre client idéal (Persona)\n\nAvant de vendre, sachez à QUI vous vendez.\n\n### Exemple de Persona pour une EdTech africaine\n\n**Nom fictif :** Aminata, 28 ans, Abidjan\n- **Situation :** Responsable RH dans une PME, licence en droit\n- **Revenus :** 350 000 FCFA/mois\n- **Objectif :** Progresser vers un poste de DRH, obtenir une certification reconnue\n- **Frustrations :** Formations trop chères (300 000 FCFA min), pas adaptées à son agenda chargé\n- **Digital :** Utilise WhatsApp, Facebook, TikTok. Smartphone Android. Connexion 4G parfois instable\n- **Mode de paiement :** Orange Money, parfois virement bancaire\n- **Décision d''achat :** Basée sur la confiance (recommandation d''un ami, avis en ligne, nom du formateur)\n\n## Méthodes d''étude de marché à coût zéro\n\n### 1. Groupes WhatsApp & Facebook\nIntégrez des groupes thématiques, observez les questions récurrentes.\n\n### 2. Google Trends (version africaine)\nComparez les volumes de recherche pour votre secteur en Côte d''Ivoire, Sénégal, Cameroun…\n\n### 3. Pages Facebook/Instagram de concurrents\nAnalysez leurs posts les plus commentés → ce qui préoccupe vos futurs clients.\n\n### 4. Marchés et terrains\nLa meilleure étude de marché reste d''aller dans les marchés, parler aux commerçants, observer les comportements.\n\n## Sizing du marché : TAM / SAM / SOM\n\n| Marché | Description | Exemple EdTech CI |\n|--------|-------------|-------------------|\n| **TAM** | Marché total adressable | 4M actifs urbains avec smartphone |\n| **SAM** | Marché ciblé | 500K intéressés par la formation pro |\n| **SOM** | Part réalistement capturable | 5 000 clients an 1 (1 % du SAM) |\n\n> 💡 Même 1 % d''un grand marché peut créer une entreprise rentable. Concentrez-vous sur votre niche avant d''attaquer le marché total.',
   'Construire le profil de votre client idéal et dimensionner votre marché',
   false);
END IF;

-- ────────────────────────────────────────────────────────────────
-- MODULE 3 : Construire votre business model
-- ────────────────────────────────────────────────────────────────
IF v_mod3 IS NOT NULL THEN
  DELETE FROM public.lessons WHERE module_id = v_mod3;

  INSERT INTO public.lessons (module_id, course_id, title, type, position, content, description, is_free_preview)
  VALUES
  (v_mod3, v_course_id,
   'Le Business Model Canvas adapté à l''Afrique',
   'document', 1,
   E'# Le Business Model Canvas\n\nLe **Business Model Canvas (BMC)** est l''outil le plus utilisé pour structurer un modèle économique. Il tient sur une page et couvre les 9 blocs d''une entreprise.\n\n## Les 9 blocs du BMC\n\n### 1. 👥 Segments de clients\nQui servez-vous ? Soyez précis :\n- B2C : particuliers (femmes entrepreneures, 25-35 ans, Abidjan)\n- B2B : entreprises (PME manufacturières, 10-50 employés)\n- B2G : gouvernements, ONG\n\n### 2. 💎 Proposition de valeur\nQu''apportez-vous de unique ? Résolvez-vous un problème ou satisfaisez-vous un besoin ?\n> *"Vous ne vendez pas un cours, vous vendez une promotion, un meilleur salaire, la fierté de votre famille."*\n\n### 3. 📣 Canaux\nComment atteignez-vous vos clients ?\n- En Afrique : **WhatsApp** (premier canal), radio communautaire, bouche-à-oreille, Facebook\n- Digital : SEO, Instagram, TikTok, influenceurs locaux\n\n### 4. 🤝 Relations clients\nComment fidélisez-vous ?\n- Groupes WhatsApp de suivi\n- Service client en langue locale\n- Programme de parrainage (très efficace en Afrique)\n\n### 5. 💰 Sources de revenus\n- Vente directe (one-shot)\n- Abonnement mensuel\n- Freemium → Premium\n- Commission / marketplace\n- Publicité\n\n### 6. 🔑 Ressources clés\nCe dont vous avez absolument besoin : talent, capital, technologie, réseau, licence\n\n### 7. ⚙️ Activités clés\nCe que vous faites mieux que les autres : développement produit, vente, logistique, contenu\n\n### 8. 🤝 Partenaires clés\nQui peut vous aider à réussir ? Fournisseurs, distributeurs, partenaires technologiques, investisseurs\n\n### 9. 💸 Structure de coûts\nQuels sont vos coûts fixes et variables ? Où pouvez-vous optimiser ?\n\n## Exemple : BMC d''une EdTech (comme IBIG)\n\n| Bloc | Contenu |\n|------|--------|\n| Clients | Professionnels 25-40 ans en Afrique francophone |\n| Valeur | Formations certifiantes, accessibles, payables en Mobile Money |\n| Canaux | WhatsApp, Facebook, Instagram, bouche-à-oreille |\n| Revenus | Abonnement mensuel + achat à la formation |\n| Ressources | Formateurs experts, plateforme tech, brand |\n| Coûts | Tech, formateurs, marketing, support |\n\n## Exercice pratique\nRemplissez votre propre BMC en 45 minutes avec ce template :\n1. Commencez par les **Clients** et la **Proposition de valeur**\n2. Puis les **Canaux** et **Relations**\n3. Enfin les **Revenus**, **Ressources**, **Activités**, **Partenaires**, **Coûts**',
   'Maîtriser le Business Model Canvas et l''adapter au contexte africain',
   false),

  (v_mod3, v_course_id,
   'Rédiger un plan d''affaires convaincant',
   'document', 2,
   E'# Le Plan d''Affaires (Business Plan)\n\n## À quoi sert un Business Plan ?\n\nUn business plan est nécessaire pour :\n- 🏦 **Convaincre une banque** de vous accorder un crédit\n- 💼 **Attirer des investisseurs** (angels, VCs, family office)\n- 🤝 **Convaincre des partenaires** stratégiques\n- 🧭 **Vous servir de boussole** dans l''exécution\n\n## Structure d''un Business Plan solide\n\n### Résumé exécutif (1-2 pages)\nC''est la partie la plus importante — c''est souvent la seule lue.\n- Votre entreprise en 3 phrases\n- Le problème que vous résolvez\n- Votre solution + avantage compétitif\n- Le marché ciblé et sa taille\n- Le modèle économique\n- Ce que vous demandez\n\n### Présentation de l''entreprise\n- Nom, forme juridique (SARL, SAS, EI…)\n- Date de création, localisation\n- Vision et mission\n\n### Analyse du marché\n- Taille et croissance du marché\n- Analyse concurrentielle\n- Votre positionnement\n\n### Stratégie commerciale\n- Politique de prix\n- Stratégie de distribution\n- Plan marketing (canaux, budget)\n\n### Plan opérationnel\n- Organisation et équipe\n- Processus de production/service\n- Besoins en infrastructure\n\n### Projections financières (3 ans)\n- Compte de résultat prévisionnel\n- Tableau de trésorerie\n- Bilan prévisionnel\n- Seuil de rentabilité (break-even)\n\n## Les erreurs à éviter\n\n❌ **Surestimer le marché** : "Il y a 1 milliard d''Africains, si on en capte 1%..." → 10 millions de clients, vraiment ?\n❌ **Ignorer la concurrence** : Il y a toujours une alternative (même le statu quo est un concurrent)\n❌ **Projections trop optimistes** : Les investisseurs appliquent un coefficient de 0,3 aux chiffres des fondateurs\n❌ **Négliger le plan de trésorerie** : Une entreprise profitable peut mourir d''un manque de cash\n\n## Outils gratuits\n- **Bpifrance** (France) : modèles de business plan en français\n- **BDC Canada** : templates adaptés aux francophones\n- **Google Docs** : suffisant pour un premier draft\n- **Canva** : pour un pitch deck professionnel',
   'Structure et rédaction d''un business plan convaincant pour investisseurs et banquiers',
   false),

  (v_mod3, v_course_id,
   'Fixer ses prix en Afrique : stratégies et psychologie',
   'document', 3,
   E'# La stratégie de prix en Afrique\n\n## Le défi du pricing en Afrique\n\nFixer le bon prix en Afrique est un exercice délicat :\n- Pouvoir d''achat très hétérogène selon les pays et catégories sociales\n- Concurrence de l''informel (souvent moins cher)\n- Sensibilité au prix élevée mais aussi recherche de qualité/prestige\n- Multiples devises et instabilité monétaire\n\n## Les 3 approches de pricing\n\n### 1. Cost-Plus (coût + marge)\n**Prix = Coût de revient + Marge souhaitée**\n\nSimple mais dangereux : vous risquez de vous sous-évaluer ou de ne pas être compétitif.\n\n### 2. Value-Based (par la valeur créée)\n**Prix = Fraction de la valeur que vous créez pour le client**\n\n> Si votre formation permet à quelqu''un d''obtenir une promotion de +100 000 FCFA/mois, vendre à 50 000 FCFA est raisonnable.\n\n### 3. Competitive Pricing (aligné sur la concurrence)\nPositionnez-vous par rapport aux alternatives : moins cher, pareil ou plus cher (premium).\n\n## Stratégies adaptées à l''Afrique\n\n### 🎯 Le "sachet model" (micro-dosage)\nDiviser le prix en petites unités accessibles.\n> *Exemples :* Paiement à la semaine plutôt qu''au mois, crédit de data par jour, mini-doses de produits\n\n### 📦 Le "bundle" (offre groupée)\nAssociez plusieurs produits/services pour augmenter la valeur perçue.\n> *Exemple EdTech :* Formation + certification + 3 mois de coaching = perçu comme une offre complète\n\n### 💳 Le paiement fractionné (3x sans frais)\nTrès efficace pour les produits >20 000 FCFA. Réduit la barrière d''entrée psychologique.\n\n### 🎁 Freemium → Premium\nOffrez un accès gratuit limité, puis convertissez avec des fonctionnalités premium.\n\n## La psychologie des prix en Afrique\n\n- **Le prix rond** (50 000 vs 49 900) : en Afrique, le prix rond est parfois perçu comme plus honnête\n- **L''effet de contraste** : proposez toujours 3 offres (basique, standard, premium) → les gens choisissent souvent le milieu\n- **Le prix de prestige** : dans certains secteurs (cosmétiques, formation executive), un prix élevé = signal de qualité\n- **La comparaison** : "Équivalent à un repas au restaurant" rend un prix abstrait concret',
   'Stratégies de pricing adaptées aux réalités économiques africaines',
   false);
END IF;

-- ────────────────────────────────────────────────────────────────
-- MODULE 4 : Financer votre projet en Afrique
-- ────────────────────────────────────────────────────────────────
IF v_mod4 IS NOT NULL THEN
  DELETE FROM public.lessons WHERE module_id = v_mod4;

  INSERT INTO public.lessons (module_id, course_id, title, type, position, content, description, is_free_preview)
  VALUES
  (v_mod4, v_course_id,
   'Les sources de financement disponibles en Afrique',
   'document', 1,
   E'# Financer son projet en Afrique\n\n## Le mythe du "pas de capital disponible"\n\nBeaucoup d''entrepreneurs africains croient qu''il n''y a pas d''argent pour financer leurs projets. **C''est faux.** Ce qui manque souvent, c''est la préparation et la structuration du dossier.\n\nVoici le panorama complet des sources de financement :\n\n## 1. 💰 L''autofinancement et les 3F\n\nLe point de départ pour la quasi-totalité des entrepreneurs :\n- **Propre épargne** : économies personnelles (recommandé : 6 mois de fonds de roulement)\n- **Family** : famille proche\n- **Friends** : amis et réseau de confiance\n- **Fools** : les "fous" qui croient en vous sans garanties\n\n> ⚠️ **Conseil :** Même avec famille et amis, formalisez par un contrat écrit. Cela évite les tensions futures.\n\n## 2. 🏦 Le financement bancaire\n\n**Banques classiques :**\n- Taux d''intérêt : 8-18 % en Afrique subsaharienne (vs 3-5 % en Europe)\n- Exigences : garanties immobilières, 2-3 ans d''historique financier\n- Réalité : très difficile pour les startups\n\n**Microfinance (IMF) :**\n- COOPEC, UNACOOPEC-CI, CMS Sénégal, FINCA, BNDA Mali\n- Montants : 100 000 à 10 000 000 FCFA\n- Plus accessible, mais taux élevés (15-30 %)\n\n## 3. 🌐 Les programmes de grants (dons sans remboursement)\n\n### Tony Elumelu Foundation\n- 5 000 USD de seed money + mentorat\n- 5 000 entrepreneurs par an\n- Candidature : janvier-mars chaque année\n- [tefconnect.com](https://tefconnect.com)\n\n### AWIEF (African Women Innovation & Entrepreneurship Forum)\n- Spécial femmes entrepreneures\n\n### Programme d''appui de l''UE\n- Divers fonds via les ambassades et délégations UE\n\n### Fonds nationaux\n- **FDFP** (Côte d''Ivoire) : formation et insertion professionnelle\n- **DER/FJ** (Sénégal) : Délégation à l''Entrepreneuriat Rapide des Femmes et des Jeunes\n- **FAIEJ** (Togo) : 50 000 à 10 000 000 FCFA\n\n## 4. 🚀 Le capital-risque (Venture Capital)\n\n**Fonds actifs en Afrique francophone :**\n- Orange Ventures (100 000 - 2M USD)\n- Partech Africa (500K - 10M USD)\n- Novastar Ventures\n- Oikocredit\n- AFIG Funds\n\n**Stade :** généralement à partir du seed, quand vous avez des revenus\n\n## 5. 👥 Le crowdfunding\n\n- **Ulule** : très actif en Afrique francophone (dons/contreparties)\n- **KivaZip** : microprêts communautaires\n- **Miimosa** : agritech et impact social\n- **Afrikwity** (Maroc) : equity crowdfunding\n\n## La règle des 3 mois\n\nQuelle que soit la source, prévoyez **3 mois de charges fixes** en trésorerie avant de lancer. Les revenus mettent toujours plus de temps à arriver que prévu.',
   'Panorama complet des sources de financement accessibles aux entrepreneurs africains',
   false),

  (v_mod4, v_course_id,
   'Convaincre les investisseurs : le pitch parfait',
   'document', 2,
   E'# Le Pitch : Convaincre en 3 minutes\n\n## Pourquoi le pitch est crucial\n\nUn investisseur reçoit des centaines de projets par mois. Vous avez **3 à 7 minutes** pour le convaincre de vous accorder une heure. Un pitch raté = une opportunité perdue.\n\n## La structure du pitch deck (10 slides)\n\n### Slide 1 : Le titre\nNom de l''entreprise + tagline en une phrase.\n> *"IBIG E-LEARNING — La formation professionnelle certifiante pour les talents africains"*\n\n### Slide 2 : Le problème\n- Décrivez le problème de façon viscérale\n- Utilisez des chiffres concrets\n- Racontez une histoire (storytelling)\n> *"65 % des entreprises africaines peinent à trouver des talents qualifiés, pendant que 200 millions de jeunes cherchent à se former..."*\n\n### Slide 3 : La solution\n- Votre solution en 2-3 points\n- Montrez une démo si possible\n- Soyez concret, pas technique\n\n### Slide 4 : La taille du marché\n- TAM / SAM / SOM clairement définis\n- Sources crédibles (Banque Mondiale, McKinsey Africa, GSMA)\n\n### Slide 5 : Le Business Model\n- Comment gagnez-vous de l''argent ?\n- Quels sont vos principales métriques (ARPU, CAC, LTV) ?\n\n### Slide 6 : La traction\n- Chiffres concrets : clients, revenus, croissance\n- Témoignages, partenariats, press\n- C''est le slide le plus important pour un investisseur\n\n### Slide 7 : La concurrence\n- Matrice compétitive honnête\n- Votre avantage concurrentiel durable\n\n### Slide 8 : L''équipe\n- Pourquoi VOUS êtes les mieux placés pour résoudre ce problème ?\n- Expériences pertinentes, complémentarité\n\n### Slide 9 : Projections financières\n- Revenus sur 3 ans\n- Chemin vers la rentabilité\n\n### Slide 10 : L''appel à l''action (Ask)\n- Montant recherché\n- Usage précis des fonds\n- Ce que vous offrez en échange (equity %, valorisation)\n\n## Conseils de présentation\n\n✅ **Parlez le premier**, n''attendez pas qu''on vous questionne\n✅ **Regardez dans les yeux**, pas vos slides\n✅ **Maîtrisez vos chiffres** : si vous hésitez, c''est rédhibitoire\n✅ **Anticipez les objections** : valorisation, concurrence, scalabilité\n✅ **Pratiquez** : faites votre pitch devant 10 personnes avant les vrais investisseurs\n\n## Les questions pièges et comment y répondre\n\n❓ *"Comment vous défendez-vous si Google lance la même chose ?"*\n→ *"Notre avantage est notre ancrage local et la relation de confiance avec nos clients. Google a raté l''Afrique plusieurs fois..."*\n\n❓ *"Pourquoi vous ?"*\n→ Montrez votre expérience terrain, votre réseau, votre capacité d''exécution',
   'Construire un pitch deck convaincant et maîtriser l''art de la présentation aux investisseurs',
   false);
END IF;

-- ────────────────────────────────────────────────────────────────
-- MODULE 5 : Lancer et gérer votre entreprise au quotidien
-- ────────────────────────────────────────────────────────────────
IF v_mod5 IS NOT NULL THEN
  DELETE FROM public.lessons WHERE module_id = v_mod5;

  INSERT INTO public.lessons (module_id, course_id, title, type, position, content, description, is_free_preview)
  VALUES
  (v_mod5, v_course_id,
   'Les démarches juridiques pour créer son entreprise',
   'document', 1,
   E'# Créer son entreprise légalement\n\n## Pourquoi se formaliser ?\n\nBeaucoup d''entrepreneurs africains hésitent à se formaliser, craignant les impôts et la bureaucratie. Pourtant, la formalisation ouvre des portes :\n\n- ✅ Accès aux marchés publics et appels d''offres\n- ✅ Crédibilité auprès des grandes entreprises (souvent obligatoire pour les B2B)\n- ✅ Accès au financement bancaire et aux investisseurs\n- ✅ Protection juridique de votre marque et de votre création\n- ✅ Possibilité de facturer et de déduire des charges\n\n## Les formes juridiques en Afrique francophone (OHADA)\n\nL''**OHADA** (Organisation pour l''Harmonisation en Afrique du Droit des Affaires) unifie le droit des affaires dans 17 pays africains (CI, SN, CM, ML, BF, TG, BJ, GN…).\n\n| Forme | Capital min. | Associés | Idéal pour |\n|-------|-------------|---------|------------|\n| **EI** (Entreprise Individuelle) | Aucun | 1 | Freelances, artisans |\n| **SARL** | 1 FCFA (OHADA 2014) | 1-100 | PME, startups |\n| **SA** | 10M FCFA | 1+ | Grandes entreprises |\n| **SAS** | 1 FCFA | 1+ | Startups tech (flexible) |\n| **GIE** | Aucun | 2+ | Groupements professionnels |\n\n> 💡 Pour une startup, la **SARL ou SAS** est le choix idéal : capital minimal, flexibilité, protection du patrimoine personnel.\n\n## Étapes de création (exemple Côte d''Ivoire)\n\n1. **Choisir le nom** → Vérification disponibilité au RCCM\n2. **Rédiger les statuts** → Notaire ou avocat (coût : 50 000-200 000 FCFA)\n3. **Déposer le capital** → Compte bloqué en banque\n4. **S''immatriculer** → CEPICI (Centre de Promotion des Investissements en Côte d''Ivoire)\n5. **Obtenir le RCCM** → Registre du Commerce\n6. **Obtenir le NIF** → Numéro d''Identification Fiscale\n7. **Ouvrir un compte professionnel** → Compte bancaire au nom de l''entreprise\n\n**Durée totale :** 24-72h au CEPICI (guichet unique)\n**Coût total :** 150 000 - 400 000 FCFA\n\n## La protection de votre propriété intellectuelle\n\n- **Marque** : Déposez votre nom/logo à l''OAPI (Organisation Africaine de la Propriété Intellectuelle) → protection dans 17 pays, coût ≈ 100 000 FCFA\n- **Code source / contenus** : protégés automatiquement par le droit d''auteur\n- **Brevet** : pour les inventions techniques (procédure longue et coûteuse)',
   'Créer légalement son entreprise en Afrique (OHADA, formalités, protection IP)',
   false),

  (v_mod5, v_course_id,
   'Vendre et acquérir ses premiers clients en Afrique',
   'document', 2,
   E'# Acquérir vos premiers clients\n\n## La vérité sur la vente en Afrique\n\n> *"En Afrique, on n''achète pas un produit. On achète une personne."*\n\nLa confiance est la monnaie d''échange principale. Votre réputation personnelle précède votre produit.\n\n## Les canaux d''acquisition les plus efficaces\n\n### 🟢 WhatsApp Business (n°1 en Afrique)\n- 2 milliards d''utilisateurs dont ~500M en Afrique\n- Ouvrir un profil WhatsApp Business : **gratuit**\n- Fonctionnalités : catalogue de produits, réponses automatiques, étiquettes\n- **Stratégie :** Construisez un groupe WhatsApp de 100-250 clients potentiels et nurturez-les avec du contenu de valeur avant de vendre\n\n### 📘 Facebook & Instagram\n- Facebook reste dominant en Afrique francophone (vs Instagram)\n- **Facebook Ads** : très ciblé, coût par clic 0,05-0,20 USD (moins cher qu''en Europe)\n- **Pages Business** : diffusez du contenu régulièrement (3-5x/semaine)\n- **Lives** : excellent pour l''engagement (format préféré des algorithmes africains)\n\n### 🎙️ La radio et la TV communautaire\nNégligée par les entrepreneurs tech mais redoutablement efficace pour atteindre les masses.\n\n### 🤝 Le réseau et le bouche-à-oreille\nEn Afrique, une recommandation d''un ami vaut 10 publicités. Votre premier objectif : **10 clients tellement satisfaits qu''ils parlent de vous spontanément**.\n\n## La méthode AIDA adaptée\n\n| Étape | Action concrète | Outil africain |\n|-------|----------------|----------------|\n| **Attention** | Contenu viral, storytelling | TikTok, Facebook Live |\n| **Intérêt** | Contenu de valeur gratuit | WhatsApp, Podcast |\n| **Désir** | Témoignages clients, démo | WhatsApp, Stories |\n| **Action** | Appel, CinetPay, Wave | WhatsApp CTA |\n\n## Votre script de vente en 5 étapes\n\n1. **Brisez la glace** : parlez de lui/elle, de son contexte\n2. **Identifiez le problème** : "Qu''est-ce qui vous empêche d''avancer sur X ?"\n3. **Amplifiez la douleur** : "Et si ça continue, qu''est-ce qui se passe ?"\n4. **Présentez la solution** : "Voici comment nous aidons des gens comme vous..."\n5. **Closing** : "À quel moment souhaitez-vous commencer ?" (question alternative)\n\n## La fidélisation : garder ses clients\n\n- Un client fidèle coûte **5x moins cher** qu''un nouveau client\n- **NPS** (Net Promoter Score) : "De 0 à 10, recommanderiez-vous notre service ?"\n- Programme de parrainage : offrez une récompense pour chaque nouveau client amené\n- Suivi post-vente WhatsApp : message personnalisé 1 semaine après l''achat',
   'Stratégies d''acquisition client et techniques de vente adaptées au marché africain',
   false),

  (v_mod5, v_course_id,
   'Gérer sa trésorerie et ses finances au quotidien',
   'document', 3,
   E'# Gestion financière de votre entreprise\n\n## La règle n°1 : Séparez finances perso et pro\n\nC''est l''erreur la plus fréquente des entrepreneurs africains : tout mélanger. Dès le premier jour :\n1. **Ouvrez un compte bancaire professionnel** séparé\n2. **Versez-vous un salaire fixe** (même modeste)\n3. **Ne pichez jamais dans la caisse** sans tracer l''opération\n\n## Les 4 documents financiers indispensables\n\n### 1. Le tableau de trésorerie (Cash Flow)\nLe nerf de la guerre. Suivez chaque semaine :\n- Encaissements (ce qui rentre)\n- Décaissements (ce qui sort)\n- Solde disponible\n\n```\nSemaine | Encaissements | Décaissements | Solde\n01/10   | 500 000       | 350 000       | 150 000\n08/10   | 200 000       | 400 000       | -50 000 ⚠️\n```\n\n### 2. Le compte de résultat\nMensuel : Revenus - Charges = Résultat net\n\n### 3. Le bilan\nAnnuel : Actif (ce que vous possédez) = Passif (ce que vous devez)\n\n### 4. Le budget prévisionnel\nFixez des objectifs mensuels et comparez avec le réel.\n\n## Outils de gestion à bas coût\n\n| Outil | Coût | Usage |\n|-------|------|-------|\n| Google Sheets | Gratuit | Trésorerie, budget |\n| Wave Accounting | Gratuit | Comptabilité simple |\n| Sage | 15 000 FCFA/mois | PME structurées |\n| Quickbooks | 20 000 FCFA/mois | PME avec comptable |\n\n## Maîtriser son BFR (Besoin en Fonds de Roulement)\n\nLe BFR = L''argent dont vous avez besoin pour fonctionner **entre le moment où vous payez vos fournisseurs et le moment où vos clients vous paient**.\n\n**Réduire son BFR :**\n- Négociez des délais de paiement avec vos fournisseurs\n- Demandez des acomptes à vos clients\n- Réduisez vos stocks\n- Acceptez les paiements mobiles (reçu instantané)\n\n## Les pièges fiscaux à éviter\n\n⚠️ **Ne pas déclarer ses revenus** → risque de redressement fiscal\n⚠️ **Oublier la TVA** → collectée pour le compte de l''État, non à garder\n⚠️ **Ne pas conserver les pièces comptables** → gardez TOUT pendant 10 ans\n\n> 💡 **Conseil :** Externalisez votre comptabilité à un cabinet dès le début (30 000-80 000 FCFA/mois). C''est un investissement, pas une dépense.',
   'Gérer sa trésorerie, ses finances et ses obligations fiscales en entreprise',
   false);
END IF;

-- ────────────────────────────────────────────────────────────────
-- MODULE 6 : Développer et faire grandir votre activité
-- ────────────────────────────────────────────────────────────────
IF v_mod6 IS NOT NULL THEN
  DELETE FROM public.lessons WHERE module_id = v_mod6;

  INSERT INTO public.lessons (module_id, course_id, title, type, position, content, description, is_free_preview)
  VALUES
  (v_mod6, v_course_id,
   'Scaler votre business : de la startup à la PME',
   'document', 1,
   E'# Faire grandir votre entreprise\n\n## Le passage du stade "solopreneur" à la PME\n\nBeaucoup d''entrepreneurs africains excellent à lancer, mais peinent à scaler. La raison : **ce qui vous a amené au succès initial ne vous amènera pas au niveau suivant**.\n\n## Les 4 leviers de croissance\n\n### 1. 📈 Acquérir plus de clients\n- Augmenter le budget marketing\n- Ouvrir de nouveaux canaux (TikTok, podcasts, B2B)\n- Partenariats de distribution\n\n### 2. 💰 Augmenter le panier moyen\n- Upsell : proposer une version premium\n- Cross-sell : vendre des produits complémentaires\n- Packs et bundles\n\n### 3. 🔄 Fidéliser et faire revenir\n- Abonnements récurrents (MRR)\n- Programme de fidélité\n- Communauté engagée\n\n### 4. 🌍 Expansion géographique\n- Reproduire le modèle dans d''autres villes / pays\n- Franchises ou agents locaux\n- E-commerce transfrontalier (ZLECAf)\n\n## Quand et comment recruter ?\n\n### Les 3 premiers recrutements critiques\n\n1. **Le commercial** : dès que vous avez un produit validé → il génère du revenu\n2. **L''opérationnel** : quand vous passez plus de temps à opérer qu''à développer\n3. **Le technique / support** : quand la qualité commence à baisser avec la croissance\n\n### Recruter sans se ruiner\n\n- **Stagiaires** de grandes écoles (INPHB, 2iE, ISTIC, ESP Dakar)\n- **Freelances** sur Upwork, Toptal, Afrikatek\n- **Commissions** sur les ventes pour les commerciaux (sans salaire fixe au début)\n- **Equity** pour les profils techniques clés\n\n## Les systèmes et processus : clé du scaling\n\n> *"Si votre entreprise ne peut pas fonctionner 2 semaines sans vous, vous n''avez pas une entreprise, vous avez un emploi."* — Michael Gerber, The E-Myth\n\n**Documentez tout :**\n- Processus de vente (script + CRM)\n- Onboarding client\n- Gestion des réclamations\n- Reporting financier\n\n**Outils de collaboration :**\n- Notion / Trello : gestion de projets\n- Slack / WhatsApp Teams : communication interne\n- Google Workspace : documents collaboratifs\n- Zoho CRM (version gratuite) : suivi client',
   'Stratégies et leviers pour faire passer votre entreprise au niveau supérieur',
   false),

  (v_mod6, v_course_id,
   'S''internationaliser : conquérir l''Afrique et au-delà',
   'document', 2,
   E'# S''internationaliser en Afrique\n\n## Pourquoi penser régional dès le départ ?\n\nL''Afrique francophone représente **17 pays, 350 millions d''habitants** avec une langue commune et (depuis 2021) une zone de libre-échange : **la ZLECAf**.\n\nUn produit qui fonctionne en Côte d''Ivoire peut être répliqué au Sénégal, au Cameroun, au Mali sans changer la langue. C''est un avantage unique.\n\n## Les étapes de l''internationalisation\n\n### Étape 1 : Dominer votre marché local\nAvant d''aller ailleurs, soyez **le leader incontesté** chez vous. Une position locale forte = levier de négociation à l''international.\n\n### Étape 2 : Choisir le 2ème marché\nCritères de sélection :\n- Taille du marché\n- Proximité culturelle\n- Facilité d''entrée (réglementation, logistique)\n- Présence de votre réseau\n- Similitude avec le marché d''origine\n\n**Matrice de décision :**\n| Marché | Taille | Facilité | Similarité | Score |\n|--------|--------|----------|------------|-------|\n| Sénégal (depuis CI) | 8 | 9 | 9 | 26/30 |\n| Nigeria (depuis CI) | 10 | 5 | 6 | 21/30 |\n| Ghana (depuis CI) | 7 | 7 | 5 | 19/30 |\n\n### Étape 3 : Trouver un partenaire local\nNe jamais aller seul sur un nouveau marché africain :\n- Distributeur ou agent local\n- JV (joint-venture) avec une entreprise locale\n- Franchise locale\n\n### Étape 4 : Adapter (localiser) votre offre\n- Langue : traduction (français → anglais si Nigeria/Ghana)\n- Prix : adapter au pouvoir d''achat local\n- Paiement : intégrer les solutions locales (M-Pesa au Kenya, EcoCash au Zimbabwe)\n- Marketing : personnages, références culturelles locales\n\n## La diaspora : votre pont vers d''autres marchés\n\nLa diaspora africaine (40M+ personnes en Europe, Amérique, Asie) est souvent ignorée comme marché. Pourtant :\n- Revenus plus élevés\n- Attachement fort à la culture d''origine\n- Ambassadeurs naturels dans leurs pays d''accueil\n\n## Ressources pour l''internationalisation\n\n- **CCI (Chambres de Commerce)** : réseaux d''affaires régionaux\n- **ONUDI** (Programme d''investissement Afrique-Afrique)\n- **Afreximbank** : financement du commerce intra-africain\n- **Africa CEO Forum** : réseau des top dirigeants africains',
   'Stratégies d''expansion régionale et panafricaine pour les entrepreneurs ambitieux',
   false),

  (v_mod6, v_course_id,
   'Conclusion : Votre feuille de route entrepreneuriale',
   'document', 3,
   E'# Votre feuille de route : les 100 premiers jours\n\n## Félicitations ! 🎉\n\nVous avez parcouru l''ensemble de cette formation. Vous avez maintenant les outils, les connaissances et les frameworks pour lancer et développer votre entreprise en Afrique.\n\nMaintenant, **l''action est la seule chose qui compte**.\n\n## Votre plan d''action en 100 jours\n\n### Jours 1-30 : Valider\n\n- [ ] Définir clairement votre idée (une phrase, un problème, une solution)\n- [ ] Interviewer 20 clients potentiels\n- [ ] Créer votre Persona client\n- [ ] Lancer un MVP (WhatsApp, landing page ou service manuel)\n- [ ] Acquérir vos 5 premiers clients payants\n- [ ] Mesurer leur satisfaction (NPS)\n\n### Jours 31-60 : Structurer\n\n- [ ] Remplir votre Business Model Canvas\n- [ ] Créer votre entreprise légalement (RCCM, NIF)\n- [ ] Ouvrir un compte professionnel\n- [ ] Mettre en place un tableau de trésorerie\n- [ ] Constituer un premier stock / portefeuille de clients (30 clients)\n- [ ] Créer votre identité visuelle (logo, couleurs, charte)\n\n### Jours 61-100 : Accélérer\n\n- [ ] Lancer votre premier canal marketing (Facebook Ads ou WhatsApp)\n- [ ] Recruter votre premier collaborateur ou stage\n- [ ] Documenter vos 3 processus clés\n- [ ] Atteindre votre premier seuil de rentabilité\n- [ ] Candidater à un programme d''accompagnement (TEF, incubateur local)\n- [ ] Pitcher à 3 investisseurs potentiels\n\n## Les ressources pour aller plus loin\n\n### Livres incontournables\n- *Zero to One* — Peter Thiel\n- *The Lean Startup* — Eric Ries\n- *Purple Cow* — Seth Godin\n- *L''Art de vendre* — Zig Ziglar\n- *Venture in Africa* — divers auteurs\n\n### Podcasts africains\n- **How To Africa** (anglais)\n- **African Tech Roundup**\n- **Afrique Entrepreneurs** (français)\n- **Decryptage Eco** (Côte d''Ivoire)\n\n### Programmes d''accompagnement\n- Tony Elumelu Foundation (5 000 USD grants)\n- Village Capital Africa\n- Seedstars Africa\n- Orange Fab (spécial tech)\n- MEST Africa\n\n## Un dernier message de Patrice Kouakou\n\n> *L''entrepreneuriat africain n''est pas un sprint, c''est un marathon. Les obstacles que vous rencontrerez — le manque de financement, la bureaucratie, la concurrence — sont exactement les mêmes que ceux qu''ont surmontés tous ceux qui ont réussi avant vous.*\n>\n> *La différence entre ceux qui réussissent et ceux qui abandonnent ? Ils ont continué quand les autres ont arrêté.*\n>\n> *Africa is rising — et vous en faites partie. Bonne chance ! 🌍*\n\n---\n\n**Complétez cette formation pour obtenir votre certificat IBIG E-LEARNING.** Partagez-le sur LinkedIn pour valoriser votre parcours auprès de vos contacts professionnels.',
   'Plan d''action en 100 jours et ressources pour démarrer votre aventure entrepreneuriale',
   false);
END IF;

RAISE NOTICE 'Seed terminé avec succès. Formateur ID : %, Course ID : %', v_instructor, v_course_id;

END $$;

