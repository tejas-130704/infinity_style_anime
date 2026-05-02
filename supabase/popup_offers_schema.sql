-- Create Popup Settings Table (Single Row Enforced)
CREATE TABLE IF NOT EXISTS public.popup_settings (
    id integer PRIMARY KEY DEFAULT 1,
    is_enabled boolean NOT NULL DEFAULT true,
    delay_seconds integer NOT NULL DEFAULT 10,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT single_row_check CHECK (id = 1)
);

-- Insert default row if not exists
INSERT INTO public.popup_settings (id, is_enabled, delay_seconds)
VALUES (1, true, 10)
ON CONFLICT (id) DO NOTHING;

-- Create Popup Offers Table
CREATE TABLE IF NOT EXISTS public.popup_offers (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    discount_text text NOT NULL,
    description text,
    expiry_date timestamp with time zone NOT NULL,
    cta_url text NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add updated_at trigger function if it doesn't exist (assuming handle_updated_at exists, if not we create it)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS set_popup_settings_updated_at ON public.popup_settings;
CREATE TRIGGER set_popup_settings_updated_at
    BEFORE UPDATE ON public.popup_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_popup_offers_updated_at ON public.popup_offers;
CREATE TRIGGER set_popup_offers_updated_at
    BEFORE UPDATE ON public.popup_offers
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- RLS Policies
ALTER TABLE public.popup_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.popup_offers ENABLE ROW LEVEL SECURITY;

-- Allow public read access to settings and offers
DROP POLICY IF EXISTS "Enable read access for all users" ON public.popup_settings;
CREATE POLICY "Enable read access for all users" ON public.popup_settings
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable read access for all users" ON public.popup_offers;
CREATE POLICY "Enable read access for all users" ON public.popup_offers
    FOR SELECT USING (true);

-- Allow authenticated users (admin) full access
-- Assuming 'admin' checks happen at the API layer, or via auth.role() = 'authenticated'
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.popup_settings;
CREATE POLICY "Enable insert for authenticated users only" ON public.popup_settings
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.popup_settings;
CREATE POLICY "Enable update for authenticated users only" ON public.popup_settings
    FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.popup_settings;
CREATE POLICY "Enable delete for authenticated users only" ON public.popup_settings
    FOR DELETE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.popup_offers;
CREATE POLICY "Enable insert for authenticated users only" ON public.popup_offers
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.popup_offers;
CREATE POLICY "Enable update for authenticated users only" ON public.popup_offers
    FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.popup_offers;
CREATE POLICY "Enable delete for authenticated users only" ON public.popup_offers
    FOR DELETE USING (auth.role() = 'authenticated');
