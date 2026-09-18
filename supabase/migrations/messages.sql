-- Messagerie interne apprenant <-> formateur
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  sender_id uuid not null references profiles(id) on delete cascade,
  recipient_id uuid not null references profiles(id) on delete cascade,
  content text not null,
  is_read boolean not null default false,
  created_at timestamptz default now()
);

alter table messages enable row level security;

-- On peut voir les messages où on est sender ou recipient
create policy "users_own_messages" on messages for select
  using (sender_id = auth.uid() or recipient_id = auth.uid());

create policy "users_send_messages" on messages for insert
  with check (sender_id = auth.uid());

create policy "users_mark_read" on messages for update
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

-- Index pour performance
create index if not exists idx_messages_course on messages(course_id);
create index if not exists idx_messages_sender on messages(sender_id);
create index if not exists idx_messages_recipient on messages(recipient_id);
create index if not exists idx_messages_created on messages(created_at desc);
