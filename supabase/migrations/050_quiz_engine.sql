-- 050 — Moteur d'évaluation : banque de questions, types de questions, tentatives contrôlées par le serveur

-- ── Types de questions ──────────────────────────────────────
--   mcq        : choix unique           → correct_option
--   true_false : vrai / faux            → correct_option (0 = vrai, 1 = faux)
--   multi      : choix multiples        → correct_options
--   short      : réponse courte saisie  → accepted_answers (comparaison sans accents ni casse)
alter table public.quiz_questions add column if not exists correct_options integer[];
alter table public.quiz_questions add column if not exists accepted_answers text[];
alter table public.quiz_questions add column if not exists points integer not null default 1 check (points between 1 and 100);
update public.quiz_questions set type = 'mcq' where type is null;
do $$
declare c record;
begin
  for c in select conname from pg_constraint
            where conrelid = 'public.quiz_questions'::regclass and contype = 'c' and pg_get_constraintdef(oid) ilike '%type%'
  loop execute format('alter table public.quiz_questions drop constraint %I', c.conname); end loop;
end $$;
alter table public.quiz_questions add constraint quiz_questions_type_check check (type in ('mcq', 'true_false', 'multi', 'short'));

-- ── Réglages d'évaluation par leçon ─────────────────────────
alter table public.lessons add column if not exists quiz_time_limit_min integer check (quiz_time_limit_min is null or quiz_time_limit_min between 1 and 300);
alter table public.lessons add column if not exists quiz_max_attempts integer check (quiz_max_attempts is null or quiz_max_attempts between 1 and 50);
alter table public.lessons add column if not exists quiz_draw_count integer check (quiz_draw_count is null or quiz_draw_count >= 1);  -- tirage aléatoire dans la banque
alter table public.lessons add column if not exists quiz_show_corrections boolean not null default true;

-- ── Tentatives ouvertes par le serveur (questions tirées, chronomètre) ──
alter table public.quiz_attempts add column if not exists question_ids uuid[];
alter table public.quiz_attempts add column if not exists course_id uuid references public.courses(id) on delete cascade;
alter table public.quiz_attempts add column if not exists status text not null default 'submitted';
alter table public.quiz_attempts add column if not exists started_at timestamptz;
alter table public.quiz_attempts add column if not exists deadline_at timestamptz;
alter table public.quiz_attempts add column if not exists submitted_at timestamptz;
alter table public.quiz_attempts add column if not exists points numeric;
alter table public.quiz_attempts add column if not exists max_points numeric;
create index if not exists quiz_attempts_user_lesson_idx on public.quiz_attempts(user_id, lesson_id);

-- ── Les bonnes réponses ne sont lisibles que par le serveur ──
-- (auparavant n'importe quel visiteur pouvait lire correct_option via l'API publique)
revoke select on public.quiz_questions from anon, authenticated;
grant select (id, lesson_id, course_id, question, options, type, position, points) on public.quiz_questions to anon, authenticated;

notify pgrst, 'reload schema';
