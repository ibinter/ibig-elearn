-- Migration 019 : Correction contenu modules 2-6 + instructeur
-- À appliquer dans le SQL Editor Supabase

DO $$
DECLARE
  v_course_id uuid;
  v_instructor uuid;
  v_module_ids uuid[];
BEGIN

-- 1. Trouver Patrice Kouakou
SELECT id INTO v_instructor
FROM public.profiles
WHERE full_name ILIKE '%patrice%kouakou%'
   OR email ILIKE '%patriceky%'
ORDER BY created_at LIMIT 1;

-- 2. Trouver la formation
SELECT id INTO v_course_id
FROM public.courses
WHERE title ILIKE '%Entreprendre Efficacement%'
ORDER BY created_at LIMIT 1;

IF v_course_id IS NULL THEN
  RAISE NOTICE 'Formation introuvable';
  RETURN;
END IF;

-- Mettre à jour l'instructeur
IF v_instructor IS NOT NULL THEN
  UPDATE public.courses
  SET instructor_id = v_instructor, is_published = true
  WHERE id = v_course_id;
  RAISE NOTICE 'Instructeur mis à jour : %', v_instructor;
END IF;

-- 3. Récupérer les modules dans un tableau trié
SELECT ARRAY_AGG(id ORDER BY position)
INTO v_module_ids
FROM public.modules
WHERE course_id = v_course_id;

RAISE NOTICE 'Modules trouvés : %', array_length(v_module_ids, 1);

