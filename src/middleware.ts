import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { match } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';

const locales = ['az', 'ru', 'en'];
const defaultLocale = 'az';

function getLocale(request: NextRequest): string {
  const negotiatorHeaders: Record<string, string> = {};
  request.headers.forEach((value, key) => (negotiatorHeaders[key] = value));

  const languages = new Negotiator({ headers: negotiatorHeaders }).languages();
  try {
    return match(languages, locales, defaultLocale);
  } catch (error) {
    return defaultLocale;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (!pathnameHasLocale && !pathname.startsWith('/api') && !pathname.startsWith('/_') && !pathname.includes('.')) {
    const locale = getLocale(request);
    request.nextUrl.pathname = `/${locale}${pathname}`;
    return NextResponse.redirect(request.nextUrl);
  }

  // Extract locale and path elements
  const segments = pathname.split('/');
  const locale = locales.includes(segments[1]) ? segments[1] : defaultLocale;
  const isNestedAdminRoute = pathname.startsWith(`/${locale}/admin/`) && pathname !== `/${locale}/admin/`;

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const host = request.headers.get('host') || '';
  const referer = request.headers.get('referer') || '';
  const secFetchDest = request.headers.get('sec-fetch-dest') || '';

  const isIframe = secFetchDest === 'iframe' || referer.includes('ai.studio') || referer.includes('google.com');
  const isRunApp = host.includes('.run.app');
  const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');

  const useSameSiteNone = isIframe || isRunApp;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll().map((c) => ({ name: c.name, value: c.value }));
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, {
              ...options,
              secure: isLocalhost ? false : true,
              sameSite: useSameSiteNone ? 'none' as const : 'lax' as const,
              path: options.path || '/',
            });
          });
        },
      },
    }
  );

  // FIX: ONLY protect nested admin routes (e.g., /az/admin/dashboard). 
  // DO NOT run redirects on the exact root /az/admin to allow the login client component to mount safely.
  if (isNestedAdminRoute) {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL(`/${locale}/admin`, request.url));
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && profile.role !== 'manager')) {
      return NextResponse.redirect(new URL(`/${locale}`, request.url));
    }

    // MFA protection check (AAL1 demanding AAL2)
    const { data: mfaData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    const currentLevel = mfaData?.currentLevel;
    const nextLevel = mfaData?.nextLevel;
    const isMfaRequired = nextLevel === 'aal2' && currentLevel !== 'aal2';

    if (isMfaRequired) {
      const deviceId = request.cookies.get('deviceId')?.value;
      let isTrusted = false;

      if (deviceId) {
        const { data: deviceCheck, error: deviceError } = await supabase
          .from('trusted_devices')
          .select('expires_at')
          .eq('user_id', user.id)
          .eq('device_id', deviceId)
          .single();

        if (deviceCheck && !deviceError && new Date(deviceCheck.expires_at) > new Date()) {
          isTrusted = true;
        }
      }

      if (!isTrusted) {
        return NextResponse.redirect(new URL(`/${locale}/admin`, request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|assets|api).*)'],
};
