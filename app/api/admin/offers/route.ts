import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin-auth';

export async function GET() {
  const supabase = await createClient();
  const auth = await requireAdmin(supabase);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { data: offers, error } = await supabase
    .from('popup_offers')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ offers: offers ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const auth = await requireAdmin(supabase);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await request.json();
    const { title, discount_text, description, expiry_date, cta_url, is_active } = body;

    if (!title || !discount_text || !expiry_date || !cta_url) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: offer, error } = await supabase
      .from('popup_offers')
      .insert([
        {
          title,
          discount_text,
          description,
          expiry_date,
          cta_url,
          is_active: is_active ?? true,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ offer });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const auth = await requireAdmin(supabase);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await request.json();
    const { id, title, discount_text, description, expiry_date, cta_url, is_active } = body;

    if (!id) return NextResponse.json({ error: 'Missing offer ID' }, { status: 400 });

    const { data: offer, error } = await supabase
      .from('popup_offers')
      .update({
        title,
        discount_text,
        description,
        expiry_date,
        cta_url,
        is_active,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ offer });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const auth = await requireAdmin(supabase);
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Missing offer ID' }, { status: 400 });

    const { error } = await supabase.from('popup_offers').delete().eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
