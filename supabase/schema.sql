-- Infinity Style E-commerce — run in Supabase SQL Editor
-- For schema + policies + demo products in one go, use: complete_setup.sql
-- Enable extensions
create extension if not exists "uuid-ossp";

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  name text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- Products
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

-- Cart (persisted per user)
create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  product_id uuid not null references public.products on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  unique (user_id, product_id)
);

-- Addresses
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

-- Orders
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

-- Order line items (price snapshot)
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders on delete cascade,
  product_id uuid not null references public.products on delete restrict,
  quantity integer not null check (quantity > 0),
  price integer not null check (price >= 0)
);

-- New user → profile
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

-- RLS
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.cart_items enable row level security;
alter table public.addresses enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Profiles
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Products: public read; admin write (service role or is_admin via function)
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

-- Order items: readable if user owns parent order
create policy "order_items_select_own" on public.order_items for select
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));
create policy "order_items_insert_own" on public.order_items for insert
  with check (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));

-- Storage bucket (create in Dashboard: Storage → product-images, public read, authenticated upload)
-- Or use public URLs from image_url field pointing to external URLs.
