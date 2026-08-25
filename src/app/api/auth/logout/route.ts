// src/app/api/auth/logout/route.ts

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    const response = NextResponse.json({ status: 'success' });

    const host = req.headers.get('host') || '';
    const cleanHost = host.split(':')[0].toLowerCase();
    const isLocalhost = cleanHost === 'localhost' || cleanHost === '127.0.0.1';
    const isRunApp = cleanHost.endsWith('.run.app');
    
    const referer = req.headers.get('referer') || '';
    const secFetchDest = req.headers.get('sec-fetch-dest') || '';
    const isIframe = (() => {
      if (secFetchDest === 'iframe') return true;
      if (!referer) return false;
      try {
        const parsed = new URL(referer);
        const h = parsed.hostname.toLowerCase();
        return h === 'ai.studio' || h.endsWith('.ai.studio') || h === 'google.com' || h.endsWith('.google.com');
      } catch {
        return false;
      }
    })();

    const sameSiteValue = (isIframe || isRunApp) ? 'none' : 'lax';

    if (supabaseUrl && supabaseAnonKey) {
      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return req.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, {
                ...options,
                secure: !isLocalhost,
                sameSite: sameSiteValue as any,
                path: options.path || '/',
              });
            });
          }
        }
      });

      // Revoke all sessions globally (invalidates refresh tokens everywhere)
      await supabase.auth.signOut({ scope: 'global' });
    }

    // Explicitly delete custom device trust cookies
    response.cookies.delete('deviceId');
    response.cookies.set('deviceId', '', {
      path: '/',
      expires: new Date(0),
      secure: !isLocalhost,
      sameSite: sameSiteValue as any,
    });

    response.cookies.delete('x-device-id');
    response.cookies.set('x-device-id', '', {
      path: '/',
      expires: new Date(0),
      secure: !isLocalhost,
      sameSite: sameSiteValue as any,
    });

    // Explicitly clear all Supabase auth cookies
    req.cookies.getAll().forEach((cookie) => {
      if (cookie.name.startsWith('sb-') || cookie.name.includes('supabase-') || cookie.name.includes('auth')) {
        response.cookies.set(cookie.name, '', {
          path: '/',
          expires: new Date(0),
          secure: !isLocalhost,
          sameSite: sameSiteValue as any,
        });
      }
    });

    return response;
  } catch (err: any) {
    console.error('Logout error:', err);
    return NextResponse.json({ error: err.message || 'Server xətası baş verdi.' }, { status: 500 });
  }
}
