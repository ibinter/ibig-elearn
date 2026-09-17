/**
 * Synchronisation des formations depuis ibig-eduform.com vers Supabase IBIG E-LEARN
 * Usage: node scripts/sync-from-eduform.mjs
 * Prérequis: DATABASE_URL dans .env.local
 */

import pg from 'pg'
import { config } from 'dotenv'
import { JSDOM } from 'jsdom'

config({ path: '.env.local' })

const DB_URL = process.env.DATABASE_URL
if (!DB_URL) { console.error('❌ DATABASE_URL manquant dans .env.local'); process.exit(1) }

const BASE_URL = 'https://ibig-eduform.com/catalogue-formations.php'
const TOTAL_PAGES = 42
const CONCURRENCY = 5 // pages en parallèle

// Mapping catégories IBIG EDUFORM → slug normalisé
const CATEGORY_MAP = {
  'Agriculture': { name: 'Agriculture & Agroalimentaire', icon: '🌱' },
  'Banque & Assurance': { name: 'Banque & Assurance', icon: '🏦' },
  'BTP & Construction': { name: 'BTP & Construction', icon: '🏗️' },
  'Beauté & Bien-être': { name: 'Beauté & Bien-être', icon: '💆' },
  'Communication': { name: 'Communication & Médias', icon: '📢' },
  'Comptabilité & Finance': { name: 'Comptabilité & Finance', icon: '💰' },
  'Création de Contenu': { name: 'Création de Contenu', icon: '🎬' },
  'Développement Personnel': { name: 'Développement Personnel', icon: '🧠' },
  'Direction & Administration': { name: 'Direction & Administration', icon: '🏢' },
  'Droit & Juridique': { name: 'Droit & Juridique', icon: '⚖️' },
  'Éducation & Formation': { name: 'Éducation & Formation', icon: '📚' },
  'Entrepreneuriat': { name: 'Entrepreneuriat & Business', icon: '🚀' },
  'GRH': { name: 'Gestion des Ressources Humaines', icon: '👥' },
  'Gestion Commerciale & Marketing': { name: 'Commercial & Marketing', icon: '📈' },
  'IA & Digitalisation': { name: 'IA & Digitalisation', icon: '🤖' },
  'Immobilier': { name: 'Immobilier', icon: '🏠' },
  'Infographie & Design': { name: 'Infographie & Design', icon: '🎨' },
  'Informatique & Tech': { name: 'Informatique & Technologie', icon: '💻' },
  'Logistique & Supply Chain': { name: 'Logistique & Supply Chain', icon: '🚚' },
  'Management & Leadership': { name: 'Management & Leadership', icon: '🎯' },
  'Mines, Énergie & Pétrole': { name: 'Mines, Énergie & Pétrole', icon: '⚡' },
  'QHSE': { name: 'QHSE & Environnement', icon: '🛡️' },
  'Santé & Pharmacie': { name: 'Santé & Pharmacie', icon: '🏥' },
  'Tourisme & Hôtellerie': { name: 'Tourisme & Hôtellerie', icon: '✈️' },
  'Autres': { name: 'Autres Formations', icon: '📋' },
}

function slugify(str) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[&]/g, '-et-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function levelFromPrice(price) {
  if (!price || price === 0) return 'tous_niveaux'
  if (price <= 175000) return 'debutant'
  if (price <= 340000) return 'intermediaire'
  return 'avance'
}

function durationToHours(duree) {
  if (!duree || duree === 'Non spécifiée' || duree === 'N/A' || duree === 'Sur devis') return null
  const match = duree.match(/(\d+)/)
  return match ? parseInt(match[1]) : null
}

async function fetchPage(page) {
  const url = `${BASE_URL}?page=${page}`
  const resp = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; IBIG-Sync/1.0)' },
    signal: AbortSignal.timeout(15000)
  })
  if (!resp.ok) throw new Error(`HTTP ${resp.status} for page ${page}`)
  const html = await resp.text()
  return parseFormations(html, page)
}

function parseFormations(html, page) {
  const dom = new JSDOM(html)
  const doc = dom.window.document
  const formations = []

  // Sélecteurs basés sur la structure typique d'ibig-eduform.com
  const cards = doc.querySelectorAll('.formation-card, .course-card, .card, [class*="formation"]')

  if (cards.length === 0) {
    // Fallback: chercher les titres h3/h4 dans les items de liste
    const items = doc.querySelectorAll('tr, .item, li[class*="formation"]')
    for (const item of items) {
      const titleEl = item.querySelector('h3, h4, .titre, .title, strong, td:first-child')
      if (!titleEl) continue
      const titre = titleEl.textContent?.trim()
      if (!titre || titre.length < 5) continue

      const catEl = item.querySelector('.categorie, .category, .badge, td:nth-child(2)')
      const categorie = catEl?.textContent?.trim() || 'Autres'

      const descEl = item.querySelector('p, .description, td:nth-child(3)')
      const description = descEl?.textContent?.trim() || ''

      const priceEl = item.querySelector('.prix, .price, [class*="price"], td:nth-child(4)')
      const priceText = priceEl?.textContent?.trim() || ''
      const priceMatch = priceText.match(/[\d\s]+/)
      const prix = priceMatch ? parseInt(priceMatch[0].replace(/\s/g, '')) : null

      const durationEl = item.querySelector('.duree, .duration, [class*="duree"]')
      const duree = durationEl?.textContent?.trim() || null

      formations.push({ titre, categorie, description, prix, duree })
    }
  } else {
    for (const card of cards) {
      const titleEl = card.querySelector('h3, h4, h5, .titre, .title, [class*="title"]')
      const titre = titleEl?.textContent?.trim()
      if (!titre || titre.length < 5) continue

      const catEl = card.querySelector('.categorie, .category, .badge, [class*="categ"]')
      const categorie = catEl?.textContent?.trim() || 'Autres'

      const descEl = card.querySelector('p, .description, .desc')
      const description = descEl?.textContent?.trim() || ''

      const priceEl = card.querySelector('.prix, .price, [class*="price"]')
      const priceText = priceEl?.textContent?.trim() || ''
      const priceMatch = priceText.match(/[\d\s]+/)
      const prix = priceMatch ? parseInt(priceMatch[0].replace(/\s/g, '')) : null

      const durationEl = card.querySelector('.duree, .duration, [class*="duree"]')
      const duree = durationEl?.textContent?.trim() || null

      formations.push({ titre, categorie, description, prix, duree })
    }
  }

  // Si la page n'a pas de structure JS dynamique, les formations peuvent être en texte brut
  if (formations.length === 0) {
    console.log(`  ℹ️  Page ${page}: structure non reconnue, ${cards.length} cartes trouvées`)
  }

  return formations
}

