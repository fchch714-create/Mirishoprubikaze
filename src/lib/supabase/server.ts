import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function createRouteHandlerSupabaseClient(req: NextRequest, res: NextResponse) {
  const host = req.headers.get('host') || '';
  const referer = req.headers.get('referer') || '';
  const secFetchDest = req.headers.get('sec-fetch-dest') || '';

  const isIframe = secFetchDest === 'iframe' || referer.includes('ai.studio') || referer.includes('google.com');
  const isRunApp = host.includes('.run.app');
  const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');

  const useSameSiteNone = isIframe || isRunApp;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  return createServerClient(
    url,
    anonKey,
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
            res.cookies.set(name, value, secureOptions);
          });
        },
      },
    }
  );
}

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  const headerList = await headers();
  const host = headerList.get('host') || '';
  const referer = headerList.get('referer') || '';
  const secFetchDest = headerList.get('sec-fetch-dest') || '';

  // Determine if we are running in the AI Studio preview iframe or localhost
  const isIframe = secFetchDest === 'iframe' || referer.includes('ai.studio') || referer.includes('google.com');
  const isRunApp = host.includes('.run.app');
  const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');

  // If in AI Studio iframe, we must use sameSite: 'none' and secure: true.
  // Otherwise, for normal browser access (Vercel/custom domain), use sameSite: 'lax'.
  const useSameSiteNone = isIframe || isRunApp;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  return createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              const secureOptions = {
                ...options,
                secure: isLocalhost ? false : true,
                sameSite: useSameSiteNone ? 'none' as const : 'lax' as const,
                path: options.path || '/',
              };
              cookieStore.set(name, value, secureOptions);
            });
          } catch {
            // Ignore cookie set errors in Server Components / API routes
          }
        },
      },
    }
  );
}

export function createAdminSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!key) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable.');
  }

  return createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {}
      }
    }
  );
}
