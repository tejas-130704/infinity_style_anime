import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // 1. Fetch Settings
    const { data: settingsData, error: settingsError } = await supabase
      .from('popup_settings')
      .select('is_enabled, delay_seconds')
      .eq('id', 1)
      .single();

    if (settingsError) {
      console.error('Error fetching popup settings:', settingsError);
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }

    // Default settings if row is missing
    const settings = settingsData || { is_enabled: false, delay_seconds: 10 };

    // 2. Fetch Active Offers
    // Only fetch if system is enabled, else return empty offers array
    let offers = [];
    if (settings.is_enabled) {
      const now = new Date().toISOString();
      const { data: offersData, error: offersError } = await supabase
        .from('popup_offers')
        .select('*')
        .eq('is_active', true)
        .gt('expiry_date', now)
        .order('created_at', { ascending: false });

      if (offersError) {
        console.error('Error fetching popup offers:', offersError);
        return NextResponse.json({ error: 'Failed to fetch offers' }, { status: 500 });
      }
      offers = offersData || [];
    }

    return NextResponse.json({
      settings,
      offers,
    });
  } catch (error) {
    console.error('Internal server error in /api/offers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
