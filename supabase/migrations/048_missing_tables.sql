-- 048 — Tables utilisées par le code mais jamais créées en production
-- (questions-réponses par leçon, votes, messages groupés des formateurs, témoignages)

-- ── Questions / réponses par leçon ──────────────────────────
create table if not exists public.lesson_qa (
  id          uuid primary key default gen_random_uuid(),
  lesson_id   uuid not null references public.lessons(id) on delete cascade,
  course_id   uuid not null references public.courses(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  question    text not null check (char_length(question) between 3 and 4000),
  answer      text,
  answered_by uuid references public.profiles(id),
  answered_at timestamptz,
  upvotes     integer not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists lesson_qa_lesson_idx on public.lesson_qa(lesson_id, created_at desc);
alter table public.lesson_qa enable row level security;

drop policy if exists lesson_qa_read on public.lesson_qa;
create policy lesson_qa_read on public.lesson_qa for select using (true);
drop policy if exists lesson_qa_insert on public.lesson_qa;
create policy lesson_qa_insert on public.lesson_qa for insert with check (
  user_id = auth.uid() and answer is null
  and exists (select 1 from public.enrollments e where e.user_id = auth.uid() and e.course_id = lesson_qa.course_id));
drop policy if exists lesson_qa_answer on public.lesson_qa;
create policy lesson_qa_answer on public.lesson_qa for update using (
  public.is_staff(auth.uid())
  or exists (select 1 from public.courses c where c.id = lesson_qa.course_id and c.instructor_id = auth.uid()));
drop policy if exists lesson_qa_delete on public.lesson_qa;
create policy lesson_qa_delete on public.lesson_qa for delete using (user_id = auth.uid() or public.is_staff(auth.uid()));

create table if not exists public.qa_upvotes (
  qa_id   uuid not null references public.lesson_qa(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  primary key (qa_id, user_id)
);
alter table public.qa_upvotes enable row level security;
drop policy if exists qa_upvotes_all on public.qa_upvotes;
create policy qa_upvotes_all on public.qa_upvotes for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Compteur de votes tenu par la base (les apprenants ne peuvent pas modifier la question)
create or replace function public.sync_qa_upvotes() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.lesson_qa set upvotes = (select count(*) from public.qa_upvotes where qa_id = coalesce(new.qa_id, old.qa_id))
   where id = coalesce(new.qa_id, old.qa_id);
  return null;
end $$;
drop trigger if exists qa_upvotes_sync on public.qa_upvotes;
create trigger qa_upvotes_sync after insert or delete on public.qa_upvotes
  for each row execute function public.sync_qa_upvotes();

-- ── Messages groupés des formateurs ─────────────────────────
create table if not exists public.bulk_messages (
  id               uuid primary key default gen_random_uuid(),
  instructor_id    uuid not null references public.profiles(id) on delete cascade,
  course_id        uuid not null references public.courses(id) on delete cascade,
  subject          text not null,
  body             text not null,
  recipients_count integer not null default 0,
  sent_at          timestamptz not null default now()
);
alter table public.bulk_messages enable row level security;
drop policy if exists bulk_messages_own on public.bulk_messages;
create policy bulk_messages_own on public.bulk_messages for select using (instructor_id = auth.uid() or public.is_staff(auth.uid()));
drop policy if exists bulk_messages_insert on public.bulk_messages;
create policy bulk_messages_insert on public.bulk_messages for insert with check (
  instructor_id = auth.uid()
  and exists (select 1 from public.courses c where c.id = bulk_messages.course_id and c.instructor_id = auth.uid()));

-- ── Témoignages (gérés par l'équipe IBIG, aucun contenu par défaut) ──
create table if not exists public.testimonials (
  id             uuid primary key default gen_random_uuid(),
  author_name    text not null,
  author_role    text not null,
  author_country text default '',
  content        text not null,
  rating         smallint default 5 check (rating between 1 and 5),
  initials       text default '',
  color          text default 'bg-blue-600',
  is_published   boolean default false,
  position       integer default 0,
  created_at     timestamptz default now()
);
alter table public.testimonials enable row level security;
drop policy if exists "published testimonials are public" on public.testimonials;
create policy "published testimonials are public" on public.testimonials for select using (is_published = true);
drop policy if exists "admins manage testimonials" on public.testimonials;
create policy "admins manage testimonials" on public.testimonials for all
  using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

notify pgrst, 'reload schema';
