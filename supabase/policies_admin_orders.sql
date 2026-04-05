-- Run after schema.sql so admins can list/update all orders in the app.
-- Safe to re-run (drops then recreates policies).

drop policy if exists "orders_select_admin" on public.orders;
create policy "orders_select_admin" on public.orders for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

drop policy if exists "orders_update_admin" on public.orders;
create policy "orders_update_admin" on public.orders for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

drop policy if exists "order_items_select_admin" on public.order_items;
create policy "order_items_select_admin" on public.order_items for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));
