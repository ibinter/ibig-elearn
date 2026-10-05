-- ============================================================
-- QUIZ : Leçons quiz + questions pour toutes les formations
-- ============================================================

-- ============================================================
-- FORMATION EXCEL
-- ============================================================
DO $$ DECLARE
  v_course_id uuid;
  v_module_id uuid;
  v_lesson_id uuid;
BEGIN
  SELECT id INTO v_course_id FROM courses WHERE slug = 'formation-excel-muu7e33g';
  IF v_course_id IS NULL THEN RAISE NOTICE 'Formation Excel non trouvée'; RETURN; END IF;

  -- Quiz Module 2 : Formules et Fonctions
  SELECT id INTO v_module_id FROM modules WHERE course_id = v_course_id AND title ILIKE '%Formules%' LIMIT 1;
  IF v_module_id IS NOT NULL THEN
    INSERT INTO lessons (module_id, course_id, title, type, position, is_free_preview)
    VALUES (v_module_id, v_course_id, 'Quiz : Formules et fonctions essentielles', 'quiz', 99, false)
    RETURNING id INTO v_lesson_id;

    INSERT INTO quiz_questions (lesson_id, question, options, correct_option, explanation, position) VALUES
    (v_lesson_id, 'Quelle formule Excel additionne les valeurs de B2 à B10 uniquement si la colonne A contient "CI" ?',
     '["=SOMME(B2:B10)","=SOMME.SI(A:A,\"CI\",B:B)","=SI(A2=\"CI\",SOMME(B2:B10))","=NB.SI(A:A,\"CI\")"]', 1,
     'SOMME.SI permet d''additionner une plage selon un critère dans une autre plage.', 0),
    (v_lesson_id, 'Quel raccourci clavier permet de basculer entre référence relative, absolue et mixte ?',
     '["F2","F4","Ctrl+$","Alt+F4"]', 1,
     'F4 fait cycler entre A1, $A$1, A$1, $A1 — très utile pour fixer des cellules.', 1),
    (v_lesson_id, 'Dans =RECHERCHEV("PROD01",A:D,3,FAUX), que signifie le chiffre 3 ?',
     '["Chercher dans la 3e ligne","Renvoyer la valeur de la 3e colonne","Tolérance de 3 erreurs","Chercher jusqu''à la ligne 3"]', 1,
     'Le 3e argument de RECHERCHEV indique la colonne du tableau à renvoyer (ici la 3e colonne de la plage A:D).', 2),
    (v_lesson_id, 'Quelle fonction renvoie 0 si une formule produit une erreur, et le résultat sinon ?',
     '["=SI(ERREUR(...)...)","=SIERREUR(formule, 0)","=IFERROR(...)","=NB.VIDE(...)"]', 1,
     'SIERREUR(valeur, valeur_si_erreur) est la syntaxe correcte en français. Elle remplace le message d''erreur par la valeur de secours.', 3),
    (v_lesson_id, 'Comment extraire les 3 premiers caractères du texte en cellule A1 ?',
     '["=DROITE(A1,3)","=STXT(A1,1,3)","=GAUCHE(A1,3)","=NBCAR(A1,3)"]', 2,
     'GAUCHE(texte, nb_caractères) extrait depuis la gauche. DROITE depuis la droite. STXT depuis une position donnée.', 4);
  END IF;

  -- Quiz Module 5 : TCD
  SELECT id INTO v_module_id FROM modules WHERE course_id = v_course_id AND title ILIKE '%Tableau%Croisé%' LIMIT 1;
  IF v_module_id IS NOT NULL THEN
    INSERT INTO lessons (module_id, course_id, title, type, position, is_free_preview)
    VALUES (v_module_id, v_course_id, 'Quiz : Tableaux Croisés Dynamiques', 'quiz', 99, false)
    RETURNING id INTO v_lesson_id;

    INSERT INTO quiz_questions (lesson_id, question, options, correct_option, explanation, position) VALUES
    (v_lesson_id, 'Où faites-vous glisser un champ pour calculer la somme des ventes dans un TCD ?',
     '["Zone Filtres","Zone Lignes","Zone Valeurs","Zone Colonnes"]', 2,
     'La zone Valeurs est réservée aux calculs (somme, moyenne, compte, etc.).', 0),
    (v_lesson_id, 'Après avoir modifié vos données source, que devez-vous faire pour mettre à jour le TCD ?',
     '["Supprimer et recréer le TCD","Clic droit → Actualiser","Appuyer sur F5","Fermer et rouvrir Excel"]', 1,
     'Clic droit dans le TCD puis Actualiser (ou Alt+F5) met à jour le tableau sans le recréer.', 1),
    (v_lesson_id, 'Qu''est-ce qu''un Segment (Slicer) dans un TCD ?',
     '["Un graphique intégré au TCD","Un filtre visuel interactif sous forme de boutons","Une formule de calcul","Un type de regroupement de dates"]', 1,
     'Les segments sont des boutons de filtre visuels qu''on peut connecter à plusieurs TCD simultanément.', 2),
    (v_lesson_id, 'Comment grouper automatiquement des dates par Trimestre dans un TCD ?',
     '["Créer une colonne Trimestre dans les données source","Clic droit sur une date du TCD → Grouper → Trimestres","Utiliser la formule =TRIMESTRE()","Trier par date croissante"]', 1,
     'Le groupement automatique de dates (mois, trimestres, années) se fait via clic droit → Grouper dans le TCD.', 3),
    (v_lesson_id, 'Qu''est-ce qu''un Champ Calculé dans un TCD ?',
     '["Une colonne supplémentaire dans la source","Une formule personnalisée créée à l''intérieur du TCD","Un filtre de données","Un graphique lié"]', 1,
     'Les champs calculés permettent de créer des métriques (ex: Marge = Revenus - Coûts) directement dans le TCD sans modifier la source.', 4);
  END IF;
