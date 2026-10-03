const fr = {
  locale: 'fr',
  // Navigation
  nav: {
    courses: 'Formations',
    catalog: 'Tout le catalogue',
    catalogDesc: '184+ formations certifiantes',
    featured: 'Formations vedettes',
    featuredDesc: 'Les plus populaires',
    paths: 'Parcours métiers',
    pathsDesc: 'Progressions guidées',
    enterprise: 'Entreprise',
    blog: 'Blog',
    login: 'Connexion',
    register: "S'inscrire",
    dashboard: 'Mon espace',
    logout: 'Déconnexion',
  },
  // Hero / Home
  home: {
    heroTitle: 'Formez-vous aux métiers',
    heroTitleAccent: "d'aujourd'hui et de demain",
    heroSubtitle: 'La plateforme de référence pour la formation professionnelle en Afrique. Certifiez vos compétences avec des formateurs experts.',
    ctaStart: 'Commencer gratuitement',
    ctaExplore: 'Explorer les formations',
    statsLearners: 'apprenants actifs',
    statsCourses: 'formations certifiantes',
    statsCountries: 'pays couverts',
    statsCerts: 'certificats délivrés',
    featuredTitle: 'Formations en vedette',
    featuredSubtitle: 'Sélectionnées par notre équipe pédagogique',
    allCourses: 'Voir toutes les formations',
    categoriesTitle: 'Explorez par domaine',
    whyTitle: 'Pourquoi choisir IBIG E-LEARNING ?',
    testimonialsTitle: 'Ce que disent nos apprenants',
    ctaTitle: 'Prêt à développer vos compétences ?',
    ctaSubtitle: 'Rejoignez des milliers d\'apprenants à travers l\'Afrique',
    ctaButton: 'Démarrer maintenant',
  },
  // Catalogue
  catalog: {
    title: 'Catalogue de formations',
    subtitle: 'Trouvez la formation qui correspond à vos objectifs',
    search: 'Rechercher une formation...',
    allCategories: 'Toutes les catégories',
    allLevels: 'Tous les niveaux',
    allPrices: 'Tous les prix',
    free: 'Gratuit',
    paid: 'Payant',
    beginner: 'Débutant',
    intermediate: 'Intermédiaire',
    advanced: 'Avancé',
    results: 'formation(s) trouvée(s)',
    noResults: 'Aucune formation ne correspond à vos critères',
    enroll: "S'inscrire",
    freeBadge: 'Gratuit',
    xof: 'XOF',
  },
  // Formation detail
  course: {
    enroll: "S'inscrire maintenant",
    enrollFree: "S'inscrire gratuitement",
    alreadyEnrolled: 'Continuer la formation',
    price: 'Prix',
    free: 'Gratuit',
    instructor: 'Formateur',
    duration: 'Durée',
    level: 'Niveau',
    students: 'apprenants',
    certificate: 'Certificat inclus',
    whatYouLearn: 'Ce que vous allez apprendre',
    curriculum: 'Programme',
    aboutInstructor: 'À propos du formateur',
    reviews: 'Avis',
    beginner: 'Débutant',
    intermediate: 'Intermédiaire',
    advanced: 'Avancé',
  },
  // Footer
  footer: {
    tagline: 'La plateforme de formation professionnelle panafricaine',
    learn: 'Apprendre',
    catalog: 'Catalogue',
    paths: 'Parcours',
    certifications: 'Certifications',
    teach: 'Enseigner',
    becomeInstructor: 'Devenir formateur',
    enterprise: 'Solutions entreprise',
    company: 'Entreprise',
    about: 'À propos',
    blog: 'Blog',
    faq: 'FAQ',
    contact: 'Contact',
    legal: 'Légal',
    cgu: 'CGU',
    cgv: 'CGV',
    privacy: 'Confidentialité',
    mentions: 'Mentions légales',
    rights: 'Tous droits réservés.',
    countries: '12 pays · Afrique francophone',
  },
  // Auth
  auth: {
    loginTitle: 'Bon retour !',
    loginSubtitle: 'Connectez-vous à votre compte',
    email: 'Adresse email',
    password: 'Mot de passe',
    forgotPassword: 'Mot de passe oublié ?',
    loginBtn: 'Se connecter',
    noAccount: 'Pas encore de compte ?',
    registerLink: "Créer un compte",
    registerTitle: 'Créez votre compte',
    registerSubtitle: 'Rejoignez la communauté IBIG E-LEARNING',
    fullName: 'Nom complet',
    country: 'Pays',
    registerBtn: "S'inscrire",
    hasAccount: 'Déjà un compte ?',
    loginLink: 'Se connecter',
  },
  // Common
  common: {
    loading: 'Chargement...',
    error: 'Une erreur est survenue',
    save: 'Enregistrer',
    cancel: 'Annuler',
    confirm: 'Confirmer',
    delete: 'Supprimer',
    edit: 'Modifier',
    close: 'Fermer',
    back: 'Retour',
    next: 'Suivant',
    previous: 'Précédent',
    search: 'Rechercher',
    filter: 'Filtrer',
    all: 'Tout',
    yes: 'Oui',
    no: 'Non',
    seeAll: 'Voir tout',
    learnMore: 'En savoir plus',
    by: 'Par',
    hours: 'heures',
    minutes: 'minutes',
    lessons: 'leçons',
    modules: 'modules',
  },
  // Enterprise page
  enterprise: {
    title: 'Solutions Entreprise',
    subtitle: 'Formez vos équipes avec IBIG E-LEARNING',
    hero: 'Accélérez la montée en compétences de vos collaborateurs',
    contactBtn: 'Nous contacter',
    discoverBtn: 'Découvrir nos offres',
  },
  // Become instructor
  instructor: {
    title: 'Devenez formateur',
    subtitle: 'Partagez votre expertise avec des milliers d\'apprenants',
    applyBtn: 'Soumettre ma candidature',
  },
}

