import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/client';

export async function GET(req: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  }

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', data.user.id)
    .single();

  if (userError) {
    return NextResponse.json({ success: false, error: userError.message }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: user }, { status: 200 });
}

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
  }

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('id', user.id)
    .single();

  if (userData) {
    // User exists, update last session
    const { error } = await supabase
      .from('users')
      .update({ last_session_at: new Date() })
      .eq('id', user.id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, message: 'User updated' }, { status: 200 });
  } else {
    // User does not exist, create them
    const newUser = {
      id: user.id,
      email: user.email,
      display_name: user.user_metadata.full_name || user.email?.split('@')[0],
      created_at: new Date(),
      last_session_at: new Date(),
      current_streak: 0,
      coins: 180,
      energy: 10,
      dominion_points: 0,
      rank: "G",
      last_session_completed_at: null,
      weekly_activity: [false, false, false, false, false, false, false],
      tutor_session: { isActive: false, exchangesLeft: 0 },
    };

    const { error } = await supabase.from('users').insert([newUser]);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: newUser }, { status: 201 });
  }
}