-- ────────────────────────────────────────────────────────────
-- MODULE 2 : Trouver et valider votre idée de business
-- ────────────────────────────────────────────────────────────
IF array_length(v_module_ids, 1) >= 2 THEN
  DELETE FROM public.lessons WHERE module_id = v_module_ids[2];

  INSERT INTO public.lessons (module_id, course_id, title, type, position, content, is_free_preview)
  VALUES
  (v_module_ids[2], v_course_id,
   'Comment trouver une idée de business rentable',
   'document', 1,
   E'# Trouver votre idée de business\n\n## Les 5 sources d''idées entrepreneuriales\n\n### 1. 🔍 Identifier un problème non résolu\nLa méthode la plus efficace : **observez les frustrations autour de vous**.\n\nExercice : Listez 10 choses qui vous énervent dans votre quotidien. Chacune peut être une business opportunity.\n\n**Exemples africains :**\n- Yassir (Algérie) → taxis peu fiables → application VTC\n- Jumia → e-commerce fragmenté → marketplace panafricaine\n- Flutterwave → paiements complexes → gateway de paiement unifié\n\n### 2. 💡 Importer un modèle qui marche ailleurs\n\n| Modèle étranger | Adaptation africaine |\n|----------------|---------------------|\n| Airbnb | Jumia House |\n| Uber | Yassir, Heetch |\n| Coursera | IBIG E-LEARNING 😉 |\n\n### 3. 🌾 Valoriser une ressource locale sous-exploitée\nCacao, karité, textiles traditionnels — l''Afrique regorge de ressources peu transformées localement.\n\n### 4. 🔧 Résoudre un problème d''infrastructure\nÉlectricité, eau, logistique, déchets — chaque gap est un marché.\n\n### 5. 🤝 Digitaliser un secteur traditionnel\nAgences de voyage, salons, marchés de gros, artisans — peu ont une présence digitale.\n\n## La matrice Passion × Compétences × Marché\n\nVotre idée idéale est à l''intersection de :\n- **Ce que vous aimez faire** (Passion)\n- **Ce pour quoi vous avez des compétences** (Expertise)\n- **Ce pour quoi les gens paient** (Marché)\n\n> Sans les 3 piliers, l''idée est fragile. Avec les 3, elle a toutes les chances de réussir.',
   false),

  (v_module_ids[2], v_course_id,
   'Valider votre idée avant d''investir : le MVP africain',
   'document', 2,
   E'# Valider votre idée : ne pas brûler les étapes\n\n## Pourquoi la validation est cruciale\n\n**90 % des startups échouent.** Première cause : construire un produit que personne ne veut.\n\n## Le MVP adapté à l''Afrique\n\n### 1. Le MVP "Concierge" (100 % manuel)\nFaites manuellement ce que votre futur système automatisera.\n> Avant de coder une app de livraison, livrez vous-même en moto 2 semaines. Vous apprendrez plus qu''en 6 mois de dev.\n\n### 2. Le MVP "WhatsApp Business"\n78 % des PME ivoiriennes utilisent WhatsApp pour vendre. Commencez là avant de construire quoi que ce soit.\n\n### 3. Le MVP "Landing Page"\nCréez une page simple (Carrd, Notion). Si les gens donnent leur email ou paient d''avance → validation.\n\n## Les 3 questions à valider\n\n1. **Le problème existe-t-il vraiment ?** → Interviewez 20 personnes\n2. **Ma solution résout-elle ce problème ?** → Faites tester votre prototype\n3. **Les gens sont-ils prêts à payer ?** → Demandez un pré-paiement, même symbolique\n\n## Template d''entretien (20 min)\n\n```\n1. Parlez-moi de votre journée type\n2. Quel est le plus grand problème pour [domaine] ?\n3. Comment le gérez-vous aujourd''hui ?\n4. Avez-vous essayé [solution existante] ?\n5. Seriez-vous prêt à payer X pour ma solution ?\n```\n\n> 🎯 **Règle d''or :** Validez avec vos clients cibles, pas avec votre famille.',
   false),

  (v_module_ids[2], v_course_id,
   'Étude de marché : connaître son client africain',
   'document', 3,
   E'# Étude de marché : comprendre votre client\n\n## Le profil de votre client idéal (Persona)\n\n**Exemple : Aminata, 28 ans, Abidjan**\n- Responsable RH dans une PME, licence en droit\n- Revenus : 350 000 FCFA/mois\n- Objectif : Progresser vers DRH, obtenir une certification\n- Frustrations : Formations trop chères, pas adaptées à son agenda\n- Digital : WhatsApp, Facebook, TikTok. Android, 4G instable\n- Paiement : Orange Money\n- Décision d''achat : recommandation d''ami ou avis en ligne\n\n## Méthodes à coût zéro\n\n- **Groupes WhatsApp & Facebook** : observez les questions récurrentes\n- **Google Trends** : volumes de recherche en Côte d''Ivoire, Sénégal, Cameroun\n- **Pages des concurrents** : posts les plus commentés = préoccupations des clients\n- **Terrain** : marchés, commerçants, observation directe\n\n## Sizing : TAM / SAM / SOM\n\n| Marché | Description | Exemple EdTech CI |\n|--------|-------------|-------------------|\n| **TAM** | Marché total | 4M actifs urbains avec smartphone |\n| **SAM** | Marché ciblé | 500K intéressés formation pro |\n| **SOM** | Part capturable | 5 000 clients an 1 (1 % du SAM) |\n\n> 💡 Même 1 % d''un grand marché peut créer une entreprise rentable.',
   false);
END IF;