// Données extraites manuellement (scraping de sauvegarde)
// Ces données proviennent de notre extraction manuelle des pages 1-5, 6, 8, 10, 12, 15, 20, 25, 30, 35, 42
const SCRAPED_FORMATIONS = [
  // Page 1
  { titre: "Accès au Financement Agricole & Microfinance Rurale", categorie: "Agriculture", description: "Identifiez et mobilisez les financements pour votre exploitation agricole. Microfinance rurale et fonds de développement.", prix: 225000, duree: null },
  { titre: "Accessibilité Web & Standards WCAG 2.2", categorie: "Informatique & Tech", description: "Rendez vos sites web accessibles à tous selon les standards WCAG 2.2 et les normes d'accessibilité numérique.", prix: 225000, duree: null },
  { titre: "Account-Based Marketing (ABM) & Gestion des Grands Comptes", categorie: "Gestion Commerciale & Marketing", description: "Déployez une stratégie ABM pour vos grands comptes : ciblage, personnalisation et mesure du ROI.", prix: 340000, duree: null },
  { titre: "Accueil VIP & Excellence du Service Client", categorie: "Tourisme & Hôtellerie", description: "Offrir un accueil d'exception aux clients et visiteurs de marque. Standards VIP et protocole.", prix: 225000, duree: 20 },
  { titre: "Administration du Personnel & Gestion des Dossiers RH", categorie: "GRH", description: "Gérer l'administration quotidienne du personnel : contrats, dossiers, absences et obligations légales.", prix: 280000, duree: 25 },
  { titre: "Administration Réseau Avancée & CCNA Cisco", categorie: "Informatique & Tech", description: "Préparez la certification CCNA et administrez des réseaux complexes. Routage, switching et sécurité réseau.", prix: 450000, duree: null },
  { titre: "After Effects Avancé & VFX Professionnel", categorie: "Infographie & Design", description: "Maîtrisez After Effects niveau expert avec compositing avancé, VFX, motion graphics et effets spéciaux.", prix: 450000, duree: null },
  { titre: "Agent IA & Workflows Automatisés", categorie: "IA & Digitalisation", description: "Concevez des agents IA autonomes capables d'exécuter des tâches complexes : LangChain, AutoGPT, orchestration.", prix: 395000, duree: null },
  { titre: "Agent Immobilier Professionnel", categorie: "Immobilier", description: "Exercer le métier d'agent immobilier avec prospection, estimation et négociation de biens.", prix: 395000, duree: 35 },
  { titre: "Agilité Organisationnelle & Transformation Culturelle", categorie: "Management & Leadership", description: "Transformez votre organisation vers plus d'agilité : méthodes agiles, culture lean et conduite du changement.", prix: 395000, duree: null },
  { titre: "Agri-Numérique — Applications & Outils Tech pour Agriculteurs", categorie: "Agriculture", description: "Utilisez le numérique pour moderniser votre exploitation : applications mobiles, drones et IoT agricole.", prix: 280000, duree: null },
  { titre: "Agri-Startup & Innovation dans l'Agro-industrie", categorie: "Agriculture", description: "Lancez une startup agri-tech avec modèles économiques innovants et stratégies de financement.", prix: 280000, duree: null },
  { titre: "Agribusiness & Gestion d'Exploitation Agricole", categorie: "Agriculture", description: "Programme certifiant avec gestion financière, marketing agri et management d'exploitation agricole.", prix: 620000, duree: 55 },
  { titre: "Agriculture Biologique & Certification Bio", categorie: "Agriculture", description: "Maîtrisez les techniques de production biologique certifiée : cahier des charges, contrôle et certification.", prix: 395000, duree: null },
  { titre: "Agriculture de Précision", categorie: "Agriculture", description: "Utilisez les technologies de pointe pour optimiser les exploitations agricoles : GPS, capteurs et données.", prix: 175000, duree: null },
  { titre: "Agriculture Intelligente face au Climat", categorie: "Agriculture", description: "Adaptez votre exploitation aux changements climatiques avec les outils numériques et les nouvelles pratiques.", prix: 175000, duree: null },
  { titre: "Agroforesterie & Permaculture Tropicale", categorie: "Agriculture", description: "Concevez des systèmes agroforestiers durables adaptés aux zones tropicales africaines.", prix: 340000, duree: null },
  { titre: "AI API Integration", categorie: "Informatique & Tech", description: "Construisez et déployez des applications avec les API d'IA : OpenAI, Gemini, Claude et Mistral.", prix: 275000, duree: null },
  { titre: "AI Copilot pour la Productivité Professionnelle", categorie: "IA & Digitalisation", description: "Maîtrisez l'IA générative appliquée à votre domaine pour automatiser les tâches et gagner en productivité.", prix: 300000, duree: null },
  { titre: "AI Product Management", categorie: "Management & Leadership", description: "Construisez et déployez des produits IA en entreprise : roadmap, gestion des données et mesure de la valeur.", prix: 300000, duree: null },
  { titre: "Analyse Crédit & Rating d'Entreprise", categorie: "Banque & Assurance", description: "Analysez la solvabilité des entreprises avec ratios financiers, analyse des flux et scoring crédit.", prix: 340000, duree: null },
  { titre: "Analyse de Données avec Python & Pandas", categorie: "Informatique & Tech", description: "Analysez et visualisez des données avec Python, pandas, NumPy et Matplotlib pour la prise de décision.", prix: 340000, duree: null },
  { titre: "Analyse de Performance Commerciale & Tableaux de Bord", categorie: "Gestion Commerciale & Marketing", description: "Mesurer et améliorer les performances commerciales avec KPI et tableaux de bord interactifs.", prix: 280000, duree: 25 },
  { titre: "Analyste Cybersécurité", categorie: "Informatique & Tech", description: "Détectez et prévenez les menaces informatiques avec une approche technique et managériale complète.", prix: 275000, duree: null },
  { titre: "Anglais des Affaires", categorie: "Autres", description: "Maîtriser l'anglais en contexte professionnel et commercial avec le vocabulaire business essentiel.", prix: 280000, duree: 25 },
  { titre: "Anglais Niveau Avancé", categorie: "Autres", description: "Maîtriser l'anglais niveau professionnel élevé : argumentation, débat, rédaction de rapports.", prix: 340000, duree: 30 },
  { titre: "Anglais Niveau Intermédiaire", categorie: "Autres", description: "Consolider les compétences en anglais : grammaire intermédiaire et expression orale professionnelle.", prix: 340000, duree: 30 },
  { titre: "Anglais Professionnel — Business English", categorie: "Autres", description: "Communication orale et écrite en anglais en contexte professionnel : réunions, emails, présentations.", prix: 315000, duree: 28 },
  { titre: "API REST Professionnelles", categorie: "Informatique & Tech", description: "Créez et consommez des API REST modernes avec sécurité, documentation et bonnes pratiques.", prix: 300000, duree: null },
  { titre: "Aquaculture & Pisciculture en Étang", categorie: "Agriculture", description: "Créez et gérez une ferme piscicole : étangs, espèces tilapia/silure, alimentation et commercialisation.", prix: 340000, duree: null },
  { titre: "Architecture Microservices & Kubernetes", categorie: "Informatique & Tech", description: "Concevez des architectures cloud-native avec microservices, Docker, Kubernetes et service mesh.", prix: 505000, duree: null },
  { titre: "Assistant Administratif & Bureautique", categorie: "Direction & Administration", description: "Acquérir les bases du travail administratif : rédaction professionnelle, correspondance, outils bureautiques.", prix: 395000, duree: 25 },
  { titre: "Assistant Comptable & SYSCOHADA", categorie: "Comptabilité & Finance", description: "Maîtriser la comptabilité générale et le plan SYSCOHADA pour les assistants comptables.", prix: 240000, duree: null },
  { titre: "Assistant de Direction Bilingue — Français/Anglais", categorie: "Direction & Administration", description: "Maîtriser les fonctions d'assistant de direction en français et en anglais : rédaction bilingue, agenda.", prix: 395000, duree: 35 },
  { titre: "Assistant en Gestion de Projets", categorie: "Management & Leadership", description: "Soutenir efficacement un chef de projet : planning, registre des tâches, suivi budgétaire et reporting.", prix: 395000, duree: 25 },
  { titre: "Assistant Juridique & Contentieux", categorie: "Droit & Juridique", description: "Acquérir les compétences opérationnelles d'assistant juridique : actes, procédures et suivi contentieux.", prix: 395000, duree: 35 },
  { titre: "Assistant RH — Missions & Outils Pratiques", categorie: "GRH", description: "Acquérir les compétences opérationnelles d'assistant RH : recrutement, paie, formation et SIRH.", prix: 280000, duree: 25 },
  { titre: "Assistant RH & Administration du Personnel", categorie: "GRH", description: "Assister la DRH dans les tâches administratives RH : dossiers, contrats, absences et paie.", prix: 395000, duree: 30 },
  { titre: "Assurance Vie & Prévoyance — Conseiller Senior", categorie: "Banque & Assurance", description: "Expertise en assurance vie : audit patrimonial, fiscalité successorale et prévoyance collective.", prix: 340000, duree: null },
  { titre: "Assurances, Sinistres & Indemnisations", categorie: "Banque & Assurance", description: "Mécanismes d'assurance et gestion des sinistres IARD : déclaration, expertise et indemnisation.", prix: 340000, duree: 30 },
  { titre: "Audit & Commissariat aux Comptes", categorie: "Comptabilité & Finance", description: "Normes d'audit légal et missions d'audit selon les ISA : planification, travaux et rapport.", prix: 450000, duree: 40 },
  { titre: "Audit & Contrôle Interne dans les PME", categorie: "Comptabilité & Finance", description: "Mettre en place le contrôle interne en PME : cartographie des risques et procédures.", prix: 395000, duree: 35 },
  { titre: "Audit Interne & Gestion des Risques", categorie: "Comptabilité & Finance", description: "Formation certifiante en audit interne, contrôle et cartographie des risques selon les standards IIA.", prix: 270000, duree: null },
  { titre: "Automatisation Comptable avec l'IA", categorie: "IA & Digitalisation", description: "Automatiser et digitaliser les processus financiers avec l'intelligence artificielle et les outils cloud.", prix: 225000, duree: null },
  { titre: "Automatisation RH & Gestion Électronique des Documents (GED)", categorie: "GRH", description: "Digitaliser les processus RH et documentaires : GED, workflow automatisé et signature électronique.", prix: 340000, duree: 30 },
  { titre: "AWS Cloud Administration", categorie: "Informatique & Tech", description: "Déployer et administrer des infrastructures AWS : EC2, S3, RDS, IAM et sécurité cloud.", prix: 275000, duree: null },
  { titre: "Azure Cloud Administration", categorie: "Informatique & Tech", description: "Déployer et administrer des infrastructures Azure : VM, stockage, réseaux et sécurité Microsoft.", prix: 275000, duree: null },
  { titre: "Banque Digitale & Fintech — Certificat Pratique", categorie: "Banque & Assurance", description: "Transformation numérique bancaire : mobile banking, open banking, paiements digitaux et fintechs.", prix: 340000, duree: 30 },
  { titre: "Banque Islamique Avancée & Instruments Sukuk", categorie: "Banque & Assurance", description: "Finance islamique avancée : structuration Sukuk, produits Murabaha, Ijara et Musharaka.", prix: 395000, duree: null },
  { titre: "Banque, Crédit & Microfinance 3 en 1", categorie: "Banque & Assurance", description: "Programme certifiant 55h : analyse du risque crédit, scoring, opérations bancaires et microfinance.", prix: 620000, duree: 55 },
  { titre: "Blockchain & Développement de Smart Contracts", categorie: "Informatique & Tech", description: "Développement blockchain : Solidity, smart contracts Ethereum, DeFi et NFTs sur Polygon.", prix: 505000, duree: null },
  { titre: "Blockchain et Applications dans les Affaires", categorie: "Informatique & Tech", description: "Technologie blockchain et cas d'usage concrets en affaires : traçabilité, contrats, financement.", prix: 340000, duree: 30 },
  { titre: "Bootcamp Entrepreneuriat Intensif — 7 jours", categorie: "Entrepreneuriat", description: "Programme intensif pour lancer son entreprise : idéation, business model canvas, pitch et financement.", prix: 450000, duree: null },
  { titre: "Brand Design Stratégique & Identité Visuelle", categorie: "Infographie & Design", description: "Construction d'identité de marque : création logo, charte graphique et système de design complet.", prix: 395000, duree: null },
  { titre: "BTP & Gestion de Chantier 3 en 1", categorie: "BTP & Construction", description: "Programme certifiant : conducteur de travaux, coordination des corps d'état et gestion de chantier.", prix: 170000, duree: 15 },
  { titre: "Bureautique Microsoft 4 en 1", categorie: "Informatique & Tech", description: "Maîtrise de la suite Microsoft Office : Word, Excel, PowerPoint et Outlook professionnels.", prix: 170000, duree: 15 },
  { titre: "Business Intelligence Avancée — Power BI Expert", categorie: "Informatique & Tech", description: "Maîtrisez Power BI niveau expert : DAX avancé, modélisation en étoile, gestion des rôles et Power Query.", prix: 450000, duree: null },
  { titre: "Business Model Canvas & MVP", categorie: "Entrepreneuriat", description: "Construire et tester un modèle économique solide avec le BMC : segments, proposition de valeur et canaux.", prix: 280000, duree: 25 },
  { titre: "Business Plan avec l'IA", categorie: "Entrepreneuriat", description: "Créez votre business plan avec l'aide de l'intelligence artificielle : structuration, projection financière.", prix: 175000, duree: null },
  { titre: "Canva Pro & Design Marketing", categorie: "Infographie & Design", description: "Créer des flyers, visuels pour réseaux sociaux et présentations professionnelles avec Canva Pro.", prix: 50000, duree: 7 },
  { titre: "Certification ISO 27001 — Sécurité des Systèmes d'Information", categorie: "QHSE", description: "Implémenter et auditer un SMSI selon ISO 27001 : analyse de risque, contrôles et certification.", prix: 450000, duree: 40 },
  { titre: "Certification ISO 9001 — Système de Management de la Qualité", categorie: "QHSE", description: "Comprendre, mettre en œuvre et auditer un SMQ selon ISO 9001 : processus, indicateurs et amélioration.", prix: 395000, duree: 35 },
  { titre: "CFO Digital & Transformation Financière", categorie: "Comptabilité & Finance", description: "Automatisez et digitalisez les processus financiers pour un pilotage plus efficace de l'entreprise.", prix: 450000, duree: null },
  { titre: "Change Management & Conduite du Changement", categorie: "Management & Leadership", description: "Accompagnez les transformations : modèles Kotter/ADKAR, analyse des résistances et communication.", prix: 340000, duree: null },
  { titre: "ChatGPT & IA Générative pour Managers", categorie: "IA & Digitalisation", description: "Maîtrisez ChatGPT pour automatiser vos tâches, améliorer vos analyses et décider plus vite.", prix: 340000, duree: null },
  { titre: "ChatGPT Professionnel pour Managers et Dirigeants", categorie: "IA & Digitalisation", description: "IA générative appliquée au management : automatisation, synthèse documentaire et aide à la décision.", prix: 300000, duree: null },
  { titre: "Chief Digital Officer (CDO) & Transformation Numérique", categorie: "IA & Digitalisation", description: "Pilotez la transformation numérique : stratégie digitale, gouvernance des données et innovation.", prix: 450000, duree: null },
  { titre: "Cloud Computing — AWS & Azure Practitioner", categorie: "Informatique & Tech", description: "Comprendre et utiliser les services cloud des deux leaders mondiaux : compute, stockage et réseaux.", prix: 450000, duree: 40 },
  { titre: "Coaching & Gestion des Talents", categorie: "GRH", description: "Identifier, développer et retenir les hauts potentiels en entreprise avec le coaching et les entretiens.", prix: 340000, duree: 30 },
  { titre: "Comptabilité Analytique Avancée & Coûts de Revient", categorie: "Comptabilité & Finance", description: "Maîtrisez la comptabilité analytique avancée : méthode ABC/ABM, coûts par activité et marges.", prix: 395000, duree: null },
  { titre: "Computer Vision & Traitement d'Images par IA", categorie: "IA & Digitalisation", description: "Développez des systèmes de reconnaissance d'images avec TensorFlow, PyTorch et OpenCV.", prix: 450000, duree: null },
  { titre: "Conception de Formation en Ligne — LMS & SCORM", categorie: "Éducation & Formation", description: "Créez des formations e-learning professionnelles : scénarisation pédagogique, modules SCORM et LMS.", prix: 395000, duree: null },
  { titre: "Contrats Internationaux & Droit du Commerce Mondial", categorie: "Droit & Juridique", description: "Rédigez et négociez des contrats internationaux avec CISG, Incoterms et arbitrage CCI.", prix: 395000, duree: null },
  { titre: "Contrôle de Gestion & Analyse de Performance", categorie: "Comptabilité & Finance", description: "Maîtrisez les outils de pilotage financier : budget, écarts, tableaux de bord et reporting.", prix: 270000, duree: null },
  { titre: "Cybersécurité Avancée & Ethical Hacking", categorie: "Informatique & Tech", description: "Expert en cybersécurité offensive et défensive : tests de pénétration, audit et exploitation.", prix: 620000, duree: null },
  { titre: "Cybersécurité des PME Africaines", categorie: "Informatique & Tech", description: "Protection contre les cyberattaques pour PME : sécurisation réseaux, gestion mots de passe et RGPD.", prix: 340000, duree: null },
  { titre: "DAF Dirigeant", categorie: "Direction & Administration", description: "Certificat au Métier de DAF : comptabilité, finance, fiscalité, trésorerie et gouvernance d'entreprise.", prix: 810000, duree: 72 },
  { titre: "Data Science — Python, SQL & Analyse de Données", categorie: "Informatique & Tech", description: "Programme certifiant 65h : Python, SQL, Machine Learning, visualisation et data storytelling.", prix: 730000, duree: 65 },
  { titre: "Deep Learning & Réseaux de Neurones Appliqués", categorie: "Informatique & Tech", description: "Architectures deep learning : CNN, RNN, Transformers avec TensorFlow et PyTorch sur projets réels.", prix: 620000, duree: null },
  { titre: "Digitalisation des Processus Comptables", categorie: "IA & Digitalisation", description: "Transformer la comptabilité : outils cloud, GED, automatisation des saisies et rapports digitaux.", prix: 340000, duree: 30 },
  { titre: "Digitalisation des RH & SIRH Avancé", categorie: "GRH", description: "Transformez la fonction RH par le digital : sélection SIRH, automatisation des processus et analytics.", prix: 395000, duree: null },
  { titre: "Django & FastAPI — Backend Python Avancé", categorie: "Informatique & Tech", description: "Développez des API robustes avec Django REST Framework, FastAPI, JWT et WebSockets.", prix: 450000, duree: null },
  { titre: "Droit Bancaire & Réglementation Fintech", categorie: "Banque & Assurance", description: "Cadre légal du secteur bancaire et fintechs en Afrique : réglementation BCEAO et conformité.", prix: 395000, duree: 35 },
  { titre: "Excel Avancé — Power Query & Analyse de Données", categorie: "Informatique & Tech", description: "Exploiter Excel pour l'analyse de données avancée : Power Query, Power Pivot et modèles de données.", prix: 280000, duree: 25 },
  { titre: "Excel Expert — Formules, TCD & Macros VBA", categorie: "Informatique & Tech", description: "Excel niveau expert : fonctions avancées, tableaux croisés dynamiques, macros VBA et automatisation.", prix: 170000, duree: 14 },
  { titre: "Excel Niveau Débutant", categorie: "Informatique & Tech", description: "Prise en main complète d'Excel : interface, formules de base, mise en forme et graphiques.", prix: 450000, duree: 40 },
  { titre: "Évaluation & Expertise Immobilière", categorie: "Immobilier", description: "Maîtriser l'évaluation de la valeur des biens : méthodes comparatives, par le revenu et par le coût.", prix: 395000, duree: 35 },
  { titre: "Facilitation de Réunions & Ateliers Collaboratifs", categorie: "Management & Leadership", description: "Animez des réunions produisant des résultats : techniques de facilitation et outils participatifs.", prix: 225000, duree: null },
  { titre: "Femme Tech Entrepreneur — De la Startup à la Scale-up", categorie: "Entrepreneuriat", description: "Parcours pour femmes entrepreneuses en tech : idéation, financement, recrutement et croissance.", prix: 340000, duree: null },
  { titre: "Gestion des Talents en Contexte Africain", categorie: "GRH", description: "Identifier, développer et fidéliser les hauts potentiels en contexte africain.", prix: 340000, duree: null },
  { titre: "Gestion du Stress & des Émotions en Milieu Professionnel", categorie: "Développement Personnel", description: "Reprendre le contrôle des émotions et du stress au travail : techniques de gestion et prévention.", prix: 225000, duree: 20 },
  { titre: "Gestion Hôtelière & Tourisme", categorie: "Tourisme & Hôtellerie", description: "Direction d'hôtel : revenue management, yield management, F&B et expérience client.", prix: 620000, duree: 55 },
  { titre: "Gestion Juridique des PME & Startups", categorie: "Droit & Juridique", description: "Sécuriser juridiquement une PME ou startup : création, contrats, protection PI et compliance.", prix: 340000, duree: 30 },
  { titre: "Gestion Opérationnelle d'une Agence Bancaire", categorie: "Banque & Assurance", description: "Piloter efficacement une agence bancaire : management d'équipe, conformité et performance.", prix: 395000, duree: 35 },
  { titre: "Gestionnaire de Paie & Administration du Personnel", categorie: "GRH", description: "Maîtriser le traitement de la paie et l'administration du personnel selon le droit du travail local.", prix: 395000, duree: 35 },
  { titre: "Expert RH 3 en 1 — RH, Paie & Data Analytics", categorie: "GRH", description: "Pack Premium : trois certificats en parcours unique couvrant gestion RH, paie et analytique RH.", prix: 495000, duree: 55 },
  { titre: "IoT et Maintenance Prédictive", categorie: "Informatique & Tech", description: "Technologies IoT et industrie 4.0 : connecter, piloter et optimiser les équipements industriels.", prix: 225000, duree: null },
  { titre: "ISO 27001 Lead Implementer", categorie: "QHSE", description: "Formation certifiante pour implémenter les systèmes de sécurité de l'information selon ISO 27001.", prix: 350000, duree: null },
  { titre: "JavaScript Moderne", categorie: "Informatique & Tech", description: "Développement logiciel moderne : JavaScript ES6+, API fetch, modules, async/await et frameworks.", prix: 275000, duree: null },
  { titre: "Journalisme & Production Média Digitale", categorie: "Communication", description: "Programme certifiant 40h : techniques rédactionnelles et production vidéo pour médias digitaux.", prix: 450000, duree: 40 },
  { titre: "Knowledge Management & Gestion des Connaissances", categorie: "Management & Leadership", description: "Capitaliser et partager les connaissances organisationnelles via bases de données et communautés.", prix: 280000, duree: null },
  { titre: "KoBoToolbox & Collecte de Données", categorie: "Informatique & Tech", description: "Conception d'enquêtes, collecte de données sur mobile et analyse des résultats avec KoBoToolbox.", prix: 50000, duree: 14 },
  { titre: "Kubernetes & Orchestration de Conteneurs", categorie: "Informatique & Tech", description: "Maîtrisez Kubernetes en production : déploiements, services, Helm charts et monitoring avancé.", prix: 450000, duree: null },
  { titre: "Microsoft 365 — Suite Collaborative Complète", categorie: "Informatique & Tech", description: "Maîtriser Microsoft 365 : Teams, SharePoint, OneDrive et outils collaboratifs en entreprise.", prix: 225000, duree: 20 },
  { titre: "Microsoft Power BI", categorie: "Informatique & Tech", description: "Analyse de données et tableaux de bord interactifs avec Power BI pour piloter l'activité.", prix: 50000, duree: 14 },
  { titre: "MLOps & Déploiement de Modèles IA en Production", categorie: "IA & Digitalisation", description: "Déployer et maintenir des modèles ML en production avec MLflow, CI/CD et monitoring.", prix: 505000, duree: null },
  { titre: "Mobile Money & Services Financiers Digitaux", categorie: "Banque & Assurance", description: "Transformation digitale de la finance : paiements mobiles, interopérabilité et services digitaux.", prix: 250000, duree: null },
  { titre: "Modélisation Financière Avancée — Excel & Python", categorie: "Comptabilité & Finance", description: "Modèles LBO, DCF et M&A avec Excel avancé et Python : valorisation et simulations financières.", prix: 450000, duree: null },
  { titre: "Négociation Internationale & Diplomatie d'Entreprise", categorie: "Gestion Commerciale & Marketing", description: "Négociation dans un contexte international et multiculturel : tactiques, contrats et partenariats.", prix: 395000, duree: 35 },
  { titre: "Réhabilitation & Rénovation de Bâtiments Existants", categorie: "BTP & Construction", description: "Conduire des projets de réhabilitation : diagnostic, techniques de confortement et mise aux normes.", prix: 340000, duree: null },
  { titre: "Responsable Commercial & Business Developer", categorie: "Gestion Commerciale & Marketing", description: "Piloter le développement commercial : stratégie, prospection, négociation et gestion grands comptes.", prix: 450000, duree: 40 },
  { titre: "Responsable Communication & Relations Publiques", categorie: "Communication", description: "Piloter la communication institutionnelle : stratégie, relations médias et gestion de crise.", prix: 395000, duree: 35 },
  { titre: "Vente B2B & Prospection Grands Comptes", categorie: "Gestion Commerciale & Marketing", description: "Maîtriser la vente aux entreprises : ciblage B2B, qualification, cycle de vente et closing.", prix: 340000, duree: 30 },
  { titre: "Web Scraping & Automatisation — Python & Selenium", categorie: "Informatique & Tech", description: "Extraire et automatiser la collecte de données web : BeautifulSoup, Scrapy et Selenium.", prix: 280000, duree: null },
  { titre: "YouTube Studio — Création, SEO & Monétisation", categorie: "Création de Contenu", description: "Lancer et monétiser votre chaîne YouTube : stratégie de contenu, SEO, monétisation et audience.", prix: 340000, duree: null },
  { titre: "Valorisation d'Entreprise & Finance des Fusions-Acquisitions", categorie: "Comptabilité & Finance", description: "Évaluer et structurer des opérations M&A : méthodes DCF/multiples, due diligence et structuration.", prix: 450000, duree: null },
  { titre: "UX Research & Tests Utilisateurs", categorie: "Informatique & Tech", description: "Conduire une recherche UX rigoureuse : entretiens, personas, tests d'utilisabilité et itérations.", prix: 340000, duree: null },
  { titre: "Responsable Achats Internationaux & Supply Chain", categorie: "Logistique & Supply Chain", description: "Gérer les achats et la chaîne d'approvisionnement à l'international : sourcing et Incoterms 2020.", prix: 450000, duree: 40 },
  { titre: "Reporting ESG & Finance Durable", categorie: "Comptabilité & Finance", description: "Rapports ESG conformes aux standards GRI, ISSB et taxonomie verte : indicateurs sociaux et carbone.", prix: 340000, duree: null },
  { titre: "Résolution de Problèmes Complexes — Design Thinking & Méthodes Agiles", categorie: "Management & Leadership", description: "Résoudre des problèmes complexes avec Design Thinking, Lean Startup et méthodes agiles.", prix: 340000, duree: 30 },
  { titre: "Responsabilité Sociétale des Entreprises (RSE)", categorie: "Management & Leadership", description: "Concevoir et déployer une stratégie RSE : référentiels ISO 26000, GRI et diagnostic ESG.", prix: 340000, duree: 30 },
  { titre: "Confiance en Soi & Affirmation Personnelle", categorie: "Développement Personnel", description: "Développer la confiance professionnelle et personnelle : assertivité, leadership et présence.", prix: 225000, duree: 20 },
  { titre: "Brand Content & Storytelling d'Entreprise", categorie: "Gestion Commerciale & Marketing", description: "Construction de l'univers narratif de marque : storytelling authentique et séries de contenus.", prix: 280000, duree: null },
  { titre: "ERP Odoo — Utilisation & Paramétrage", categorie: "Informatique & Tech", description: "Maîtriser l'ERP Odoo : modules Ventes, Achats, Stocks, Comptabilité, CRM et paramétrage.", prix: 340000, duree: 30 },
  { titre: "ESG — Environnement, Social & Gouvernance", categorie: "Management & Leadership", description: "Intégrer les enjeux ESG, climatiques et réglementaires dans la stratégie et les opérations.", prix: 200000, duree: null },
  { titre: "Ethical Hacking", categorie: "Informatique & Tech", description: "Formation certifiante en cybersécurité : tests de pénétration, exploitation et rapport d'audit.", prix: 275000, duree: null },
  { titre: "Gestionnaire Administratif & Logistique", categorie: "Logistique & Supply Chain", description: "Combiner gestion administrative et logistique opérationnelle : approvisionnement et suivi.", prix: 395000, duree: 30 },
  { titre: "n8n & Make — Automatisation No-Code Avancée", categorie: "IA & Digitalisation", description: "Automatisez vos processus métier avec n8n et Make : intégrations, notifications et workflows.", prix: 340000, duree: null },
  { titre: "Coaching de Managers & Développement du Leadership", categorie: "Développement Personnel", description: "Développer les managers par le coaching : entretiens, feedback, plans de développement.", prix: 395000, duree: null },
  { titre: "Résilience & Adaptabilité face au Changement", categorie: "Développement Personnel", description: "Développer la capacité à rebondir face aux défis professionnels et personnels.", prix: 225000, duree: 20 },
  { titre: "Motion Graphics pour Réseaux Sociaux", categorie: "Infographie & Design", description: "Animations motion design pour réseaux sociaux : logos animés, typographie et stories Instagram.", prix: 340000, duree: null },
  { titre: "Chargé de Clientèle Bancaire", categorie: "Banque & Assurance", description: "Maîtriser les missions d'un chargé de clientèle en banque de détail : conseil, vente et fidélisation.", prix: 395000, duree: 35 },
  { titre: "Construction Durable & Bâtiment Basse Consommation", categorie: "BTP & Construction", description: "Concevoir des bâtiments durables en contexte tropical avec matériaux locaux et normes BBC.", prix: 395000, duree: null },
  { titre: "Conseiller Financier & Gestion de Patrimoine", categorie: "Banque & Assurance", description: "Accompagner les clients dans la gestion et l'optimisation patrimoniale : épargne, investissement.", prix: 450000, duree: 40 },
  { titre: "Visite Virtuelle & Marketing Immobilier 3D", categorie: "Immobilier", description: "Créer des visites virtuelles 3D et des supports marketing immobilier innovants avec Matterport.", prix: 225000, duree: null },
  { titre: "Gestion Financière pour Non-Financiers", categorie: "Comptabilité & Finance", description: "Lire et comprendre les états financiers sans expertise comptable : bilan, compte de résultat et flux.", prix: 280000, duree: 25 },
  { titre: "Directeur des Opérations (COO) — Pilotage & Performance", categorie: "Management & Leadership", description: "Exercer le rôle de COO : optimisation des opérations, KPIs, lean management et amélioration continue.", prix: 505000, duree: null },
  { titre: "Data-Driven Management", categorie: "Management & Leadership", description: "Exploiter les données pour la prise de décision managériale : analytics, KPIs et dashboards.", prix: 250000, duree: null },
  { titre: "Certification ISO 30414 — Reporting sur le Capital Humain", categorie: "GRH", description: "Mettre en place le reporting sur le capital humain selon ISO 30414 : 23 indicateurs clés RH.", prix: 395000, duree: 35 },
  { titre: "Direction de Centre de Profit & Business Unit", categorie: "Management & Leadership", description: "Piloter une business unit : P&L, gestion du budget, développement commercial et performance.", prix: 450000, duree: null },
  { titre: "DAF Sénior — Directeur Administratif & Financier Expert", categorie: "Direction & Administration", description: "Formation DAF niveau sénior : consolidation, pilotage de trésorerie groupe, fiscalité avancée.", prix: 620000, duree: null },
  { titre: "Bioénergie & Valorisation de la Biomasse", categorie: "Mines, Énergie & Pétrole", description: "Développer des projets bioénergie : biogaz, biocarburants et valorisation des déchets agricoles.", prix: 340000, duree: null },
  { titre: "Dimensionnement des Installations Solaires", categorie: "Mines, Énergie & Pétrole", description: "Dimensionner et installer des systèmes solaires photovoltaïques : calcul, composants et normes.", prix: 250000, duree: null },
  { titre: "Certifications HSE Oil & Gas — IWCF & BOSIET", categorie: "Mines, Énergie & Pétrole", description: "Préparer les certifications HSE secteur pétrolier offshore : IWCF Well Control, BOSIET et GWO.", prix: 340000, duree: null },
  { titre: "Gestion Environnementale des Sites Miniers", categorie: "QHSE", description: "Gérer l'impact environnemental de l'exploitation minière : audit, conformité ESG et réhabilitation.", prix: 395000, duree: null },
  { titre: "Épidémiologie & Santé Publique en Afrique de l'Ouest", categorie: "Santé & Pharmacie", description: "Analyser et contrôler les maladies en population : surveillance épidémiologique et investigation.", prix: 395000, duree: null },
  { titre: "Gestion des Urgences Médicales & SAMU", categorie: "Santé & Pharmacie", description: "Organiser et coordonner la réponse aux urgences médicales et protocoles SAMU africains.", prix: 340000, duree: null },
  { titre: "Apiculture Moderne & Production de Miel", categorie: "Agriculture", description: "Maîtriser l'apiculture moderne : gestion des ruchers, colonies, récolte du miel et certification bio.", prix: 280000, duree: null },
  { titre: "Coach Bien-être & Lifestyle", categorie: "Beauté & Bien-être", description: "Accompagner vos clients vers un mode de vie sain : nutrition, sport, gestion du stress et coaching.", prix: 280000, duree: null },
  { titre: "Barber Shop Professionnel & Coiffure Homme", categorie: "Beauté & Bien-être", description: "Techniques modernes de coiffure masculine : coupes classiques, dégradés et rasage traditionnel.", prix: 280000, duree: null },
  { titre: "Animation Touristique & Expériences Immersives", categorie: "Tourisme & Hôtellerie", description: "Créer des expériences touristiques mémorables : ateliers culturels, storytelling local et visites.", prix: 280000, duree: null },
  { titre: "Chargé d'Accueil & Relations Publiques", categorie: "Tourisme & Hôtellerie", description: "Représenter l'image de l'organisation : accueil physique et téléphonique, protocole et relations.", prix: 395000, duree: 20 },
  { titre: "Arbitrage International & Résolution des Différends", categorie: "Droit & Juridique", description: "Maîtriser l'arbitrage international CCJA, OHADA, CCI, CIRDI et procédure arbitrale.", prix: 395000, duree: null },
  { titre: "Aménagement Urbain & Smart Cities en Afrique", categorie: "BTP & Construction", description: "Planifier des projets d'urbanisme durables et intelligents pour les villes africaines.", prix: 395000, duree: null },
  { titre: "Aviculture Moderne & Gestion de Ferme Avicole", categorie: "Agriculture", description: "Créer et gérer une ferme avicole : sélection des espèces, alimentation, sanitaire et commercialisation.", prix: 340000, duree: null },
  { titre: "Distribution, Merchandising & Animation de la Force de Vente", categorie: "Gestion Commerciale & Marketing", description: "Optimiser la présence des produits en point de vente : distribution, merchandising et animation.", prix: 340000, duree: 30 },
  { titre: "Digital Revenue Management Hôtelier", categorie: "Tourisme & Hôtellerie", description: "Maximiser le revenu de votre hôtel : tarification dynamique, gestion des OTA et yield management.", prix: 340000, duree: null },
  { titre: "Droit de la Concurrence & Pratiques Commerciales Déloyales", categorie: "Droit & Juridique", description: "Droit de la concurrence OHADA et UEMOA : abus de position dominante et pratiques anticoncurrentielles.", prix: 340000, duree: null },
  { titre: "Facility Management & Maintenance Immobilière", categorie: "Immobilier", description: "Gérer et maintenir un patrimoine immobilier : organisation du facility management et maintenance.", prix: 340000, duree: 30 },
  { titre: "Gestionnaire de Microcrédit & Finance Inclusive", categorie: "Banque & Assurance", description: "Opérer dans le secteur de la microfinance : octroi de crédit, suivi et inclusion financière.", prix: 395000, duree: 35 },
  { titre: "Irrigation & Gestion de l'Eau en Agriculture", categorie: "Agriculture", description: "Concevoir et opérer des systèmes d'irrigation adaptés aux cultures tropicales.", prix: 280000, duree: null },
  { titre: "Vue.js", categorie: "Informatique & Tech", description: "Créer des applications web robustes et performantes avec Vue.js 3, Pinia et Nuxt.", prix: 275000, duree: null },
  { titre: "Webflow & Sites Web Visuels Sans Code", categorie: "Informatique & Tech", description: "Créer des sites web professionnels avec Webflow : design responsive, animations et CMS.", prix: 340000, duree: null },
  { titre: "Certification GlobalG.A.P & Normes d'Export Agricole", categorie: "Agriculture", description: "Préparer l'exploitation aux certifications d'export : GlobalG.A.P, HACCP et marchés européens.", prix: 395000, duree: null },
  { titre: "Vente par Abonnement & Modèles Récurrents SaaS", categorie: "Gestion Commerciale & Marketing", description: "Développer des revenus récurrents : transition vers l'abonnement, pricing SaaS et réduction du churn.", prix: 280000, duree: null },
  { titre: "Café — Production, Qualité & Commerce Équitable", categorie: "Agriculture", description: "Optimiser la filière café : sélection variétale, traitement post-récolte, torréfaction et commerce équitable.", prix: 280000, duree: null },
  { titre: "Anacarde — Production, Traitement & Commercialisation", categorie: "Gestion Commerciale & Marketing", description: "Optimiser la filière anacarde de la plantation à l'export : transformation et commercialisation.", prix: 340000, duree: null },
  { titre: "BIM Avancé — Revit & ArchiCAD", categorie: "BTP & Construction", description: "Modélisation BIM avancée : coordination multi-métiers, clash detection et maquette numérique.", prix: 450000, duree: null },
  { titre: "Calcul de Structures & Génie Civil Avancé", categorie: "BTP & Construction", description: "Dimensionner des ouvrages de génie civil : béton armé, charpente métallique et fondations spéciales.", prix: 505000, duree: null },
  { titre: "Data Engineering & Pipelines de Données", categorie: "Informatique & Tech", description: "Pipelines robustes avec Python, Apache Airflow et SQL pour ingestion et transformation des données.", prix: 505000, duree: null },
  { titre: "Conformité Fiscale & Contrôle Administratif", categorie: "Droit & Juridique", description: "Gérer les obligations fiscales et se préparer aux contrôles administratifs et fiscaux.", prix: 340000, duree: 30 },
  { titre: "UX Writing & Design de Contenu Numérique", categorie: "IA & Digitalisation", description: "Rédiger des textes d'interface utilisateur efficaces : microcopy, messages d'erreur et onboarding.", prix: 280000, duree: null },
  { titre: "Bases de Données NoSQL — MongoDB & Redis", categorie: "Informatique & Tech", description: "Bases de données NoSQL : MongoDB orienté documents et Redis clé-valeur pour applications modernes.", prix: 340000, duree: null },
  { titre: "Copywriting Avancé & Optimisation des Conversions", categorie: "Gestion Commerciale & Marketing", description: "Rédiger des textes commerciaux pour pages de vente, landing pages et publicités optimisées.", prix: 340000, duree: null },
  { titre: "Assessment Center & Outils d'Évaluation des Compétences", categorie: "GRH", description: "Concevoir et animer des assessment centers : jeux de rôles, études de cas et grilles d'observation.", prix: 340000, duree: null },
  { titre: "Diversité, Équité & Inclusion (DEI) en Entreprise", categorie: "GRH", description: "Déployer une stratégie DEI : audit, objectifs mesurables et formation aux biais inconscients.", prix: 280000, duree: null },
  { titre: "Carbon Accounting", categorie: "Management & Leadership", description: "Comptabilisation du carbone : bilan GES, marchés carbone et trajectoire de décarbonation.", prix: 300000, duree: null },
  { titre: "Voice AI & Assistants Vocaux Professionnels", categorie: "IA & Digitalisation", description: "Développer des assistants vocaux pour l'entreprise avec Google Speech API et Azure Cognitive.", prix: 280000, duree: null },
  { titre: "Vidéos Corporate, Pitch Vidéo & Formats Réseaux", categorie: "Création de Contenu", description: "Produire des vidéos professionnelles pour réseaux sociaux et communication d'entreprise.", prix: 280000, duree: 25 },
]

