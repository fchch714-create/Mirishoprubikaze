import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  if (typeof window !== 'undefined') {
    console.warn('Supabase environment variables NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY are missing.');
  }
}

// Check if we are inside an iframe (e.g., AI Studio preview workspace)
// or on a normal browser tab (Vercel production/custom domain)
const isIframe = typeof window !== 'undefined' && window.self !== window.top;
const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const dynamicCookieOptions = {
  secure: isLocalhost ? false : true,
  sameSite: (isIframe ? 'none' : 'lax') as 'none' | 'lax',
  path: '/',
};

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  cookieOptions: dynamicCookieOptions,
});

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      cookieOptions: dynamicCookieOptions,
    }
  );
}