-- ────────────────────────────────────────────────────────────
-- MODULE 3 : Construire votre business model
-- ────────────────────────────────────────────────────────────
IF array_length(v_module_ids, 1) >= 3 THEN
  DELETE FROM public.lessons WHERE module_id = v_module_ids[3];

  INSERT INTO public.lessons (module_id, course_id, title, type, position, content, is_free_preview)
  VALUES
  (v_module_ids[3], v_course_id,
   'Le Business Model Canvas adapté à l''Afrique',
   'document', 1,
   E'# Le Business Model Canvas\n\nLe **BMC** tient sur une page et couvre les 9 blocs d''une entreprise.\n\n## Les 9 blocs\n\n**1. 👥 Segments de clients** — Qui servez-vous ? B2C, B2B, B2G ?\n\n**2. 💎 Proposition de valeur** — Quel problème résolvez-vous ?\n> *"Vous ne vendez pas un cours, vous vendez une promotion, un meilleur salaire, la fierté de votre famille."*\n\n**3. 📣 Canaux** — En Afrique : WhatsApp (n°1), radio, bouche-à-oreille, Facebook\n\n**4. 🤝 Relations clients** — Groupes WhatsApp, service en langue locale, parrainage\n\n**5. 💰 Sources de revenus** — Vente directe, abonnement, freemium, commission\n\n**6. 🔑 Ressources clés** — Talent, capital, technologie, réseau\n\n**7. ⚙️ Activités clés** — Ce que vous faites mieux que les autres\n\n**8. 🤝 Partenaires clés** — Fournisseurs, distributeurs, investisseurs\n\n**9. 💸 Structure de coûts** — Coûts fixes et variables\n\n## Exemple : BMC d''une EdTech (IBIG)\n\n| Bloc | Contenu |\n|------|--------|\n| Clients | Professionnels 25-40 ans Afrique francophone |\n| Valeur | Formations certifiantes, accessibles, Mobile Money |\n| Canaux | WhatsApp, Facebook, bouche-à-oreille |\n| Revenus | Abonnement + achat à la formation |\n| Coûts | Tech, formateurs, marketing, support |\n\n## Exercice\nRemplissez votre BMC en 45 min — commencez par Clients + Proposition de valeur.',
   false),

  (v_module_ids[3], v_course_id,
   'Rédiger un plan d''affaires convaincant',
   'document', 2,
   E'# Le Plan d''Affaires (Business Plan)\n\n## À quoi sert un Business Plan ?\n\n- 🏦 Convaincre une banque d''accorder un crédit\n- 💼 Attirer des investisseurs\n- 🤝 Convaincre des partenaires stratégiques\n- 🧭 Vous servir de boussole dans l''exécution\n\n## Structure d''un Business Plan solide\n\n### Résumé exécutif (1-2 pages)\nC''est la partie la plus importante — souvent la seule lue.\n- Votre entreprise en 3 phrases\n- Le problème + votre solution unique\n- Le marché ciblé et sa taille\n- Ce que vous demandez (montant, usage)\n\n### Analyse du marché\n- Taille et croissance\n- Analyse concurrentielle\n- Votre positionnement\n\n### Stratégie commerciale\n- Politique de prix\n- Plan marketing (canaux, budget)\n\n### Projections financières (3 ans)\n- Compte de résultat prévisionnel\n- Tableau de trésorerie\n- Seuil de rentabilité (break-even)\n\n## Les erreurs à éviter\n\n❌ **Surestimer le marché** : "1 milliard d''Africains, si on capte 1%..." → vraiment ?\n❌ **Ignorer la concurrence** : il y a toujours une alternative (même le statu quo)\n❌ **Projections trop optimistes** : les investisseurs multiplient par 0,3\n❌ **Négliger la trésorerie** : une entreprise profitable peut mourir d''un manque de cash',
   false),

  (v_module_ids[3], v_course_id,
   'Fixer ses prix en Afrique : stratégies et psychologie',
   'document', 3,
   E'# La stratégie de prix en Afrique\n\n## Les 3 approches\n\n**1. Cost-Plus** : Prix = Coût + Marge. Simple mais risqué — vous pouvez vous sous-évaluer.\n\n**2. Value-Based** (recommandé) : Prix = Fraction de la valeur créée\n> Si votre formation permet +100 000 FCFA/mois de salaire, 50 000 FCFA est raisonnable.\n\n**3. Competitive Pricing** : Aligné sur la concurrence — en dessous, au même niveau, ou premium.\n\n## Stratégies adaptées à l''Afrique\n\n### 🎯 Le "sachet model"\nDivisez le prix en petites unités : paiement hebdomadaire, crédit data par jour.\n\n### 💳 Le paiement fractionné (3x sans frais)\nTrès efficace pour les produits >20 000 FCFA. Réduit la barrière psychologique.\n\n### 🎁 Freemium → Premium\nAccès gratuit limité, conversion avec fonctionnalités premium.\n\n## Psychologie des prix\n\n- **Effet de contraste** : proposez 3 offres (basique/standard/premium) → les gens choisissent le milieu\n- **Prix de prestige** : dans certains secteurs, un prix élevé = signal de qualité\n- **Comparaison concrète** : "Équivalent à un repas au restaurant" rend un prix abstrait accessible',
   false);
END IF;

