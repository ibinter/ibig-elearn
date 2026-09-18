import pg from 'pg'
const { Client } = pg

const client = new Client({
  connectionString: 'postgresql://postgres:wKGi7pD8S!H_Lx3@db.bgetgydgzfviddpcbdtq.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
})

async function seed() {
  await client.connect()
  console.log('✅ Connecté à Supabase PostgreSQL')

  // Check existing tables
  const { rows: tables } = await client.query(`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename
  `)
  console.log('Tables:', tables.map(r => r.tablename).join(', '))

  // Check categories columns
  const { rows: cols } = await client.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'categories'
    ORDER BY ordinal_position
  `)
  console.log('Colonnes categories:', cols.map(r => r.column_name).join(', '))

  // Check courses columns
  const { rows: ccols } = await client.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'courses'
    ORDER BY ordinal_position
  `)
  console.log('Colonnes courses:', ccols.map(r => r.column_name).join(', '))

  // Insert categories
  await client.query(`
    INSERT INTO public.categories (name, slug, description, icon, position) VALUES
      ('Numérique & Développement', 'numerique-developpement', 'Programmation, web, mobile, data', '💻', 1),
      ('BTP & Immobilier', 'btp-immobilier', 'Construction, gestion foncière, architecture', '🏗️', 2),
      ('Gestion & Finance', 'gestion-finance', 'Comptabilité, gestion d''entreprise, finance', '📊', 3),
      ('Marketing & Commerce', 'marketing-commerce', 'Marketing digital, vente, e-commerce', '📈', 4),
      ('Leadership & Management', 'leadership-management', 'Management, RH, entrepreneuriat', '🎯', 5),
      ('Santé & Social', 'sante-social', 'Santé publique, travail social', '🏥', 6)
    ON CONFLICT (slug) DO NOTHING
  `)
  console.log('✅ Catégories insérées')

  const { rows: cats } = await client.query('SELECT id, slug FROM public.categories')
  const catMap = Object.fromEntries(cats.map(c => [c.slug, c.id]))

  // Create a demo auth user for the instructor
  const { rows: existing } = await client.query(
    `SELECT id FROM auth.users WHERE email = 'formateur.demo@ibiglearn.com'`
  )

  let formateurId
  if (existing.length > 0) {
    formateurId = existing[0].id
    console.log('ℹ️ Formateur déjà existant:', formateurId)
  } else {
    const { rows: newUser } = await client.query(`
      INSERT INTO auth.users (
        instance_id, email, encrypted_password, email_confirmed_at,
        created_at, updated_at, raw_app_meta_data, raw_user_meta_data, aud, role
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        'formateur.demo@ibiglearn.com',
        crypt('DemoIBIG2024!', gen_salt('bf')),
        now(), now(), now(),
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"Dr. Kouassi Ange-Brice"}',
        'authenticated', 'authenticated'
      ) RETURNING id
    `)
    formateurId = newUser[0].id
    console.log('✅ Formateur créé:', formateurId)
  }

  // Create profile
  await client.query(`
    INSERT INTO public.profiles (id, email, full_name, role, bio, country)
    VALUES ($1, 'formateur.demo@ibiglearn.com', 'Dr. Kouassi Ange-Brice', 'formateur',
      'Expert en développement numérique avec 12 ans d''expérience en Afrique de l''Ouest.', 'CI')
    ON CONFLICT (id) DO NOTHING
  `, [formateurId])
  console.log('✅ Profil formateur créé')

  // Check courses columns to adapt INSERT
  const courseColNames = ccols.map(r => r.column_name)
  const hasPriceXof = courseColNames.includes('price_xof')
  const hasPrice = courseColNames.includes('price')
  console.log('Colonne prix:', hasPriceXof ? 'price_xof' : hasPrice ? 'price' : 'inconnue')

  const priceCol = hasPriceXof ? 'price_xof' : 'price'

  const formations = [
    {
      title: 'Développement Web avec Next.js & React',
      slug: 'developpement-web-nextjs-react',
      description: 'Apprenez à créer des applications web modernes avec React 18 et Next.js. Du composant de base au déploiement en production sur Vercel. Couvre les Server Components, App Router, Tailwind CSS et Supabase.',
      short_description: 'Créez des apps web modernes avec React & Next.js — déployez en production',
      category_id: catMap['numerique-developpement'],
      level: 'intermediaire',
      price: 35000,
      duration_hours: 42,
      enrollment_count: 234,
      rating_average: 4.8,
      rating_count: 47,
      is_featured: true,
      thumbnail_url: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&auto=format',
      objectives: ['Maîtriser les hooks React', 'Créer des apps Next.js avec App Router', 'Déployer sur Vercel'],
      requirements: ['Bases de JavaScript', 'HTML & CSS']
    },
    {
      title: 'Python pour la Data Science & IA',
      slug: 'python-data-science-ia',
      description: 'Maîtrisez Python et ses bibliothèques (Pandas, NumPy, Matplotlib, Scikit-learn) pour analyser des données et créer des modèles de machine learning. Cas pratiques avec des données africaines.',
      short_description: 'Analysez des données et créez des modèles ML avec Python',
      category_id: catMap['numerique-developpement'],
      level: 'debutant',
      price: 40000,
      duration_hours: 55,
      enrollment_count: 412,
      rating_average: 4.9,
      rating_count: 89,
      is_featured: true,
      thumbnail_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format',
      objectives: ['Maîtriser Python', 'Analyser des datasets', 'Créer des modèles ML'],
      requirements: ['Aucun prérequis', 'Motivation à apprendre']
    },
    {
      title: 'Gestion de Projet BTP en Afrique',
      slug: 'gestion-projet-btp-afrique',
      description: 'Techniques de gestion de chantier adaptées au contexte africain. Planification, suivi des coûts, gestion des équipes et des fournisseurs. Maîtrisez MS Project et les normes de construction locales.',
      short_description: 'Gérez vos chantiers BTP efficacement avec les méthodes adaptées à l\'Afrique',
      category_id: catMap['btp-immobilier'],
      level: 'intermediaire',
      price: 30000,
      duration_hours: 28,
      enrollment_count: 156,
      rating_average: 4.7,
      rating_count: 34,
      is_featured: true,
      thumbnail_url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format',
      objectives: ['Planifier un chantier', 'Gérer les coûts et délais', 'Manager une équipe terrain'],
      requirements: ['Expérience en BTP souhaitée', 'Notions de gestion']
    },
    {
      title: 'Marketing Digital & Réseaux Sociaux',
      slug: 'marketing-digital-reseaux-sociaux',
      description: 'Stratégies SEO, publicité Facebook & Google Ads, content marketing pour développer votre présence en ligne sur les marchés africains.',
      short_description: 'Maîtrisez le SEO, les ads et le content marketing pour l\'Afrique',
      category_id: catMap['marketing-commerce'],
      level: 'debutant',
      price: 25000,
      duration_hours: 30,
      enrollment_count: 189,
      rating_average: 4.7,
      rating_count: 28,
      is_featured: false,
      thumbnail_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format',
      objectives: ['Maîtriser le SEO', 'Créer des campagnes Facebook & Google', 'Mesurer le ROI'],
      requirements: ['Avoir un compte réseaux sociaux', 'Notions internet de base']
    },
    {
      title: 'Comptabilité & Gestion Financière PME',
      slug: 'comptabilite-gestion-financiere-pme',
      description: 'Maîtrisez les fondamentaux de la comptabilité SYSCOHADA, la gestion de trésorerie et l\'analyse financière pour les PME africaines.',
      short_description: 'Gérez la comptabilité et les finances de votre PME africaine',
      category_id: catMap['gestion-finance'],
      level: 'debutant',
      price: 28000,
      duration_hours: 35,
      enrollment_count: 98,
      rating_average: 4.6,
      rating_count: 19,
      is_featured: false,
      thumbnail_url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&auto=format',
      objectives: ['Maîtriser le plan comptable SYSCOHADA', 'Gérer la trésorerie', 'Lire un bilan'],
      requirements: ['Aucun prérequis comptable', 'Bonne maîtrise de Excel']
    },
    {
      title: 'Leadership & Management d\'Équipe',
      slug: 'leadership-management-equipe',
      description: 'Développez vos compétences en leadership, communication et management d\'équipe. Techniques de motivation, gestion des conflits et prise de décision pour les managers en Afrique.',
      short_description: 'Devenez un leader inspirant et gérez votre équipe avec efficacité',
      category_id: catMap['leadership-management'],
      level: 'intermediaire',
      price: 32000,
      duration_hours: 24,
      enrollment_count: 127,
      rating_average: 4.8,
      rating_count: 31,
      is_featured: true,
      thumbnail_url: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=600&auto=format',
      objectives: ['Développer son leadership', 'Motiver son équipe', 'Gérer les conflits'],
      requirements: ['Expérience managériale souhaitée', 'Ouverture d\'esprit']
    }
  ]

  for (const f of formations) {
    await client.query(`
      INSERT INTO public.courses (
        title, slug, description, short_description, instructor_id, category_id,
        ${priceCol}, level, duration_hours, is_published, is_featured,
        enrollment_count, rating_average, rating_count,
        objectives, requirements, thumbnail_url
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,true,$10,$11,$12,$13,$14,$15,$16)
      ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        is_published = true,
        is_featured = EXCLUDED.is_featured,
        enrollment_count = EXCLUDED.enrollment_count,
        rating_average = EXCLUDED.rating_average
    `, [
      f.title, f.slug, f.description, f.short_description,
      formateurId, f.category_id,
      f.price, f.level, f.duration_hours, f.is_featured,
      f.enrollment_count, f.rating_average, f.rating_count,
      f.objectives, f.requirements, f.thumbnail_url
    ])
    console.log(`✅ Formation: ${f.title}`)
  }

  console.log('\n🎉 Seed terminé avec succès !')
  await client.end()
}

seed().catch(async (e) => {
  console.error('❌', e.message)
  await client.end()
  process.exit(1)
})