END $$;


-- ============================================================
-- MARKETING DIGITAL POUR PME AFRICAINES
-- ============================================================
DO $$ DECLARE
  v_course_id uuid;
  v_module_id uuid;
  v_lesson_id uuid;
BEGIN
  SELECT id INTO v_course_id FROM courses WHERE slug = 'marketing-digital-pme-africaines';
  IF v_course_id IS NULL THEN RAISE NOTICE 'Marketing Digital non trouvé'; RETURN; END IF;

  -- Quiz Stratégie Digitale
  SELECT id INTO v_module_id FROM modules WHERE course_id = v_course_id AND title ILIKE '%Stratégie%' LIMIT 1;
  IF v_module_id IS NOT NULL THEN
    INSERT INTO lessons (module_id, course_id, title, type, position, is_free_preview)
    VALUES (v_module_id, v_course_id, 'Quiz : Stratégie digitale et persona', 'quiz', 99, false)
    RETURNING id INTO v_lesson_id;

    INSERT INTO quiz_questions (lesson_id, question, options, correct_option, explanation, position) VALUES
    (v_lesson_id, 'Qu''est-ce qu''un "persona" en marketing ?',
     '["Un logo de marque","Un client idéal fictif et détaillé","Un budget publicitaire","Un type de publicité"]', 1,
     'Le persona est un profil de client idéal fictif basé sur des données réelles : âge, revenus, comportements, problèmes, canaux utilisés.', 0),
    (v_lesson_id, 'Selon la règle 80/20 du contenu, quelle proportion de vos publications doit être directement commerciale ?',
     '["80%","50%","20%","10%"]', 2,
     '20% de contenu commercial, 80% de contenu de valeur (conseils, témoignages, coulisses). Trop de pub fait fuir les abonnés.', 1),
    (v_lesson_id, 'Sur quelle plateforme est-il le plus pertinent de publier du contenu B2B (entre entreprises) en Afrique ?',
     '["TikTok","Snapchat","LinkedIn","Pinterest"]', 2,
     'LinkedIn est le réseau professionnel par excellence pour toucher des décideurs, DRH, directeurs commerciaux.', 2),
    (v_lesson_id, 'Quelle est l''heure de pic de publication recommandée sur Facebook en Afrique de l''Ouest ?',
     '["6h-8h du matin","12h-14h et 19h-21h","15h-17h","23h-1h"]', 1,
     'Le pic d''audience Facebook en Afrique est la pause déjeuner (12h-14h) et en soirée après le travail (19h-21h).', 3),
    (v_lesson_id, 'Qu''est-ce que le positionnement marketing ?',
     '["Le prix de votre produit","La raison pour laquelle les clients vous choisissent plutôt qu''un concurrent","L''emplacement de votre boutique","Le nombre de followers"]', 1,
     'Le positionnement définit votre place unique dans l''esprit du client : pourquoi VOUS et pas un autre.', 4);
  END IF;

  -- Quiz Publicité Facebook
  SELECT id INTO v_module_id FROM modules WHERE course_id = v_course_id AND title ILIKE '%Facebook%' LIMIT 1;
  IF v_module_id IS NOT NULL THEN
    INSERT INTO lessons (module_id, course_id, title, type, position, is_free_preview)
    VALUES (v_module_id, v_course_id, 'Quiz : Publicité Facebook & Instagram', 'quiz', 99, false)
    RETURNING id INTO v_lesson_id;

    INSERT INTO quiz_questions (lesson_id, question, options, correct_option, explanation, position) VALUES
    (v_lesson_id, 'Quel budget journalier minimum est recommandé pour tester une campagne Facebook en Afrique ?',
     '["500 FCFA","2 000 - 5 000 FCFA","50 000 FCFA","500 000 FCFA"]', 1,
     '2 000 à 5 000 FCFA/jour permet à l''algorithme de Facebook d''apprendre et d''optimiser. En dessous, les résultats sont peu significatifs.', 0),
    (v_lesson_id, 'Qu''est-ce qu''une "Audience Similaire" (Lookalike) sur Facebook ?',
     '["Les abonnés de vos concurrents","Des personnes ressemblant à vos meilleurs clients actuels","Les personnes qui ont vu vos publicités","Vos clients existants"]', 1,
     'Facebook analyse le profil de vos clients et trouve des personnes aux comportements et intérêts similaires parmi ses milliards d''utilisateurs.', 1),
    (v_lesson_id, 'Quelle est la durée minimale recommandée pour tester une campagne avant de l''analyser ?',
     '["24 heures","3 jours","7 jours","1 mois"]', 2,
     '7 jours minimum : l''algorithme Facebook a besoin de temps pour apprendre et optimiser la diffusion de vos publicités.', 2),
    (v_lesson_id, 'Qu''est-ce que le "retargeting" en publicité digitale ?',
     '["Cibler uniquement les personnes âgées de plus de 40 ans","Recibler les personnes ayant déjà visité votre site sans acheter","Diffuser des publicités uniquement sur mobile","Cibler par pays"]', 1,
     'Le retargeting (ou remarketing) consiste à recibler les visiteurs de votre site qui ne sont pas passés à l''achat, avec des publicités personnalisées.', 3),
    (v_lesson_id, 'Quel format publicitaire obtient généralement le meilleur taux d''engagement sur Facebook/Instagram ?',
     '["Image statique","Texte seul","Vidéo courte (15-30 secondes)","Document PDF"]', 2,
     'La vidéo courte génère plus d''engagement et souvent un coût par résultat plus faible que les autres formats.', 4);
  END IF;
