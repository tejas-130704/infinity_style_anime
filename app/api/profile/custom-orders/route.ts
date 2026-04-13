import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET user custom orders (action figures + posters)
export async function GET() {
  const supabase = await createClient();
  
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get custom action figures
  const { data: actionFigures, error: actionError } = await supabase
    .from('custom_action_figures')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Get personalized posters
  const { data: posters, error: posterError } = await supabase
    .from('personalized_posters')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (actionError || posterError) {
    return NextResponse.json(
      { error: actionError?.message || posterError?.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    actionFigures: actionFigures || [],
    posters: posters || [],
  });
}