export type Translations = {
  locale: string
  nav: { courses: string; catalog: string; catalogDesc: string; featured: string; featuredDesc: string; paths: string; pathsDesc: string; enterprise: string; blog: string; login: string; register: string; dashboard: string; logout: string }
  home: { heroTitle: string; heroTitleAccent: string; heroSubtitle: string; ctaStart: string; ctaExplore: string; statsLearners: string; statsCourses: string; statsCountries: string; statsCerts: string; featuredTitle: string; featuredSubtitle: string; allCourses: string; categoriesTitle: string; whyTitle: string; testimonialsTitle: string; ctaTitle: string; ctaSubtitle: string; ctaButton: string }
  catalog: { title: string; subtitle: string; search: string; allCategories: string; allLevels: string; allPrices: string; free: string; paid: string; beginner: string; intermediate: string; advanced: string; results: string; noResults: string; enroll: string; freeBadge: string; xof: string }
  course: { enroll: string; enrollFree: string; alreadyEnrolled: string; price: string; free: string; instructor: string; duration: string; level: string; students: string; certificate: string; whatYouLearn: string; curriculum: string; aboutInstructor: string; reviews: string; beginner: string; intermediate: string; advanced: string }
  footer: { tagline: string; learn: string; catalog: string; paths: string; certifications: string; teach: string; becomeInstructor: string; enterprise: string; company: string; about: string; blog: string; faq: string; contact: string; legal: string; cgu: string; cgv: string; privacy: string; mentions: string; rights: string; countries: string }
  auth: { loginTitle: string; loginSubtitle: string; email: string; password: string; forgotPassword: string; loginBtn: string; noAccount: string; registerLink: string; registerTitle: string; registerSubtitle: string; fullName: string; country: string; registerBtn: string; hasAccount: string; loginLink: string }
  common: { loading: string; error: string; save: string; cancel: string; confirm: string; delete: string; edit: string; close: string; back: string; next: string; previous: string; search: string; filter: string; all: string; yes: string; no: string; seeAll: string; learnMore: string; by: string; hours: string; minutes: string; lessons: string; modules: string }
  enterprise: { title: string; subtitle: string; hero: string; contactBtn: string; discoverBtn: string }
  instructor: { title: string; subtitle: string; applyBtn: string }
}

const typed: Translations = fr
export default typed
