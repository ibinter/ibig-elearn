-- Table coupons
create table if not exists coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type text not null check (discount_type in ('percent', 'fixed')),
  discount_value numeric not null check (discount_value > 0),
  max_uses integer,
  used_count integer not null default 0,
  min_amount numeric,
  max_discount_amount numeric,
  expires_at timestamptz,
  one_per_user boolean not null default false,
  is_active boolean not null default true,
  description text,
  course_id uuid references courses(id) on delete set null,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- Table coupon_uses
create table if not exists coupon_uses (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid not null references coupons(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  payment_id uuid references payments(id) on delete set null,
  discount_applied numeric not null default 0,
  used_at timestamptz default now(),
  unique(coupon_id, user_id)
);

-- RLS
alter table coupons enable row level security;
alter table coupon_uses enable row level security;

-- Admin peut tout faire
create policy "admin_all_coupons" on coupons for all
  using (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'coordinateur')));

-- Tout le monde peut lire les coupons actifs (pour validation)
create policy "public_read_active_coupons" on coupons for select
  using (is_active = true);

-- coupon_uses
create policy "admin_all_coupon_uses" on coupon_uses for all
  using (exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'coordinateur')));

create policy "user_own_coupon_uses" on coupon_uses for select
  using (user_id = auth.uid());

create policy "user_insert_coupon_use" on coupon_uses for insert
  with check (user_id = auth.uid());

-- Incrémenter used_count via une fonction
create or replace function increment_coupon_use(coupon_id_arg uuid)
returns void language plpgsql security definer as $$
begin
  update coupons set used_count = used_count + 1 where id = coupon_id_arg;
end;
$$;