-- ────────────────────────────────────────────────────────────
-- MODULE 4 : Financer votre projet en Afrique
-- ────────────────────────────────────────────────────────────
IF array_length(v_module_ids, 1) >= 4 THEN
  DELETE FROM public.lessons WHERE module_id = v_module_ids[4];

  INSERT INTO public.lessons (module_id, course_id, title, type, position, content, is_free_preview)
  VALUES
  (v_module_ids[4], v_course_id,
   'Les sources de financement disponibles en Afrique',
   'document', 1,
   E'# Financer son projet en Afrique\n\nBeaucoup pensent qu''il n''y a pas de capital disponible. **C''est faux.** Ce qui manque souvent, c''est la préparation du dossier.\n\n## 1. 💰 Les 3F (Family, Friends, Fools)\nPremier capital pour la quasi-totalité des entrepreneurs. Même avec proches, formalisez par un contrat écrit.\n\n## 2. 🌐 Les grants (dons sans remboursement)\n\n**Tony Elumelu Foundation**\n- 5 000 USD de seed money + mentorat\n- 5 000 entrepreneurs/an, candidature janvier-mars\n\n**Fonds nationaux**\n- FDFP (Côte d''Ivoire)\n- DER/FJ (Sénégal) : Délégation à l''Entrepreneuriat Rapide\n- FAIEJ (Togo) : 50 000 à 10M FCFA\n\n## 3. 🏦 Microfinance\nCOOPEC, UNACOOPEC-CI, CMS Sénégal. Montants jusqu''à 10M FCFA, taux 15-30 %.\n\n## 4. 🚀 Capital-risque\n- Orange Ventures (100K - 2M USD)\n- Partech Africa (500K - 10M USD)\n- Novastar Ventures\n\n## 5. 👥 Crowdfunding\n- Ulule : très actif en Afrique francophone\n- KivaZip : microprêts communautaires\n\n## La règle des 3 mois\nPrévoyez **3 mois de charges fixes** en trésorerie avant de lancer. Les revenus arrivent toujours plus tard que prévu.',
   false),

  (v_module_ids[4], v_course_id,
   'Convaincre les investisseurs : le pitch parfait',
   'document', 2,
   E'# Le Pitch : Convaincre en 3 minutes\n\nUn investisseur reçoit des centaines de projets par mois. Vous avez 3-7 minutes pour le convaincre de vous accorder une heure.\n\n## La structure du pitch deck (10 slides)\n\n**1. Titre** — Nom + tagline en une phrase\n\n**2. Le problème** — Décrivez viscéralement, avec chiffres concrets et storytelling\n\n**3. La solution** — En 2-3 points clairs, démo si possible\n\n**4. Taille du marché** — TAM / SAM / SOM avec sources crédibles\n\n**5. Business Model** — Comment gagnez-vous de l''argent ? ARPU, CAC, LTV\n\n**6. La traction ⭐** — Le slide le plus important : clients, revenus, croissance, témoignages\n\n**7. Concurrence** — Matrice honnête + votre avantage durable\n\n**8. L''équipe** — Pourquoi VOUS êtes les mieux placés ?\n\n**9. Projections 3 ans**\n\n**10. L''appel à l''action** — Montant, usage précis, ce que vous offrez en retour\n\n## Conseils\n\n✅ Parlez le premier, n''attendez pas\n✅ Regardez dans les yeux, pas vos slides\n✅ Maîtrisez vos chiffres — une hésitation est rédhibitoire\n✅ Pratiquez devant 10 personnes avant les vrais investisseurs\n\n**Question piège :** *"Pourquoi vous ?"*\n→ Montrez votre expérience terrain, votre réseau, votre capacité d''exécution',
   false),

  (v_module_ids[4], v_course_id,
   'Négocier avec les banques et la microfinance',
   'document', 3,
   E'# Négocier un financement bancaire\n\n## Ce que veut une banque\n\n1. Avez-vous la capacité de rembourser ? (flux de trésorerie)\n2. Qu''est-ce que je saisis si vous ne remboursez pas ? (garanties)\n3. Êtes-vous sérieux ? (apport personnel, historique)\n\n## Préparer votre dossier\n\n- ✅ Business plan complet avec projections 3 ans\n- ✅ Extrait RCCM\n- ✅ Relevés bancaires (12 derniers mois)\n- ✅ Preuves de revenus ou contrats clients\n- ✅ Garanties (bien immobilier, caution)\n- ✅ Apport personnel (minimum 20-30 %)\n\n## Garanties alternatives\n\n- **Caution solidaire** : un garant (famille, employeur)\n- **Nantissement** : vos équipements ou stocks\n- **Fonds de garantie** : FIGA (CI), FAGACE (régional)\n\n## La négociation\n\n**Ne prenez jamais le premier taux proposé.** Négociez :\n- Taux d''intérêt (-1 à -2 points)\n- Durée de remboursement (allongez pour réduire les mensualités)\n- Différé de remboursement (6-12 mois sans rembourser le capital)\n\n> 💡 Commencez par emprunter petit et remboursez vite — vous construisez votre historique de crédit.',
   false);
