import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://bgetgydgzfviddpcbdtq.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnZXRneWRnemZ2aWRkcGNiZHRxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTU5MzU3MSwiZXhwIjoyMTA1MTY5NTcxfQ.lV37Kf0HDszF0ctz2d0L9mLG-cPdilb7PwcMZu05QXI'

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function seed() {
  console.log('🌱 Début du seeding...')

  // Check schema
  const { data: sample, error: sampleErr } = await supabase.from('categories').select('*').limit(1)
  if (sampleErr) { console.error('❌ Check schema:', sampleErr.message); return }
  console.log('Colonnes categories:', sample.length > 0 ? Object.keys(sample[0]) : '(vide)')

  const { data: sampleC, error: sampleCErr } = await supabase.from('courses').select('*').limit(1)
  if (sampleCErr) { console.error('❌ Check courses:', sampleCErr.message); return }
  console.log('Colonnes courses:', sampleC.length > 0 ? Object.keys(sampleC[0]) : '(vide)')

  // 1. Catégories
  const { error: catErr } = await supabase.from('categories').upsert([
    { name: 'Développement Web', slug: 'developpement-web', description: 'HTML, CSS, JavaScript, React, Next.js', icon: '💻' },
    { name: 'Data Science & IA', slug: 'data-science-ia', description: 'Python, Machine Learning, Deep Learning', icon: '🤖' },
    { name: 'Marketing Digital', slug: 'marketing-digital', description: 'SEO, réseaux sociaux, publicité en ligne', icon: '📈' },
    { name: 'Gestion de Projet', slug: 'gestion-projet', description: 'Agile, Scrum, PMP, leadership', icon: '📋' },
    { name: 'Design & UX', slug: 'design-ux', description: 'Figma, Adobe XD, UI/UX, graphisme', icon: '🎨' },
    { name: 'Finance & Comptabilité', slug: 'finance-comptabilite', description: 'Comptabilité, analyse financière', icon: '💰' },
  ], { onConflict: 'slug' })
  if (catErr) { console.error('❌ Categories:', catErr.message); return }
  console.log('✅ Catégories insérées')

  const { data: cats } = await supabase.from('categories').select('id, slug')
  const catMap = Object.fromEntries(cats.map(c => [c.slug, c.id]))

  // 2. Formateur (profil fictif - on crée sans auth user)
  const formateurId = '00000000-0000-0000-0000-000000000001'
  const { error: profErr } = await supabase.from('profiles').upsert([
    {
      id: formateurId,
      full_name: 'Kouassi Ange-Brice',
      email: 'formateur@ibiglearn.com',
      role: 'instructor',
      bio: 'Expert en développement web et data science avec 10 ans d\'expérience.',
      country: 'CI',
      avatar_url: null
    }
  ], { onConflict: 'id' })
  if (profErr) console.warn('⚠️ Profile:', profErr.message)
  else console.log('✅ Formateur créé')

  // 3. Formations
  const formations = [
    {
      title: 'Maîtrisez React & Next.js de A à Z',
      slug: 'maitrisez-react-nextjs',
      description: 'Apprenez à créer des applications web modernes et performantes avec React 18 et Next.js 14. Du composant de base au déploiement en production.',
      short_description: 'Créez des apps web modernes avec React & Next.js',
      instructor_id: formateurId,
      category_id: catMap['developpement-web'],
      level: 'intermediate',
      price: 35000,
      original_price: 50000,
      currency: 'XOF',
      language: 'fr',
      duration_hours: 42,
      thumbnail_url: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600',
      is_published: true,
      is_featured: true,
      rating: 4.8,
      enrollment_count: 234,
      requirements: ['Bases de JavaScript', 'HTML & CSS'],
      objectives: ['Maîtriser les hooks React', 'Créer des apps Next.js', 'Déployer sur Vercel']
    },
    {
      title: 'Python pour la Data Science',
      slug: 'python-data-science',
      description: 'Découvrez Python et ses bibliothèques (Pandas, NumPy, Matplotlib, Scikit-learn) pour analyser des données et créer des modèles de machine learning.',
      short_description: 'Analysez des données et créez des modèles ML avec Python',
      instructor_id: formateurId,
      category_id: catMap['data-science-ia'],
      level: 'beginner',
      price: 40000,
      original_price: 60000,
      currency: 'XOF',
      language: 'fr',
      duration_hours: 55,
      thumbnail_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600',
      is_published: true,
      is_featured: true,
      rating: 4.9,
      enrollment_count: 412,
      requirements: ['Aucun prérequis', 'Motivation à apprendre'],
      objectives: ['Maîtriser Python', 'Analyser des données', 'Créer des modèles ML']
    },
    {
      title: 'Marketing Digital Complet',
      slug: 'marketing-digital-complet',
      description: 'Stratégies SEO, publicité Facebook & Google Ads, email marketing, content marketing. Devenez un expert du marketing digital.',
      short_description: 'Maîtrisez le SEO, les ads et le content marketing',
      instructor_id: formateurId,
      category_id: catMap['marketing-digital'],
      level: 'beginner',
      price: 25000,
      original_price: 40000,
      currency: 'XOF',
      language: 'fr',
      duration_hours: 30,
      thumbnail_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600',
      is_published: true,
      is_featured: true,
      rating: 4.7,
      enrollment_count: 189,
      requirements: ['Avoir un compte réseaux sociaux', 'Notions internet'],
      objectives: ['Maîtriser le SEO', 'Créer des campagnes ads', 'Mesurer les performances']
    },
    {
      title: 'Gestion de Projet Agile & Scrum',
      slug: 'gestion-projet-agile-scrum',
      description: 'Certification PMP, méthodologies Agile, Scrum, Kanban. Apprenez à gérer des projets complexes et à diriger des équipes efficacement.',
      short_description: 'Certification et pratiques Agile, Scrum, Kanban',
      instructor_id: formateurId,
      category_id: catMap['gestion-projet'],
      level: 'intermediate',
      price: 30000,
      original_price: 45000,
      currency: 'XOF',
      language: 'fr',
      duration_hours: 28,
      thumbnail_url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=600',
      is_published: true,
      is_featured: false,
      rating: 4.6,
      enrollment_count: 98,
      requirements: ['Expérience en gestion d\'équipe', 'Notions de projet'],
      objectives: ['Maîtriser Scrum', 'Gérer des projets agiles', 'Préparer la certif PMP']
    },
    {
      title: 'UI/UX Design avec Figma',
      slug: 'ui-ux-design-figma',
      description: 'Apprenez à concevoir des interfaces utilisateur modernes et accessibles avec Figma. Design system, prototypage, et collaboration avec les développeurs.',
      short_description: 'Créez des interfaces modernes et accessibles avec Figma',
      instructor_id: formateurId,
      category_id: catMap['design-ux'],
      level: 'beginner',
      price: 28000,
      original_price: 42000,
      currency: 'XOF',
      language: 'fr',
      duration_hours: 35,
      thumbnail_url: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600',
      is_published: true,
      is_featured: false,
      rating: 4.8,
      enrollment_count: 156,
      requirements: ['Sens artistique basique', 'Ordinateur avec Figma gratuit'],
      objectives: ['Maîtriser Figma', 'Créer un design system', 'Prototyper une app']
    },
    {
      title: 'Développement Web Full Stack',
      slug: 'developpement-web-fullstack',
      description: 'De HTML/CSS au back-end Node.js et aux bases de données PostgreSQL. Créez des applications web complètes et déployez-les dans le cloud.',
      short_description: 'Front-end, back-end, base de données et déploiement',
      instructor_id: formateurId,
      category_id: catMap['developpement-web'],
      level: 'advanced',
      price: 55000,
      original_price: 80000,
      currency: 'XOF',
      language: 'fr',
      duration_hours: 80,
      thumbnail_url: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=600',
      is_published: true,
      is_featured: true,
      rating: 4.9,
      enrollment_count: 87,
      requirements: ['Bases de programmation', 'HTML & CSS basiques'],
      objectives: ['Maîtriser HTML/CSS/JS', 'Créer des APIs REST', 'Déployer sur le cloud']
    }
  ]

  const { error: formErr } = await supabase.from('courses').upsert(formations, { onConflict: 'slug' })
  if (formErr) { console.error('❌ Formations:', formErr.message); return }
  console.log('✅ 6 formations insérées')

  console.log('\n🎉 Seeding terminé avec succès !')
}

seed().catch(console.error)
