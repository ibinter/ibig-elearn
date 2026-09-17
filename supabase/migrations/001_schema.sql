-- ============================================================
-- IBIG E-LEARN — Schéma principal Supabase (Lot 1)
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================
-- PROFILES (extension de auth.users)
-- ============================================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text not null,
  avatar_url text,
  role text not null default 'apprenant' check (role in ('apprenant','formateur','coordinateur','admin')),
  phone text,
  country text not null default 'CI',
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Lecture publique des profils" on public.profiles
  for select using (true);

create policy "Utilisateur modifie son profil" on public.profiles
  for update using (auth.uid() = id);

create policy "Admin lit tout" on public.profiles
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','coordinateur'))
  );

-- Trigger pour créer le profil à l'inscription
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- CATÉGORIES
-- ============================================================
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  icon text,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;
create policy "Lecture publique catégories" on public.categories for select using (true);
create policy "Admin gère catégories" on public.categories for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','coordinateur')));

-- ============================================================
-- FORMATIONS (COURSES)
-- ============================================================
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null,
  short_description text not null,
  thumbnail_url text,
  preview_video_url text,
  instructor_id uuid not null references public.profiles(id),
  category_id uuid references public.categories(id),
  price_xof integer not null default 0,
  price_eur numeric(10,2),
  price_usd numeric(10,2),
  level text not null default 'debutant' check (level in ('debutant','intermediaire','avance')),
  duration_hours integer not null default 1,
  language text not null default 'fr',
  is_published boolean not null default false,
  is_featured boolean not null default false,
  enrollment_count integer not null default 0,
  rating_average numeric(3,2) not null default 0,
  rating_count integer not null default 0,
  tags text[] not null default '{}',
  objectives text[] not null default '{}',
  requirements text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.courses enable row level security;

create policy "Lecture publique cours publiés" on public.courses
  for select using (is_published = true or instructor_id = auth.uid() or
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','coordinateur')));

create policy "Formateur crée ses cours" on public.courses
  for insert with check (instructor_id = auth.uid());

create policy "Formateur modifie ses cours" on public.courses
  for update using (instructor_id = auth.uid() or
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','coordinateur')));

-- ============================================================
-- MODULES
-- ============================================================
create table public.modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.modules enable row level security;
create policy "Lecture modules cours publiés" on public.modules for select
  using (exists (select 1 from public.courses c where c.id = course_id and (c.is_published = true or c.instructor_id = auth.uid())));
create policy "Formateur gère modules" on public.modules for all
  using (exists (select 1 from public.courses c where c.id = course_id and c.instructor_id = auth.uid()));

-- ============================================================
-- LEÇONS
-- ============================================================
create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  type text not null default 'video' check (type in ('video','document','quiz','assignment')),
  video_url text,
  video_duration_seconds integer,
  content text,
  position integer not null default 0,
  is_free_preview boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.lessons enable row level security;
create policy "Lecture leçons" on public.lessons for select
  using (
    is_free_preview = true or
    exists (select 1 from public.enrollments e where e.course_id = lessons.course_id and e.user_id = auth.uid() and e.status = 'active') or
    exists (select 1 from public.courses c where c.id = course_id and c.instructor_id = auth.uid()) or
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','coordinateur'))
  );
create policy "Formateur gère leçons" on public.lessons for all
  using (exists (select 1 from public.courses c where c.id = course_id and c.instructor_id = auth.uid()));

-- ============================================================
-- INSCRIPTIONS (ENROLLMENTS)
-- ============================================================
create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  course_id uuid not null references public.courses(id),
  status text not null default 'active' check (status in ('active','completed','suspended')),
  progress_percent integer not null default 0,
  paid_amount integer not null default 0,
  paid_currency text not null default 'XOF',
  payment_method text not null default 'mobile_money',
  payment_reference text,
  enrolled_at timestamptz not null default now(),
  completed_at timestamptz,
  unique(user_id, course_id)
);

alter table public.enrollments enable row level security;
create policy "Apprenant voit ses inscriptions" on public.enrollments
  for select using (user_id = auth.uid() or
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','coordinateur')) or
    exists (select 1 from public.courses c where c.id = course_id and c.instructor_id = auth.uid()));
create policy "Insertion inscription" on public.enrollments
  for insert with check (user_id = auth.uid());
create policy "Mise à jour inscription" on public.enrollments
  for update using (user_id = auth.uid() or
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','coordinateur')));

-- ============================================================
-- PROGRESSION DES LEÇONS
-- ============================================================
create table public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  is_completed boolean not null default false,
  watch_time_seconds integer not null default 0,
  last_position_seconds integer not null default 0,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(user_id, lesson_id)
);

alter table public.lesson_progress enable row level security;
create policy "Utilisateur gère sa progression" on public.lesson_progress
  for all using (user_id = auth.uid());

-- ============================================================
-- QUIZ
-- ============================================================
create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  question text not null,
  options jsonb not null default '[]',
  correct_option integer not null default 0,
  explanation text,
  position integer not null default 0
);

