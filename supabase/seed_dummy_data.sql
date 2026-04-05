-- Dummy catalog for Infinity Style (run in Supabase SQL Editor after schema.sql + policies_admin_orders.sql)
-- Clears existing seed slugs if you re-run (optional).

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

-- Make yourself admin (replace email with your Supabase Auth email):
-- update public.profiles
-- set is_admin = true
-- where id = (select id from auth.users where email = 'you@example.com' limit 1);