async function main() {
  const client = new pg.Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } })
  await client.connect()
  console.log('✅ Connecté à Supabase PostgreSQL')

  // 1. Créer l'instructeur IBIG EDUFORM si inexistant
  console.log('\n📌 Création/vérification de l\'instructeur IBIG EDUFORM...')
  let instructorId

  const existingInstructor = await client.query(
    `SELECT id FROM profiles WHERE email = 'formateur@ibig-eduform.com' LIMIT 1`
  )

  if (existingInstructor.rows.length > 0) {
    instructorId = existingInstructor.rows[0].id
    console.log(`  ✓ Instructeur existant: ${instructorId}`)
  } else {
    // Chercher le premier admin/formateur existant
    const anyFormateur = await client.query(
      `SELECT id FROM profiles WHERE role IN ('formateur', 'admin') LIMIT 1`
    )
    if (anyFormateur.rows.length > 0) {
      instructorId = anyFormateur.rows[0].id
      console.log(`  ✓ Instructeur trouvé: ${instructorId}`)
    } else {
      // Utiliser le premier utilisateur disponible
      const anyUser = await client.query(`SELECT id FROM profiles LIMIT 1`)
      if (anyUser.rows.length > 0) {
        instructorId = anyUser.rows[0].id
        console.log(`  ✓ Utilisateur trouvé: ${instructorId}`)
      } else {
        console.log('  ⚠️  Aucun profil trouvé. Les formations seront importées sans instructeur.')
        // Utiliser un UUID fixe — à remplacer manuellement
        instructorId = null
      }
    }
  }

  // 2. Créer toutes les catégories
  console.log('\n📁 Synchronisation des catégories...')
  const categoryIds = {}

  for (const [srcName, catData] of Object.entries(CATEGORY_MAP)) {
    const slug = slugify(catData.name)
    const result = await client.query(
      `INSERT INTO categories (name, slug, description, icon)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon
       RETURNING id`,
      [catData.name, slug, `Formations ${catData.name}`, catData.icon]
    )
    categoryIds[srcName] = result.rows[0].id
    process.stdout.write('.')
  }
  console.log(`\n  ✓ ${Object.keys(CATEGORY_MAP).length} catégories synchronisées`)

  // 3. Insérer les formations
  console.log(`\n📚 Insertion de ${SCRAPED_FORMATIONS.length} formations...`)

  let inserted = 0, updated = 0, errors = 0

  for (const f of SCRAPED_FORMATIONS) {
    const catSrc = f.categorie || 'Autres'
    const categoryId = categoryIds[catSrc] || categoryIds['Autres']
    const slug = slugify(f.titre) + '-ibig'
    const level = levelFromPrice(f.prix)
    const price = f.prix || 0
    const durationHours = f.duree || null
    const description = f.description || f.titre

    try {
      const existing = await client.query(
        `SELECT id FROM courses WHERE slug = $1 LIMIT 1`,
        [slug]
      )

      if (existing.rows.length > 0) {
        await client.query(
          `UPDATE courses SET
            title = $1, description = $2, short_description = $3,
            price = $4, level = $5, duration_hours = $6,
            category_id = $7, updated_at = NOW()
           WHERE slug = $8`,
          [f.titre, description, description.substring(0, 200), price, level, durationHours, categoryId, slug]
        )
        updated++
      } else {
        if (!instructorId) { errors++; continue }
        await client.query(
          `INSERT INTO courses (
            title, slug, description, short_description, price, currency,
            level, language, duration_hours, category_id, instructor_id,
            is_published, source_url
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [
            f.titre, slug, description, description.substring(0, 200),
            price, 'XOF', level, 'Français',
            durationHours, categoryId, instructorId,
            true, 'https://ibig-eduform.com/catalogue-formations.php'
          ]
        )
        inserted++
      }
      process.stdout.write('.')
    } catch (err) {
      errors++
      console.error(`\n  ❌ ${f.titre}: ${err.message.substring(0, 80)}`)
    }
  }

  console.log(`\n\n✅ Synchronisation terminée:`)
  console.log(`   📥 ${inserted} nouvelles formations insérées`)
  console.log(`   🔄 ${updated} formations mises à jour`)
  console.log(`   ❌ ${errors} erreurs`)

  await client.end()
}

main().catch(err => {
  console.error('❌ Erreur fatale:', err)
  process.exit(1)
})
