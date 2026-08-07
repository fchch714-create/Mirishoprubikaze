'use client';

import * as React from 'react';
import { signUp, signIn } from '@/lib/actions/auth';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export function AuthClient({ locale }: { locale: string }) {
  const router = useRouter();
  const [isLogin, setIsLogin] = React.useState(false); // Default to signup for testing
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState('');
  const [successMsg, setSuccessMsg] = React.useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      if (isLogin) {
        // Direct client-side login to guarantee client-side session is active immediately
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          let finalError = error.message;
          if (finalError === '{}' || finalError === '""') {
            finalError = 'Məlumatlar yanlışdır və ya hesab təsdiq edilməyib.';
          }
          setErrorMsg(finalError);
          setIsLoading(false);
          return;
        }

        if (data?.session) {
          try {
            // Set session explicitly on client to ensure immediate availability
            await supabase.auth.setSession({
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
            });

            // Sync session with server cookies to prevent guest-state redirection loops
            await fetch('/api/auth/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include', // ensure cookies are successfully set in cross-site/iframe contexts
              body: JSON.stringify({
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token,
              }),
            });
          } catch (syncErr) {
            console.error('Session sync error:', syncErr);
          }
        }

        // Delay briefly to allow browser to flush and apply Set-Cookie headers before navigation
        await new Promise((r) => setTimeout(r, 350));

        router.refresh();
        router.push(`/${locale}/account`);
      } else {
        // Sign up using server action to handle any email sending or admin logs
        const res = await signUp(formData);
        if (res && res.error) {
          let finalError = 'Gözlənilməz xəta baş verdi.';
          if (typeof res.error === 'string') {
            finalError = res.error;
          } else if (typeof res.error === 'object' && res.error !== null) {
            finalError = (res.error as any).message || JSON.stringify(res.error);
          }
          if (finalError === '{}' || finalError === '""') {
            finalError = 'Bu e-poçt artıq istifadə olunub və ya şifrə çox sadədir (ən az 6 simvol).';
          }
          setErrorMsg(finalError);
          setIsLoading(false);
        } else {
          setSuccessMsg('Hesab yaradıldı! Zəhmət olmasa e-poçtunuzdakı təsdiq linkinə klikləyin.');
          setIsLoading(false);
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Sistem xətası baş verdi. Yenidən cəhd edin.');
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-600 text-sm font-bold rounded-xl text-center shadow-sm">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-sm font-bold rounded-xl flex flex-col items-center gap-2 text-center shadow-sm">
          <CheckCircle2 className="h-6 w-6 text-emerald-500 animate-bounce"/>
          <span>{successMsg}</span>
        </div>
      )}

      {!successMsg && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Ad və Soyad</label>
              <input name="fullName" type="text" required={!isLogin} placeholder="Adınızı daxil edin" className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:border-rubik-brand transition-colors"/>
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">E-poçt ünvanı</label>
            <input name="email" type="email" required placeholder="name@example.com" className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:border-rubik-brand transition-colors"/>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Şifrə</label>
            <input name="password" type="password" required placeholder="••••••••" className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:border-rubik-brand transition-colors"/>
          </div>

          <button type="submit" disabled={isLoading} className="w-full py-3 bg-rubik-brand text-white font-bold rounded-xl hover:bg-rubik-brand-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : null}
            {isLogin ? 'Daxil ol' : 'Qeydiyyatı Tamamla 🚀'}
          </button>
        </form>
      )}
      
      {!successMsg && (
        <div className="text-center pt-2">
          <button type="button" onClick={() => { setIsLogin(!isLogin); setErrorMsg(''); }} className="text-xs font-semibold text-muted-foreground hover:text-rubik-brand">
            {isLogin ? "Hesabınız yoxdur? Qeydiyyatdan keçin" : "Artıq hesabınız var? Daxil olun"}
          </button>
        </div>
      )}
    </div>
  );
}