END IF;

-- ────────────────────────────────────────────────────────────
-- MODULE 5 : Lancer et gérer votre entreprise au quotidien
-- ────────────────────────────────────────────────────────────
IF array_length(v_module_ids, 1) >= 5 THEN
  DELETE FROM public.lessons WHERE module_id = v_module_ids[5];

  INSERT INTO public.lessons (module_id, course_id, title, type, position, content, is_free_preview)
  VALUES
  (v_module_ids[5], v_course_id,
   'Les démarches juridiques pour créer son entreprise (OHADA)',
   'document', 1,
   E'# Créer son entreprise légalement\n\n## Pourquoi se formaliser ?\n\n- ✅ Accès aux marchés publics et appels d''offres\n- ✅ Crédibilité auprès des grandes entreprises\n- ✅ Accès au financement bancaire\n- ✅ Protection juridique de votre marque\n- ✅ Pouvoir facturer et déduire des charges\n\n## Les formes juridiques OHADA (17 pays)\n\n| Forme | Capital min. | Idéal pour |\n|-------|-------------|------------|\n| **EI** | Aucun | Freelances, artisans |\n| **SARL** | 1 FCFA | PME, startups |\n| **SAS** | 1 FCFA | Startups tech (flexible) |\n| **SA** | 10M FCFA | Grandes entreprises |\n\n> Pour une startup : **SARL ou SAS** — capital minimal, flexibilité, protection du patrimoine personnel.\n\n## Étapes de création — Côte d''Ivoire (CEPICI)\n\n1. Choisir le nom → Vérification au RCCM\n2. Rédiger les statuts → Notaire (50 000-200 000 FCFA)\n3. Déposer le capital → Compte bloqué\n4. S''immatriculer → CEPICI (guichet unique 24-72h)\n5. Obtenir le RCCM et le NIF\n6. Ouvrir un compte professionnel\n\n**Coût total : 150 000 - 400 000 FCFA**\n\n## Protéger votre propriété intellectuelle\n\n- **Marque** : OAPI → protection dans 17 pays, ≈100 000 FCFA\n- **Code / contenus** : protégés automatiquement par le droit d''auteur\n- **Nom de domaine** : enregistrez dès maintenant (.ci, .sn, .africa)',
   false),

  (v_module_ids[5], v_course_id,
   'Vendre et acquérir ses premiers clients en Afrique',
   'document', 2,
   E'# Acquérir vos premiers clients\n\n> *"En Afrique, on n''achète pas un produit. On achète une personne."*\n\n## Les canaux les plus efficaces\n\n### 🟢 WhatsApp Business (n°1 en Afrique)\n- Profil WhatsApp Business : gratuit\n- Catalogue produits, réponses automatiques, étiquettes\n- Stratégie : groupe de 100-250 clients potentiels, contenu de valeur d''abord, vente ensuite\n\n### 📘 Facebook & Instagram\n- Facebook dominant en Afrique francophone\n- Ads : 0,05-0,20 USD par clic (moins cher qu''en Europe)\n- Lives : excellent engagement\n\n### 🤝 Bouche-à-oreille\nUne recommandation d''ami vaut 10 publicités. Premier objectif : **10 clients si satisfaits qu''ils parlent de vous**.\n\n## Script de vente (5 étapes)\n\n1. **Brisez la glace** : parlez de son contexte\n2. **Identifiez le problème** : "Qu''est-ce qui vous empêche d''avancer ?"\n3. **Amplifiez la douleur** : "Et si ça continue, qu''est-ce qui se passe ?"\n4. **Présentez la solution** : "Voici comment nous aidons des gens comme vous..."\n5. **Closing** : "À quel moment souhaitez-vous commencer ?"\n\n## Fidélisation\n\n- Un client fidèle coûte 5x moins cher qu''un nouveau\n- Programme de parrainage : récompense pour chaque nouveau client amené\n- Suivi WhatsApp : message personnalisé 1 semaine après l''achat',
   false),

  (v_module_ids[5], v_course_id,
   'Gérer sa trésorerie et ses finances au quotidien',
   'document', 3,
   E'# Gestion financière\n\n## Règle n°1 : Séparez finances perso et pro\n\n1. Ouvrez un compte bancaire professionnel séparé\n2. Versez-vous un salaire fixe (même modeste)\n3. Ne pichez jamais dans la caisse sans tracer l''opération\n\n## Le tableau de trésorerie (Cash Flow)\n\nSuivez chaque semaine :\n\n```\nSemaine | Encaissements | Décaissements | Solde\n01/10   | 500 000       | 350 000       | 150 000 ✅\n08/10   | 200 000       | 400 000       | -50 000 ⚠️\n```\n\n## Outils à bas coût\n\n| Outil | Coût |\n|-------|------|\n| Google Sheets | Gratuit |\n| Wave Accounting | Gratuit |\n| Sage | 15 000 FCFA/mois |\n| Zoho Books | 10 000 FCFA/mois |\n\n## Maîtriser son BFR\n\nLe BFR = l''argent nécessaire entre le moment où vous payez vos fournisseurs et le moment où vos clients vous paient.\n\n**Réduire son BFR :**\n- Négociez des délais avec vos fournisseurs\n- Demandez des acomptes à vos clients\n- Acceptez les paiements mobiles (reçu instantané)\n\n## Pièges fiscaux\n\n⚠️ Ne pas déclarer → risque de redressement fiscal\n⚠️ Confondre TVA collectée avec votre argent\n⚠️ Ne pas conserver les pièces comptables (gardez TOUT 10 ans)\n\n> 💡 Externalisez votre comptabilité à un cabinet dès le début (30 000-80 000 FCFA/mois). C''est un investissement.',
   false);