END $$;


-- ============================================================
-- FINANCE PERSONNELLE & INVESTISSEMENT EN AFRIQUE
-- ============================================================
DO $$ DECLARE
  v_course_id uuid;
  v_module_id uuid;
  v_lesson_id uuid;
BEGIN
  SELECT id INTO v_course_id FROM courses WHERE slug = 'finance-personnelle-investissement-afrique';
  IF v_course_id IS NULL THEN RAISE NOTICE 'Finance Personnelle non trouvée'; RETURN; END IF;

  -- Quiz Budget et Épargne
  SELECT id INTO v_module_id FROM modules WHERE course_id = v_course_id AND title ILIKE '%Budget%' LIMIT 1;
  IF v_module_id IS NOT NULL THEN
    INSERT INTO lessons (module_id, course_id, title, type, position, is_free_preview)
    VALUES (v_module_id, v_course_id, 'Quiz : Budget, épargne et fonds d''urgence', 'quiz', 99, false)
    RETURNING id INTO v_lesson_id;

    INSERT INTO quiz_questions (lesson_id, question, options, correct_option, explanation, position) VALUES
    (v_lesson_id, 'Selon la règle 50/30/20 adaptée à l''Afrique, quel pourcentage du revenu net est recommandé pour l''épargne ?',
     '["5%","10%","20%","30%"]', 2,
     '20% du revenu net doit aller à l''épargne et l''investissement. Cette règle est NON NÉGOCIABLE pour construire un patrimoine.', 0),
    (v_lesson_id, 'Quel est le montant minimum recommandé pour un fonds d''urgence ?',
     '["1 mois de salaire","3 mois de dépenses essentielles","10% du patrimoine total","500 000 FCFA fixes"]', 1,
     '3 mois de dépenses essentielles est le minimum. L''idéal est 6 mois. Cela couvre : maladie, perte d''emploi, réparation urgente.', 1),
    (v_lesson_id, 'Quelle est la MEILLEURE façon d''automatiser son épargne ?',
     '["Épargner ce qu''il reste en fin de mois","Transférer l''épargne le jour du salaire avant tout autre dépense","Économiser quand on pense à y penser","Ouvrir un livret épargne et y déposer parfois"]', 1,
     'L''épargne doit être la PREMIÈRE dépense, pas la dernière. Transférez immédiatement le jour du salaire : il ne reste jamais rien à la fin du mois.', 2),
    (v_lesson_id, 'Qu''est-ce que le "Patrimoine Net" ?',
     '["Votre salaire mensuel net","La valeur totale de vos actifs","Total actifs MOINS total passifs","La valeur de votre logement"]', 2,
     'Patrimoine Net = Actifs (ce que vous possédez) - Passifs (ce que vous devez). C''est l''indicateur clé de votre santé financière.', 3),
    (v_lesson_id, 'Où NE FAUT-IL PAS placer son fonds d''urgence ?',
     '["Compte épargne bancaire","Mobile Money Épargne","Immobilier ou bourse","Bon de trésor à court terme"]', 2,
     'Le fonds d''urgence doit être LIQUIDE (accessible immédiatement). L''immobilier et la bourse peuvent prendre des semaines à convertir en cash.', 4);
  END IF;

  -- Quiz Investissement
  SELECT id INTO v_module_id FROM modules WHERE course_id = v_course_id AND title ILIKE '%Investir%' LIMIT 1;
  IF v_module_id IS NOT NULL THEN
    INSERT INTO lessons (module_id, course_id, title, type, position, is_free_preview)
    VALUES (v_module_id, v_course_id, 'Quiz : Investissement immobilier et bourse', 'quiz', 99, false)
    RETURNING id INTO v_lesson_id;

    INSERT INTO quiz_questions (lesson_id, question, options, correct_option, explanation, position) VALUES
    (v_lesson_id, 'Comment calcule-t-on la rentabilité brute d''un bien immobilier locatif ?',
     '["(Prix d''achat / Loyer annuel) × 100","(Loyer annuel / Prix d''achat) × 100","(Loyer mensuel × 12) - Charges","Prix d''achat - Loyer annuel"]', 1,
     'Rentabilité brute = (Loyer annuel / Prix d''achat) × 100. Exemple : 2 400 000 FCFA de loyer / 25 000 000 FCFA = 9,6%/an.', 0),
    (v_lesson_id, 'Qu''est-ce que la BRVM ?',
     '["Une banque régionale d''Afrique de l''Ouest","La Bourse Régionale des Valeurs Mobilières (Abidjan, zone UEMOA)","Un fonds d''investissement panafricain","Un organisme de crédit agricole"]', 1,
     'La BRVM (Bourse Régionale des Valeurs Mobilières) est basée à Abidjan et couvre les 8 pays de l''UEMOA.', 1),
    (v_lesson_id, 'Qu''est-ce que la méthode DCA (Dollar Cost Averaging) en bourse ?',
     '["Acheter toutes les actions en une fois","Investir régulièrement le même montant chaque mois, quelle que soit la valeur","Vendre dès que le cours monte de 10%","N''investir qu''en dollars américains"]', 1,
     'Le DCA consiste à investir un montant fixe à intervalles réguliers. Cela lisse le coût d''achat et réduit le risque de mauvais timing.', 2),
    (v_lesson_id, 'Quel document faut-il TOUJOURS vérifier avant d''acheter un terrain en Afrique ?',
     '["Le plan cadastral uniquement","Le titre foncier (via notaire ou cadastre)","La promesse de vente du vendeur","Le prix du marché dans le quartier"]', 1,
     'Le titre foncier est le seul document qui prouve légalement la propriété en Afrique. Sans lui, vous risquez un litige ou une escroquerie.', 3),
    (v_lesson_id, 'Qu''est-ce que la magie des intérêts composés ?',
     '["Un taux d''intérêt bancaire très élevé","Les intérêts qui génèrent eux-mêmes des intérêts sur la durée","Un type de placement immobilier","Un compte épargne spécial"]', 1,
     'Les intérêts composés : vos intérêts s''ajoutent au capital et génèrent eux-mêmes des intérêts. Sur 30 ans à 8%/an, 1 FCFA investi devient 10 FCFA.', 4);
  END IF;
