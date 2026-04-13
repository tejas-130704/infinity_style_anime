-- Product likes / wishlist (safe to re-run)

CREATE TABLE IF NOT EXISTS public.product_likes (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, product_id)
);

ALTER TABLE public.product_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS product_likes_select_own ON public.product_likes;
DROP POLICY IF EXISTS product_likes_insert_own ON public.product_likes;
DROP POLICY IF EXISTS product_likes_delete_own ON public.product_likes;

CREATE POLICY product_likes_select_own
  ON public.product_likes
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY product_likes_insert_own
  ON public.product_likes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY product_likes_delete_own
  ON public.product_likes
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS product_likes_product_idx ON public.product_likes(product_id);

