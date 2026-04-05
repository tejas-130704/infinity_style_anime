-- =============================================================================
-- Infinity Style — FULL DATABASE SETUP (Supabase SQL Editor: paste & run once)
-- Creates schema, RLS policies, admin order access, and demo products.
-- Safe to re-run: drops/recreates policies on these tables only.
-- =============================================================================

create extension if not exists "uuid-ossp";

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  name text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price integer not null check (price >= 0),
  category text not null check (category in ('posters', '3d_models', 'custom_designs')),
  image_url text,
  model_url text,
  slug text unique,
  created_at timestamptz not null default now()
);

create index if not exists products_category_idx on public.products (category);

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  product_id uuid not null references public.products on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  unique (user_id, product_id)
);

create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null,
  phone1 text not null,
  phone2 text,
  email text not null,
  address text not null,
  city text not null,
  state text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  address_id uuid references public.addresses on delete set null,
  total_price integer not null check (total_price >= 0),
  status text not null default 'pending_payment',
  payment_status text not null default 'pending',
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  created_at timestamptz not null default now()
);

create index if not exists orders_user_idx on public.orders (user_id);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders on delete cascade,
  product_id uuid not null references public.products on delete restrict,
  quantity integer not null check (quantity > 0),
  price integer not null check (price >= 0)
);

-- -----------------------------------------------------------------------------
-- Auth trigger: new user → profile
-- -----------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.cart_items enable row level security;
alter table public.addresses enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Drop existing policies on our tables (re-run safe)
do $$
declare
  r record;
begin
  for r in
    select policyname, tablename from pg_policies
    where schemaname = 'public'
      and tablename in ('profiles','products','cart_items','addresses','orders','order_items')
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- Profiles
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Products
create policy "products_select_all" on public.products for select using (true);
create policy "products_insert_admin" on public.products for insert
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));
create policy "products_update_admin" on public.products for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));
create policy "products_delete_admin" on public.products for delete
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

-- Cart
create policy "cart_select_own" on public.cart_items for select using (auth.uid() = user_id);
create policy "cart_insert_own" on public.cart_items for insert with check (auth.uid() = user_id);
create policy "cart_update_own" on public.cart_items for update using (auth.uid() = user_id);
create policy "cart_delete_own" on public.cart_items for delete using (auth.uid() = user_id);

-- Addresses
create policy "addr_select_own" on public.addresses for select using (auth.uid() = user_id);
create policy "addr_insert_own" on public.addresses for insert with check (auth.uid() = user_id);
create policy "addr_update_own" on public.addresses for update using (auth.uid() = user_id);
create policy "addr_delete_own" on public.addresses for delete using (auth.uid() = user_id);

-- Orders
create policy "orders_select_own" on public.orders for select using (auth.uid() = user_id);
create policy "orders_insert_own" on public.orders for insert with check (auth.uid() = user_id);
create policy "orders_select_admin" on public.orders for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));
create policy "orders_update_admin" on public.orders for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

-- Order items
create policy "order_items_select_own" on public.order_items for select
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy "order_items_insert_own" on public.order_items for insert
  with check (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy "order_items_select_admin" on public.order_items for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

-- -----------------------------------------------------------------------------
-- Dummy products (re-run replaces demo rows)
-- -----------------------------------------------------------------------------

delete from public.products where slug like 'demo-%';

insert into public.products (name, description, price, category, image_url, model_url, slug) values
(
  'Infinity Castle — Night',
  'A1 poster print, matte finish. Infinity Castle arc inspired skyline — deep purples and crimson glow.',
  2499,
  'posters',
  'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&q=80',
  null,
  'demo-poster-infinity-castle-night'
),
(
  'Breathing Blade — Teal',
  'Limited run poster. High-contrast silhouette with teal energy accents.',
  1999,
  'posters',
  'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?w=800&q=80',
  null,
  'demo-poster-breathing-blade-teal'
),
(
  'Moonlit Corridor',
  'Art print — endless corridor under moonlight. Fits standard frames.',
  1799,
  'posters',
  'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=80',
  null,
  'demo-poster-moonlit-corridor'
),
(
  'Chibi Demon Statue — STL',
  '3D printable model (STL). Pre-supported mesh included. Personal use only.',
  3499,
  '3d_models',
  'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80',
  null,
  'demo-3d-chibi-demon-statue'
),
(
  'Castle Spire — OBJ',
  'Infinity Castle spire kitbash pack. OBJ + textures.',
  4999,
  '3d_models',
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80',
  null,
  'demo-3d-castle-spire'
),
(
  'Katana Display Stand',
  'Printable stand for 1/6 scale figures. STL bundle.',
  1299,
  '3d_models',
  'https://images.unsplash.com/photo-1635322966219-b75ed372eb01?w=800&q=80',
  null,
  'demo-3d-katana-stand'
),
(
  'Custom Character — Commission Slot',
  'One slot: custom character illustration + poster. We contact you after purchase.',
  9999,
  'custom_designs',
  'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&q=80',
  null,
  'demo-custom-character-commission'
),
(
  'Custom Logo — Anime Style',
  'Vector logo + social kit in anime aesthetic. 2 revision rounds.',
  5999,
  'custom_designs',
  'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&q=80',
  null,
  'demo-custom-logo-anime'
),
(
  'Wall Art — Your OC',
  'Custom poster from your OC reference sheet. 18x24" max.',
  7999,
  'custom_designs',
  'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=80',
  null,
  'demo-custom-wall-art-oc'
);

-- -----------------------------------------------------------------------------
-- Verify
-- -----------------------------------------------------------------------------

select count(*)::int as demo_products from public.products where slug like 'demo-%';