END $$;


-- ============================================================
-- E-COMMERCE ET VENTE EN LIGNE EN AFRIQUE
-- ============================================================
DO $$ DECLARE
  v_course_id uuid;
  v_module_id uuid;
  v_lesson_id uuid;
BEGIN
  SELECT id INTO v_course_id FROM courses WHERE slug = 'ecommerce-vente-en-ligne-afrique';
  IF v_course_id IS NULL THEN RAISE NOTICE 'E-commerce non trouvé'; RETURN; END IF;

  -- Quiz Boutique en ligne
  SELECT id INTO v_module_id FROM modules WHERE course_id = v_course_id AND title ILIKE '%Boutique%' LIMIT 1;
  IF v_module_id IS NOT NULL THEN
    INSERT INTO lessons (module_id, course_id, title, type, position, is_free_preview)
    VALUES (v_module_id, v_course_id, 'Quiz : Créer et optimiser sa boutique en ligne', 'quiz', 99, false)
    RETURNING id INTO v_lesson_id;

    INSERT INTO quiz_questions (lesson_id, question, options, correct_option, explanation, position) VALUES
    (v_lesson_id, 'Quel est le principal avantage de WooCommerce par rapport à Shopify pour une PME africaine ?',
     '["Interface plus jolie","Open source et gratuit, avec possibilité d''intégrer le Mobile Money local","Support 24h/24","Livraison intégrée"]', 1,
     'WooCommerce est gratuit (open source) et dispose de plugins Mobile Money (Orange Money, MTN...) adaptés à l''Afrique, contrairement à Shopify qui coûte 29-79$/mois.', 0),
    (v_lesson_id, 'Combien de photos minimum sont recommandées par fiche produit ?',
     '["1 seule photo principale","2-3 photos","4-6 photos (plusieurs angles + mise en situation)","10 photos minimum"]', 2,
     '4 à 6 photos : vue principale, plusieurs angles, détails importants, et au moins une photo en situation d''utilisation (lifestyle).', 1),
    (v_lesson_id, 'Quel est le principal facteur d''abandon de panier en Afrique selon les études ?',
     '["Le prix trop élevé","Les frais ou délais de livraison non acceptables","Le manque de couleurs de produits","L''obligation de créer un compte"]', 1,
     '72% des abandons de panier en Afrique sont liés à des frais de livraison trop élevés ou des délais trop longs. Affichez toujours les frais clairement.', 2),
    (v_lesson_id, 'Qu''est-ce que le "dropshipping" ?',
     '["Vendre des produits d''occasion","Vendre sans stock : le fournisseur expédie directement au client","Acheter en gros et revendre","Livraison express par drone"]', 1,
     'En dropshipping, vous vendez des produits que vous n''avez pas en stock. Le fournisseur (souvent en Chine) expédie directement au client final.', 3),
    (v_lesson_id, 'Pourquoi le certificat SSL (HTTPS) est-il OBLIGATOIRE pour une boutique en ligne ?',
     '["Pour être mieux référencé sur Google uniquement","Pour sécuriser les données + rassurer les clients + référencement Google","Pour accepter le paiement Mobile Money","Pour vendre à l''international"]', 1,
     'Sans HTTPS, Google marque votre site "Non sécurisé", les clients fuient et votre référencement chute. C''est obligatoire pour toute boutique.', 4);
  END IF;

  -- Quiz Paiement
  SELECT id INTO v_module_id FROM modules WHERE course_id = v_course_id AND title ILIKE '%Paiement%' LIMIT 1;
  IF v_module_id IS NOT NULL THEN
    INSERT INTO lessons (module_id, course_id, title, type, position, is_free_preview)
    VALUES (v_module_id, v_course_id, 'Quiz : Paiement en ligne et sécurité', 'quiz', 99, false)
    RETURNING id INTO v_lesson_id;

    INSERT INTO quiz_questions (lesson_id, question, options, correct_option, explanation, position) VALUES
    (v_lesson_id, 'Pourquoi est-il indispensable d''intégrer le Mobile Money sur une boutique en ligne africaine ?',
     '["C''est obligatoire légalement","Plus de 80% de la population n''est pas bancarisée mais utilise le Mobile Money","C''est moins cher que les cartes bancaires","Pour les ventes internationales"]', 1,
     'Moins de 20% de la population est bancarisée en Afrique de l''Ouest. Sans Mobile Money, vous excluez 80% de vos clients potentiels.', 0),
    (v_lesson_id, 'Quelle est la fraude la plus courante que subit un vendeur en ligne en Afrique ?',
     '["Vol de marchandise en boutique","Faux screenshot de paiement envoyé par le client","Retour de produit défectueux","Arnaque à la livraison"]', 1,
     'Le faux screenshot de paiement est très répandu. Ne libérez JAMAIS une commande sur la base d''une capture d''écran — vérifiez dans votre tableau de bord de paiement.', 1),
    (v_lesson_id, 'Quelle est la commission moyenne de GeniusPay par transaction ?',
     '["0,5%","2-3%","10%","Forfait fixe 5 000 FCFA"]', 1,
     'GeniusPay prélève environ 2 à 3% par transaction. C''est le tarif standard des agrégateurs de paiement Mobile Money en Afrique.', 2),
    (v_lesson_id, 'Qu''est-ce que le "Paiement à la Livraison" (PAL) et quel est son principal inconvénient ?',
     '["Paiement par carte à la livraison — inconvénient : frais","Paiement en cash à réception — inconvénient : taux de retour plus élevé","Paiement en plusieurs fois — inconvénient : délai","Paiement anticipé — inconvénient : risque client"]', 1,
     'Le PAL (cash à la livraison) est populaire en Afrique car il lève les freins à l''achat. Inconvénient : plus de retours et gestion du cash pour le livreur.', 3),
    (v_lesson_id, 'Pour rassurer un client sur la fiabilité de votre boutique en ligne, quelle action est la PLUS efficace ?',
     '["Mettre beaucoup de couleurs sur le site","Afficher des témoignages clients réels + numéro WhatsApp visible + mentions légales","Mettre le prix le plus bas","Envoyer des emails promotionnels"]', 1,
     'La confiance se construit par la preuve sociale (avis clients), l''accessibilité (WhatsApp), et la transparence légale (qui vous êtes, RCCM, adresse).', 4);
  END IF;