alter table public.quiz_questions enable row level security;
create policy "Lecture quiz" on public.quiz_questions for select using (true);
create policy "Formateur gère quiz" on public.quiz_questions for all
  using (exists (select 1 from public.lessons l join public.courses c on c.id = l.course_id
    where l.id = lesson_id and c.instructor_id = auth.uid()));

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  lesson_id uuid not null references public.lessons(id),
  answers jsonb not null default '[]',
  score integer not null default 0,
  passed boolean not null default false,
  attempted_at timestamptz not null default now()
);

alter table public.quiz_attempts enable row level security;
create policy "Utilisateur gère ses tentatives" on public.quiz_attempts
  for all using (user_id = auth.uid());

-- ============================================================
-- PAIEMENTS
-- ============================================================
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  course_id uuid not null references public.courses(id),
  amount integer not null,
  currency text not null default 'XOF',
  method text not null check (method in ('mobile_money','card','bank_transfer')),
  provider text not null,
  provider_reference text,
  status text not null default 'pending' check (status in ('pending','completed','failed','refunded')),
  invoice_number text unique,
  invoice_url text,
  metadata jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.payments enable row level security;
create policy "Utilisateur voit ses paiements" on public.payments
  for select using (user_id = auth.uid() or
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','coordinateur')));
create policy "Insertion paiement" on public.payments
  for insert with check (user_id = auth.uid());
create policy "Admin met à jour paiement" on public.payments
  for update using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','coordinateur')));

-- ============================================================
-- CERTIFICATS
-- ============================================================
create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  course_id uuid not null references public.courses(id),
  verification_code text not null unique,
  issued_at timestamptz not null default now(),
  pdf_url text,
  unique(user_id, course_id)
);

alter table public.certificates enable row level security;
create policy "Lecture publique certificats" on public.certificates for select using (true);
create policy "Admin crée certificats" on public.certificates for insert
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin','coordinateur')) or user_id = auth.uid());

-- ============================================================
-- AVIS (REVIEWS)
-- ============================================================
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  course_id uuid not null references public.courses(id),
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique(user_id, course_id)
);

alter table public.reviews enable row level security;
create policy "Lecture avis" on public.reviews for select using (true);
create policy "Apprenant donne son avis" on public.reviews for insert
  with check (user_id = auth.uid() and
    exists (select 1 from public.enrollments e where e.course_id = reviews.course_id and e.user_id = auth.uid()));

-- ============================================================
-- FONCTION : recalcul automatique de la progression
-- ============================================================
create or replace function public.update_enrollment_progress()
returns trigger language plpgsql security definer as $$
declare
  total_lessons integer;
  completed_lessons integer;
  progress integer;
begin
  select count(*) into total_lessons from public.lessons where course_id = new.course_id;
  select count(*) into completed_lessons from public.lesson_progress
    where user_id = new.user_id and course_id = new.course_id and is_completed = true;

  if total_lessons > 0 then
    progress := (completed_lessons * 100) / total_lessons;
  else
    progress := 0;
  end if;

  update public.enrollments
  set progress_percent = progress,
      status = case when progress = 100 then 'completed' else status end,
      completed_at = case when progress = 100 and completed_at is null then now() else completed_at end
  where user_id = new.user_id and course_id = new.course_id;

  -- Auto-émettre le certificat si 100%
  if progress = 100 then
    insert into public.certificates (user_id, course_id, verification_code)
    values (new.user_id, new.course_id, upper(replace(gen_random_uuid()::text, '-', '')))
    on conflict (user_id, course_id) do nothing;
  end if;

  return new;
end;
$$;

create trigger on_lesson_progress_updated
  after insert or update on public.lesson_progress
  for each row execute procedure public.update_enrollment_progress();

-- ============================================================
-- FONCTION : recalcul de la note moyenne du cours
-- ============================================================
create or replace function public.update_course_rating()
returns trigger language plpgsql security definer as $$
begin
  update public.courses
  set rating_average = (select avg(rating) from public.reviews where course_id = new.course_id),
      rating_count = (select count(*) from public.reviews where course_id = new.course_id)
  where id = new.course_id;
  return new;
end;
$$;

create trigger on_review_created
  after insert or update on public.reviews
  for each row execute procedure public.update_course_rating();

-- ============================================================
-- DONNÉES INITIALES
-- ============================================================
insert into public.categories (name, slug, description, icon, position) values
  ('Formation professionnelle', 'formation-professionnelle', 'Développez vos compétences professionnelles', '🎓', 1),
  ('Numérique & Informatique', 'numerique-informatique', 'Maîtrisez les outils numériques', '💻', 2),
  ('Immobilier & Gestion foncière', 'immobilier-foncier', 'Expertise immobilière en Afrique', '🏗️', 3),
  ('BTP & Travaux publics', 'btp-travaux-publics', 'Construction et infrastructures', '🏛️', 4),
  ('Commerce & E-commerce', 'commerce-ecommerce', 'Vente et commerce en ligne', '🛒', 5),
  ('Gestion & Entrepreneuriat', 'gestion-entrepreneuriat', 'Créez et développez votre entreprise', '📈', 6);
