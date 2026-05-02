import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET() {
  const supabase = await createClient();
  const auth = await requireAdmin(supabase);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { data: settings, error } = await supabase
    .from('popup_settings')
    .select('*')
    .eq('id', 1)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is 0 rows returned
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ settings: settings || { is_enabled: false, delay_seconds: 10 } });
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const auth = await requireAdmin(supabase);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await request.json();
    const { is_enabled, delay_seconds } = body;

    const { data: settings, error } = await supabase
      .from('popup_settings')
      .upsert({
        id: 1,
        is_enabled: is_enabled ?? true,
        delay_seconds: delay_seconds ?? 10,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ settings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
