'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuthUser } from '@/hooks/useAuthUser';
import { supabase } from '@/lib/supabase/client';
import { AccountDashboardClient } from '@/components/layout/AccountDashboardClient';
import type { ApplicationDictionary } from '@/types/application.types';

interface RequireAuthClientProps {
  dict: ApplicationDictionary;
  locale: string;
}

export default function RequireAuthClient({ dict, locale }: RequireAuthClientProps) {
  const router = useRouter();
  const { user, loading } = useAuthUser();
  const [profile, setProfile] = React.useState<any>(null);
  const [profileLoading, setProfileLoading] = React.useState(true);

  React.useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace(`/${locale}`);
      return;
    }

    const fetchProfile = async () => {
      try {
        setProfileLoading(true);
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile for dashboard:', error);
          // Set fallback profile from user metadata if database lookup fails
          setProfile({
            id: user.id,
            email: user.email || '',
            fullName: user.user_metadata?.full_name || '',
            phone: '',
            address: '',
          });
        } else if (profileData) {
          setProfile({
            id: user.id,
            email: user.email || '',
            fullName: profileData.full_name || user.user_metadata?.full_name || '',
            phone: profileData.phone || '',
            address: profileData.address || '',
          });
        }
      } catch (err) {
        console.error('Exception fetching profile:', err);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, [user, loading, locale, router]);

  if (loading || (user && profileLoading)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] py-12 px-4 text-center">
        <div className="relative w-16 h-16 mb-4">
          {/* Animated custom crimson spinner */}
          <div className="absolute inset-0 rounded-full border-4 border-rubik-brand/10 border-t-rubik-brand animate-spin" />
          <div className="absolute inset-2 rounded-full border-4 border-rubik-brand/5 border-b-rubik-brand/60 animate-spin animate-reverse" />
        </div>
        <h3 className="text-sm font-black text-foreground uppercase tracking-widest animate-pulse">
          Məlumatlar Yüklənir...
        </h3>
        <p className="text-[11px] text-muted-foreground mt-1.5">
          Fərdi kabinetiniz təhlükəsiz şəkildə hazırlanır
        </p>
      </div>
    );
  }

  if (!user || !profile) {
    return null; // Let the redirect do its work
  }

  return (
    <div className="py-2">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">Fərdi Kabinet</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Aktiv Hesab
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Sifarişlərinizi izləyin, istək siyahınızı idarə edin və loyallıq xallarını tənzimləyin.
          </p>
        </div>
      </div>
      <AccountDashboardClient locale={locale} dict={dict} initialProfile={profile} />
    </div>
  );
}
