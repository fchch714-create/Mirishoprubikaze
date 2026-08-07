export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    const cookieNames = allCookies.map(c => c.name);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (sessionError) {
      return NextResponse.json({
        sessionExists: false,
        message: `Session error: ${sessionError.message}`,
        cookiesList: cookieNames,
        supabaseUrlConfigured: !!supabaseUrl,
        supabaseAnonKeyConfigured: !!supabaseAnonKey,
      });
    }

    if (!session?.user) {
      return NextResponse.json({
        sessionExists: false,
        message: 'no session on server',
        cookiesList: cookieNames,
        supabaseUrlConfigured: !!supabaseUrl,
        supabaseAnonKeyConfigured: !!supabaseAnonKey,
      });
    }

    // Try to get user profile and role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profileError) {
      return NextResponse.json({
        sessionExists: true,
        userId: session.user.id,
        userEmail: session.user.email,
        role: null,
        message: `Profile lookup error: ${profileError.message}. This might be due to RLS policies or missing profile row.`,
        cookiesList: cookieNames,
        supabaseUrlConfigured: !!supabaseUrl,
        supabaseAnonKeyConfigured: !!supabaseAnonKey,
      });
    }

    return NextResponse.json({
      sessionExists: true,
      userId: session.user.id,
      userEmail: session.user.email,
      role: profile?.role || 'customer',
      message: 'Success',
      cookiesList: cookieNames,
      supabaseUrlConfigured: !!supabaseUrl,
      supabaseAnonKeyConfigured: !!supabaseAnonKey,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        sessionExists: false,
        error: error?.message || 'Server error occurred',
        role: 'guest',
        message: `Exception: ${error?.message || 'unknown'}`,
      },
      { status: 500 }
    );
  }
}

