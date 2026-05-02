-- ============================================================================
-- STUDENT VERIFICATION + SPIN WHEEL REWARD SYSTEM
-- ============================================================================
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================================

-- Add student/reward columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS student_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS spin_used BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reward_item_id UUID REFERENCES public.products(id) ON DELETE SET NULL;

-- ============================================================================
-- Table: student_verifications
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.student_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enrollment_number TEXT NOT NULL,
  college_name TEXT NOT NULL,
  college_city TEXT NOT NULL,
  id_image_url TEXT, -- private Supabase Storage URL
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id) -- one verification record per user
);

CREATE INDEX IF NOT EXISTS student_verifications_user_idx ON public.student_verifications(user_id);
COMMENT ON TABLE public.student_verifications IS 'Stores verified student records with uploaded ID image reference';

-- ============================================================================
-- RLS Policies for student_verifications
-- ============================================================================
ALTER TABLE public.student_verifications ENABLE ROW LEVEL SECURITY;

-- Users can only read their own verification
CREATE POLICY "student_verifications_select_own" ON public.student_verifications
  FOR SELECT USING (auth.uid() = user_id);

-- Only service role can insert (done via backend API with service key)
CREATE POLICY "student_verifications_insert_service" ON public.student_verifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can read all
CREATE POLICY "student_verifications_select_admin" ON public.student_verifications
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
  ));

-- ============================================================================
-- Storage bucket for student ID images (run separately if needed)
-- ============================================================================
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('student-ids', 'student-ids', false)
-- ON CONFLICT (id) DO NOTHING;
--
-- CREATE POLICY "student_ids_insert_own" ON storage.objects
--   FOR INSERT WITH CHECK (bucket_id = 'student-ids' AND auth.uid()::text = (storage.foldername(name))[1]);
--
-- CREATE POLICY "student_ids_select_service" ON storage.objects
--   FOR SELECT USING (bucket_id = 'student-ids' AND EXISTS (
--     SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
--   ));
