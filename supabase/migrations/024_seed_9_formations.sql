-- ============================================================
-- 9 FORMATIONS COMPLÈTES FORMAT DOCUMENT — IBIG E-LEARNING
-- ============================================================

-- ============================================================
-- FORMATION 1 : Finance Personnelle & Investissement en Afrique
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
    'Finance Personnelle & Investissement en Afrique',
    'finance-personnelle-investissement-afrique',
    'Maîtrisez les fondamentaux de la finance personnelle adaptés au contexte africain : gestion du budget, épargne, investissement en bourse régionale (BRVM), immobilier, et protection contre l''inflation. Une formation concrète pour bâtir votre patrimoine durablement.',
    'Gérez votre argent, épargnez intelligemment et investissez en Afrique.',
    v_instructor,
    35000, 53, 58,
    'intermediaire', 18, 'fr', true, true,
    2847, 4.7, 312,
    ARRAY['finance', 'investissement', 'épargne', 'BRVM', 'patrimoine'],
    ARRAY['Construire un budget personnel solide', 'Épargner avec méthode malgré les aléas', 'Investir à la BRVM (Bourse Régionale)', 'Comprendre l''immobilier en Afrique de l''Ouest', 'Protéger son patrimoine contre l''inflation'],
    ARRAY['Aucun prérequis financier', 'Volonté de prendre en main ses finances']
  ) RETURNING id INTO v_course_id;

  INSERT INTO modules (course_id, title, position) VALUES
    (v_course_id, 'Les fondamentaux de la finance personnelle', 1),
    (v_course_id, 'Épargne et gestion du budget familial', 2),
    (v_course_id, 'Investir à la BRVM — Bourse Régionale des Valeurs Mobilières', 3),
    (v_course_id, 'Immobilier et investissements alternatifs', 4),
    (v_course_id, 'Protéger et transmettre son patrimoine', 5);

  SELECT id INTO v_mod1 FROM modules WHERE course_id = v_course_id ORDER BY position OFFSET 0 LIMIT 1;
  SELECT id INTO v_mod2 FROM modules WHERE course_id = v_course_id ORDER BY position OFFSET 1 LIMIT 1;
  SELECT id INTO v_mod3 FROM modules WHERE course_id = v_course_id ORDER BY position OFFSET 2 LIMIT 1;
  SELECT id INTO v_mod4 FROM modules WHERE course_id = v_course_id ORDER BY position OFFSET 3 LIMIT 1;
  SELECT id INTO v_mod5 FROM modules WHERE course_id = v_course_id ORDER BY position OFFSET 4 LIMIT 1;

  INSERT INTO lessons (module_id, course_id, title, type, position, is_free_preview, content) VALUES
  (v_mod1, v_course_id, 'Comprendre le flux d''argent dans votre vie', 'document', 1, true,
   E'# Comprendre le flux d''argent dans votre vie\n\n## Introduction\nAvant d''investir, il faut comprendre où va votre argent. La plupart des Africains perdent 30 à 40% de leurs revenus dans des dépenses invisibles.\n\n## Les 4 catégories de flux financier\n\n### 1. Revenus actifs\n- Salaire ou revenus d''activité\n- Prestations de services\n- Commerce\n\n### 2. Revenus passifs\n- Loyers\n- Dividendes\n- Intérêts d''épargne\n\n### 3. Dépenses essentielles\n- Logement, alimentation, santé, transport\n\n### 4. Dépenses discrétionnaires\n- Loisirs, cadeaux, sorties\n\n## L''exercice de la semaine\nNotez chaque centime dépensé pendant 7 jours. Vous découvrirez des fuites insoupçonnées.\n\n## La règle 50/30/20\n- **50%** → besoins essentiels\n- **30%** → envies et loisirs\n- **20%** → épargne et investissement\n\n> **En Afrique**, l''obligation sociale (cérémonies, famille élargie) représente souvent 15 à 25% du budget. Intégrez-la dans votre planification plutôt que de la subir.'),

  (v_mod1, v_course_id, 'Les pièges financiers à éviter absolument', 'document', 2, false,
   
   E'# Les pièges financiers à éviter absolument\n\n## Les dettes de consommation\nUn crédit téléphone ou moto à 24% par an détruit votre capacité d''épargne. Calculez toujours le coût total d''un crédit avant de signer.\n\n### Formule du coût réel\n```\nCoût total = Mensualité × Nombre de mois\nSurcoût = Coût total - Prix initial\n```\n\n**Exemple :** Moto à 800 000 XOF en 24 mois à 500 000 XOF/mois → vous payez 12 000 000 XOF soit 50% de plus.\n\n## Les tontines : avantages et risques\n\n### ✅ Avantages\n- Discipline d''épargne forcée\n- Pas de frais bancaires\n- Solidarité communautaire\n\n### ⚠️ Risques\n- Pas de garantie légale\n- Risque de disparition du gestionnaire\n- Pas de rémunération du capital\n\n**Recommandation :** Tontines pour épargne courte durée ≤ 6 mois, montants modérés.\n\n## Les arnaques d''investissement fréquentes en Afrique\n1. **Schémas Ponzi** : promesses de 20-30% par mois\n2. **Crypto frauduleuses** : tokens sans valeur réelle\n3. **Foncier sans titre** : terrains sans actes légaux\n4. **MLM déguisés** : "investissement" nécessitant du recrutement\n\n> **Règle d''or :** Tout rendement promis supérieur à 15% annuel nécessite une vérification approfondie.'),

  (v_mod2, v_course_id, 'Construire un budget familial africain efficace', 'document', 1, false,
   E'# Construire un budget familial africain efficace\n\n## La réalité des revenus en Afrique\nContrairement aux pays occidentaux, une grande partie de la population active africaine a des **revenus irréguliers** : commerçants, entrepreneurs, professions libérales, agriculteurs.\n\n## La méthode du budget à revenus variables\n\n### Étape 1 : Calculer le revenu minimum garanti\nSur les 12 derniers mois, identifiez votre **mois le plus faible**. Utilisez ce chiffre comme base de planification.\n\n### Étape 2 : Établir les dépenses incompressibles\n| Poste | Montant mensuel |\n|-------|----------------|\n| Loyer / remboursement | X XOF |\n| Alimentation de base | X XOF |\n| Transport | X XOF |\n| Scolarité enfants | X XOF |\n| **Total incompressible** | **X XOF** |\n\n### Étape 3 : Le fonds de sécurité familiale\nConstituer 3 mois de dépenses incompressibles en réserve d''urgence avant d''investir.\n\n### Étape 4 : Allocation des surplus\nLes mois de revenus supérieurs au minimum :\n- 50% → remboursement dettes / épargne long terme\n- 30% → investissement\n- 20% → amélioration qualité de vie\n\n## L''enveloppe des obligations sociales\nBudgétisez explicitement :\n- Cotisations funérailles : X XOF/mois\n- Cérémonies familiales : X XOF/mois\n- Aide famille élargie : X XOF/mois\n\nCe qui est budgété ne crée pas de culpabilité ni de désordre financier.'),

  (v_mod3, v_course_id, 'Introduction à la BRVM — Comment acheter vos premières actions', 'document', 1, false,
   
   E'# Introduction à la BRVM\n\n## Qu''est-ce que la BRVM ?\nLa **Bourse Régionale des Valeurs Mobilières** (BRVM) est la bourse commune des 8 pays de l''UEMOA :\nBénin, Burkina Faso, Côte d''Ivoire, Guinée-Bissau, Mali, Niger, Sénégal, Togo.\n\n**Siège :** Abidjan, Côte d''Ivoire\n**Capitalisation :** environ 8 000 milliards XOF\n\n## Les principaux indices\n- **BRVM Composite** : toutes les actions cotées\n- **BRVM 30** : les 30 valeurs les plus liquides\n- **BRVM Prestige** : les grandes capitalisations\n\n## Comment investir à la BRVM\n\n### Étape 1 : Ouvrir un compte chez un SGI (Société de Gestion et d''Intermédiation)\nSGI agréés en Côte d''Ivoire : CGF Bourse, BICI Bourse, SIB Bourse, Coris Bourse...\n\n### Étape 2 : Déposer votre capital initial\nMinimum recommandé : **100 000 XOF** pour diversifier sur 2-3 valeurs.\n\n### Étape 3 : Choisir vos premières actions\n**Valeurs solides pour débutants (exemples) :**\n- SONATEL (télécoms Sénégal)\n- ECOBANK CI (banque panafricaine)\n- ORAGROUP (bancaire, présent dans 12 pays)\n- PALM CI (agroalimentaire)\n\n### Étape 4 : Passer un ordre d''achat\nTypes d''ordres :\n- **Au mieux** : exécuté au meilleur prix disponible\n- **À cours limité** : exécuté uniquement à votre prix cible\n\n## Les frais à connaître\n- Commission SGI : 0,7 à 1% du montant\n- Droit de garde annuel : 0,1 à 0,2%\n\n> **Conseil :** Commencez par investir 20 000 à 50 000 XOF par mois régulièrement. La régularité bat le timing.'),

  (v_mod4, v_course_id, 'L''immobilier en Afrique de l''Ouest : acheter intelligemment', 'document', 1, false,
   
   E'# L''immobilier en Afrique de l''Ouest\n\n## Pourquoi l''immobilier reste le placement favori des Africains\n- Actif tangible, visible, compréhensible\n- Protection contre l''inflation\n- Revenus locatifs réguliers\n- Transmission patrimoniale\n\n## Les types de biens selon le budget\n\n### Budget < 10 millions XOF\n- Terrain nu en périphérie urbaine\n- Mise de fond pour programme immobilier\n\n### Budget 10-50 millions XOF\n- Studio ou F2 en zone semi-urbaine\n- Chambre de bonne ou studio étudiant\n\n### Budget > 50 millions XOF\n- Appartement en zone urbaine\n- Villa locative\n- Immeuble de rapport (revenu multiple)\n\n## Les pièges juridiques à éviter\n\n### ⚠️ La question des titres fonciers\nEn Afrique de l''Ouest, 3 types de documents existent :\n1. **Titre foncier (TF)** ✅ : seul document légalement inattaquable\n2. **Arrêté de concession provisoire (ACP)** ⚠️ : en cours de régularisation\n3. **Attestation villageoise / lettre d''attribution** ❌ : aucune valeur légale\n\n**Règle absolue :** N''achetez jamais sans titre foncier ou sans être en cours de mutation notariée.\n\n## Calcul de rentabilité locative\n```\nRendement brut = (Loyer annuel / Prix d''achat) × 100\nRendement net = ((Loyer annuel - Charges) / Prix d''achat) × 100\n```\n\n**Exemple :** Appartement à 25M XOF, loyer 150 000/mois\n- Rendement brut = (1 800 000 / 25 000 000) × 100 = **7,2%**\n- Rendement net après charges ≈ **5,5%**\n\nC''est supérieur à la plupart des produits d''épargne bancaire.'),

  (v_mod5, v_course_id, 'Assurance vie et transmission du patrimoine en Afrique', 'document', 1, false,
   E'# Assurance vie et transmission du patrimoine\n\n## Pourquoi l''assurance vie est sous-utilisée en Afrique\nSeulement 3% de la population africaine dispose d''une assurance vie, contre 60% en Europe.\nPourtant, c''est l''outil le plus puissant de protection et de transmission patrimoniale.\n\n## Les produits disponibles en Côte d''Ivoire et en zone CIMA\n\n### 1. L''assurance décès temporaire\n- Couvre le risque de décès pendant une période définie\n- Protège la famille en cas de disparition du chef de ménage\n- **Exemple de prime :** 15 000 XOF/mois pour 20M XOF de capital garanti\n\n### 2. L''assurance vie épargne\n- Épargne avec garantie en cas de décès\n- Rendement garanti + participation aux bénéfices\n- **Compagnies agréées CIMA :** SUNU Assurances, NSIA, Allianz, AXA\n\n### 3. La retraite complémentaire\n- Versements réguliers pendant la vie active\n- Capital ou rente à la retraite\n\n## La transmission du patrimoine selon le droit OHADA\n\n### Le testament\nEn droit OHADA, le testament olographe est valide s''il est :\n- Entièrement écrit à la main\n- Daté\n- Signé\n\n### La donation entre vifs\nTransférer des biens de son vivant pour réduire les conflits successoraux.\n\n### Le conseil\nConsultez un notaire dès que votre patrimoine dépasse 20 millions XOF. Le coût d''un acte notarié (50 000 à 200 000 XOF) est négligeable face aux conflits familiaux qu''il évite.');

END $$;
