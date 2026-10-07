-- 045 — La FK courses.approved_by → profiles (044) créait une 2e relation courses↔profiles :
-- PostgREST refusait alors tous les embeds `profiles(...)` depuis courses (catalogue vide).
-- On garde la colonne, sans contrainte de clé étrangère.
alter table public.courses drop constraint if exists courses_approved_by_fkey;
notify pgrst, 'reload schema';
