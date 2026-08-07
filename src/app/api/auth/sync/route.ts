export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { access_token, refresh_token } = await req.json();

    if (!access_token) {
      return NextResponse.json({ error: 'Access token is required' }, { status: 400 });
    }

    const host = req.headers.get('host') || '';
    const referer = req.headers.get('referer') || '';
    const secFetchDest = req.headers.get('sec-fetch-dest') || '';

    const isIframe = secFetchDest === 'iframe' || referer.includes('ai.studio') || referer.includes('google.com');
    const isRunApp = host.includes('.run.app');
    const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');

    const useSameSiteNone = isIframe || isRunApp;

    // Create the final response first
    const response = NextResponse.json({ status: 'success' });

    // Initialize createServerClient
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
            cookiesToSet.forEach(({ name, value, options }) => {
              const secureOptions = {
                ...options,
                secure: isLocalhost ? false : true,
                sameSite: useSameSiteNone ? 'none' as const : 'lax' as const,
                path: options.path || '/',
              };
              response.cookies.set(name, value, secureOptions);
            });
          },
        },
      }
    );

    // Explicitly call setSession to bake the authentication cookies into the response headers
    const { data, error } = await supabase.auth.setSession({
      access_token,
      refresh_token: refresh_token || '',
    });

    if (error || !data.user) {
      return NextResponse.json({ error: error?.message || 'Failed to authenticate session' }, { status: 401 });
    }

    const user = data.user;

    // Synchronize the profile row and user roles
    const adminSupabase = createAdminSupabaseClient();
    
    const { data: existingProfile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !existingProfile) {
      console.log(`Creating missing profile for user ${user.id} (${user.email})`);
      
      let role = 'customer';
      const adminEmails = ['rubikshopaz@gmail.com', 'mirselimsahbazov2@gmail.com'];
      if (user.email && adminEmails.includes(user.email.toLowerCase())) {
        role = 'admin';
      }

      const { error: insertError } = await adminSupabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || '',
          phone: user.user_metadata?.phone || '',
          role: role,
        });

      if (insertError) {
        console.error('Failed to create user profile during session sync:', insertError.message);
        return NextResponse.json({ 
          error: `Profil yaradıla bilmədi: ${insertError.message}` 
        }, { status: 500 });
      }
    } else {
      if (!existingProfile.email && user.email) {
        await adminSupabase
          .from('profiles')
          .update({ email: user.email })
          .eq('id', user.id);
      }
      const adminEmails = ['rubikshopaz@gmail.com', 'mirselimsahbazov2@gmail.com'];
      if (user.email && adminEmails.includes(user.email.toLowerCase()) && existingProfile.role !== 'admin') {
        const { error: updateError } = await adminSupabase
          .from('profiles')
          .update({ role: 'admin' })
          .eq('id', user.id);

        if (updateError) {
          console.error('Failed to update user role during session sync:', updateError.message);
          return NextResponse.json({ 
            error: `Admin rolunuz yenilənə bilmədi: ${updateError.message}` 
          }, { status: 500 });
        }
      }
    }

    return response;
  } catch (err: any) {
    console.error('Session sync API exception:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