END $$;


-- ============================================================
-- COMPTABILITÉ OHADA POUR PME
-- ============================================================
DO $$ DECLARE
  v_course_id uuid;
  v_module_id uuid;
  v_lesson_id uuid;
BEGIN
  SELECT id INTO v_course_id FROM courses WHERE slug = 'comptabilite-ohada-pme-sans-etre-comptable';
  IF v_course_id IS NULL THEN
    SELECT id INTO v_course_id FROM courses WHERE title ILIKE '%Comptabilit%OHADA%' LIMIT 1;
  END IF;
  IF v_course_id IS NULL THEN RAISE NOTICE 'Comptabilité OHADA non trouvée'; RETURN; END IF;

  SELECT id INTO v_module_id FROM modules WHERE course_id = v_course_id ORDER BY position LIMIT 1;
  IF v_module_id IS NOT NULL THEN
    INSERT INTO lessons (module_id, course_id, title, type, position, is_free_preview)
    VALUES (v_module_id, v_course_id, 'Quiz : Bases de la comptabilité OHADA', 'quiz', 99, false)
    RETURNING id INTO v_lesson_id;

    INSERT INTO quiz_questions (lesson_id, question, options, correct_option, explanation, position) VALUES
    (v_lesson_id, 'Combien de pays africains appliquent le système OHADA ?',
     '["8 pays","17 pays","23 pays","54 pays"]', 1,
     'L''OHADA regroupe 17 pays d''Afrique, principalement francophone. Le SYSCOHADA est le plan comptable unifié de ces pays.', 0),
    (v_lesson_id, 'Dans la partie double, chaque écriture comptable touche au minimum combien de comptes ?',
     '["1 compte","2 comptes (un débit, un crédit)","3 comptes","4 comptes"]', 1,
     'La partie double : chaque opération est enregistrée en débit dans un compte ET en crédit dans un autre. Total débits = Total crédits.', 1),
    (v_lesson_id, 'Quel document comptable résume ce que possède et ce que doit une entreprise à une date donnée ?',
     '["Le compte de résultat","La balance générale","Le bilan","Le journal des ventes"]', 2,
     'Le bilan présente l''ACTIF (ce que l''entreprise possède) et le PASSIF (ce qu''elle doit + les capitaux propres) à une date précise.', 2),
    (v_lesson_id, 'Qu''est-ce que la TVA collectée pour une entreprise ?',
     '["La TVA que l''entreprise paye sur ses achats","La TVA facturée aux clients et reversée à l''État","Un impôt sur les bénéfices","Une taxe sur les salaires"]', 1,
     'La TVA collectée est facturée aux clients. L''entreprise la collecte pour le compte de l''État et la reverse. TVA à payer = TVA collectée - TVA déductible.', 3),
    (v_lesson_id, 'Quelle est la différence entre un PRODUIT et une CHARGE en comptabilité ?',
     '["Un produit augmente le passif, une charge l''actif","Un produit augmente le résultat (revenu), une charge le diminue (dépense)","Ce sont des synonymes","Un produit est toujours physique, une charge est toujours un service"]', 1,
     'Produits = revenus de l''entreprise (ventes, prestations). Charges = dépenses (achats, salaires, loyer). Résultat = Produits - Charges.', 4);
  END IF;
