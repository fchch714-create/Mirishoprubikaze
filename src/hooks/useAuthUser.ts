'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { signOut as serverSignOut } from '@/lib/actions/auth';

export interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export function useAuthUser() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userRole, setUserRole] = useState<string>('guest');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchRole = useCallback(async (userId: string | undefined) => {
    if (!userId) {
      setUserRole('guest');
      return;
    }
    try {
      const res = await fetch('/api/me', {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setUserRole(data.role || 'customer');
      } else {
        setUserRole('customer');
      }
    } catch (err) {
      console.error('Failed to fetch user role:', err);
      setUserRole('customer');
    }
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user as AuthUser);
        await fetchRole(session.user.id);
      } else {
        setUser(null);
        setUserRole('guest');
      }
    } catch (err) {
      console.error('Error getting session:', err);
      setUser(null);
      setUserRole('guest');
    } finally {
      setLoading(false);
    }
  }, [fetchRole]);

  useEffect(() => {
    refreshSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user as AuthUser);
        await fetchRole(session.user.id);
      } else {
        setUser(null);
        setUserRole('guest');
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshSession, fetchRole]);

  const handleSignOut = useCallback(async (locale: string, router: any) => {
    try {
      await supabase.auth.signOut();
      await serverSignOut();
      setUser(null);
      setUserRole('guest');
      router.push(`/${locale}/`);
      router.refresh();
    } catch (err) {
      console.error('Sign out error:', err);
    }
  }, []);

  return {
    user,
    userRole,
    loading,
    refreshSession,
    signOut: handleSignOut,
  };
}