END IF;

-- ────────────────────────────────────────────────────────────
-- MODULE 6 : Développer et faire grandir votre activité
-- ────────────────────────────────────────────────────────────
IF array_length(v_module_ids, 1) >= 6 THEN
  DELETE FROM public.lessons WHERE module_id = v_module_ids[6];

  INSERT INTO public.lessons (module_id, course_id, title, type, position, content, is_free_preview)
  VALUES
  (v_module_ids[6], v_course_id,
   'Scaler votre business : de la startup à la PME',
   'document', 1,
   E'# Faire grandir votre entreprise\n\n> *"Ce qui vous a amené au succès initial ne vous amènera pas au niveau suivant."*\n\n## Les 4 leviers de croissance\n\n**1. 📈 Acquérir plus de clients**\n- Augmenter le budget marketing\n- Ouvrir de nouveaux canaux (TikTok, podcasts, B2B)\n- Partenariats de distribution\n\n**2. 💰 Augmenter le panier moyen**\n- Upsell : version premium\n- Cross-sell : produits complémentaires\n- Packs et bundles\n\n**3. 🔄 Fidéliser**\n- Abonnements récurrents (MRR)\n- Programme de fidélité\n- Communauté engagée\n\n**4. 🌍 Expansion géographique**\n- Autres villes / pays via ZLECAf\n- Franchises ou agents locaux\n\n## Quand recruter ?\n\n1. **Le commercial** : dès que vous avez un produit validé\n2. **L''opérationnel** : quand vous opérez plus que vous développez\n3. **Le technique** : quand la qualité baisse avec la croissance\n\n**Recruter sans se ruiner :** stagiaires INPHB/2iE/ESP Dakar, freelances Upwork/Afrikatek, commissions sur ventes.\n\n## Les systèmes : clé du scaling\n\n> *"Si votre entreprise ne peut pas fonctionner 2 semaines sans vous, vous n''avez pas une entreprise, vous avez un emploi."* — Michael Gerber\n\nDocumentez : processus de vente, onboarding client, gestion des réclamations.\n\n**Outils :** Notion/Trello, Slack, Google Workspace, Zoho CRM (gratuit)',
   false),

  (v_module_ids[6], v_course_id,
   'S''internationaliser : conquérir l''Afrique et au-delà',
   'document', 2,
   E'# S''internationaliser en Afrique\n\n## Pourquoi penser régional dès le départ ?\n\nL''Afrique francophone = **17 pays, 350 millions d''habitants**, une langue commune et la ZLECAf depuis 2021.\n\nUn produit qui marche en Côte d''Ivoire peut être répliqué au Sénégal, Cameroun, Mali sans changer la langue.\n\n## Les 4 étapes\n\n### 1. Dominer votre marché local\nSoyez **le leader incontesté** chez vous avant d''aller ailleurs.\n\n### 2. Choisir le 2ème marché\n\n| Marché | Taille | Facilité | Similarité | Score |\n|--------|--------|----------|------------|-------|\n| Sénégal (depuis CI) | 8 | 9 | 9 | **26/30** |\n| Nigeria | 10 | 5 | 6 | 21/30 |\n| Ghana | 7 | 7 | 5 | 19/30 |\n\n### 3. Trouver un partenaire local\nNe jamais aller seul sur un nouveau marché africain : distributeur, joint-venture ou franchise.\n\n### 4. Localiser votre offre\n- Langue, prix, paiement (M-Pesa, EcoCash…)\n- Références culturelles locales dans le marketing\n\n## La diaspora : votre pont\n\n40M+ Africains en Europe/Amérique : revenus plus élevés, attachement fort, ambassadeurs naturels.\n\n## Ressources\n- CCI (réseaux régionaux d''affaires)\n- Afreximbank (financement intra-africain)\n- Africa CEO Forum (top dirigeants africains)',
   false),

  (v_module_ids[6], v_course_id,
   'Conclusion : Votre feuille de route — les 100 premiers jours',
   'document', 3,
   E'# Votre plan d''action en 100 jours\n\n## Félicitations ! 🎉\n\nVous avez les outils pour lancer et développer votre entreprise en Afrique. **L''action est la seule chose qui compte maintenant.**\n\n## Jours 1-30 : Valider\n\n- [ ] Définir votre idée en une phrase (un problème, une solution)\n- [ ] Interviewer 20 clients potentiels\n- [ ] Lancer un MVP (WhatsApp, landing page ou service manuel)\n- [ ] Acquérir vos 5 premiers clients payants\n- [ ] Mesurer leur satisfaction (NPS)\n\n## Jours 31-60 : Structurer\n\n- [ ] Remplir votre Business Model Canvas\n- [ ] Créer votre entreprise légalement (RCCM, NIF)\n- [ ] Ouvrir un compte professionnel\n- [ ] Mettre en place un tableau de trésorerie\n- [ ] Atteindre 30 clients\n\n## Jours 61-100 : Accélérer\n\n- [ ] Lancer votre premier canal marketing (Facebook Ads ou WhatsApp)\n- [ ] Recruter votre premier collaborateur ou stagiaire\n- [ ] Documenter vos 3 processus clés\n- [ ] Atteindre votre seuil de rentabilité\n- [ ] Candidater : Tony Elumelu Foundation, incubateur local\n- [ ] Pitcher à 3 investisseurs\n\n## Livres incontournables\n\n- *Zero to One* — Peter Thiel\n- *The Lean Startup* — Eric Ries\n- *Purple Cow* — Seth Godin\n\n## Un mot de Patrice Kouakou\n\n> *L''entrepreneuriat africain n''est pas un sprint, c''est un marathon. La différence entre ceux qui réussissent et ceux qui abandonnent ? Ils ont continué quand les autres ont arrêté.*\n>\n> *Africa is rising — et vous en faites partie. Bonne chance ! 🌍*\n\n---\n\n**Complétez cette formation pour obtenir votre certificat IBIG E-LEARNING.**',
   false);
END IF;

RAISE NOTICE 'Migration 019 terminée. Course : %, Modules : %', v_course_id, v_module_ids;

END $$;