END $$;


-- ============================================================
-- MANAGEMENT ET LEADERSHIP EN AFRIQUE
-- ============================================================
DO $$ DECLARE
  v_course_id uuid;
  v_module_id uuid;
  v_lesson_id uuid;
BEGIN
  SELECT id INTO v_course_id FROM courses WHERE slug = 'management-leadership-afrique';
  IF v_course_id IS NULL THEN
    SELECT id INTO v_course_id FROM courses WHERE title ILIKE '%Management%Leadership%' LIMIT 1;
  END IF;
  IF v_course_id IS NULL THEN RAISE NOTICE 'Management non trouvé'; RETURN; END IF;

  SELECT id INTO v_module_id FROM modules WHERE course_id = v_course_id ORDER BY position LIMIT 1;
  IF v_module_id IS NOT NULL THEN
    INSERT INTO lessons (module_id, course_id, title, type, position, is_free_preview)
    VALUES (v_module_id, v_course_id, 'Quiz : Leadership et management d''équipes', 'quiz', 99, false)
    RETURNING id INTO v_lesson_id;

    INSERT INTO quiz_questions (lesson_id, question, options, correct_option, explanation, position) VALUES
    (v_lesson_id, 'Quelle est la principale différence entre un MANAGER et un LEADER ?',
     '["Le manager a un salaire plus élevé","Le manager gère des processus/tâches, le leader inspire et oriente les personnes","Le leader a plus d''ancienneté","Il n''y a pas de différence"]', 1,
     'Le manager optimise l''existant (planifier, organiser, contrôler). Le leader crée du sens, inspire et pousse vers un futur désiré. On peut être les deux.', 0),
    (v_lesson_id, 'Selon les études africaines sur le turnover, quelle est la principale raison qui pousse les talents à quitter une entreprise ?',
     '["Le salaire insuffisant","La mauvaise relation avec le manager direct","L''absence de bureau climatisé","Le manque de parking"]', 1,
     'Plus de 38% des départs sont liés à la mauvaise relation manager-collaborateur. "Les gens quittent leur manager, pas leur entreprise."', 1),
    (v_lesson_id, 'Qu''est-ce qu''une délégation efficace ?',
     '["Donner du travail supplémentaire à un employé","Confier une mission avec objectif clair, ressources et autonomie adaptés","Demander à un stagiaire de faire le travail difficile","Contrôler chaque étape du travail délégué"]', 1,
     'Déléguer = confier mission + objectif SMART + ressources nécessaires + autonomie adaptée au niveau de compétence + feedback régulier.', 2),
    (v_lesson_id, 'Dans le modèle de gestion du temps, quelle catégorie de tâches devrait occuper la majeure partie de votre temps ?',
     '["Urgent et Important (gestion de crise)","Important mais pas urgent (planification, prévention, développement)","Urgent mais pas important (interruptions)","Ni urgent ni important (distraction)"]', 1,
     'La matrice Eisenhower : le quadrant Important/Pas urgent est le plus stratégique. Y investir du temps réduit les crises futures.', 3),
    (v_lesson_id, 'Comment formuler un feedback efficace selon la méthode SBI ?',
     '["Situation → Blâme → Interprétation","Situation → Comportement → Impact","Sévérité → Bienfait → Intention","Sujet → Bénéfice → Instruction"]', 1,
     'SBI : décrivez la Situation (contexte), le Comportement observable (faits, pas interprétation), et l''Impact sur l''équipe/résultat. Neutre et factuel.', 4);
  END IF;
END $$;
