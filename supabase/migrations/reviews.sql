-- Table reviews (avis apprenants)
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  is_published boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, course_id)
);

alter table reviews enable row level security;

-- Apprenant peut lire tous les avis publiés
create policy "public_read_reviews" on reviews for select
  using (is_published = true);

-- Apprenant peut écrire son propre avis
create policy "user_insert_review" on reviews for insert
  with check (user_id = auth.uid());

-- Apprenant peut modifier son propre avis
create policy "user_update_review" on reviews for update
  using (user_id = auth.uid());

-- Admin peut tout faire
create policy "admin_all_reviews" on reviews for all
  using (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'coordinateur')));

-- Trigger pour recalculer la note moyenne du cours après insert/update/delete
create or replace function update_course_rating()
returns trigger language plpgsql security definer as $$
begin
  update courses
  set
    rating_average = (select coalesce(avg(rating), 0) from reviews where course_id = coalesce(new.course_id, old.course_id) and is_published = true),
    rating_count = (select count(*) from reviews where course_id = coalesce(new.course_id, old.course_id) and is_published = true)
  where id = coalesce(new.course_id, old.course_id);
  return new;
end;
$$;

drop trigger if exists trg_update_course_rating on reviews;
create trigger trg_update_course_rating
after insert or update or delete on reviews
for each row execute function update_course_rating();
