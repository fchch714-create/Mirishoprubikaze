'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (
      error.message === 'NEXT_REDIRECT' ||
      error.digest?.startsWith('NEXT_REDIRECT') ||
      error.message?.includes('NEXT_REDIRECT') ||
      error.message === 'NEXT_NOT_FOUND' ||
      error.digest?.startsWith('NEXT_NOT_FOUND')
    ) {
      return;
    }
    console.error('Locale error boundary caught:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <h2 className="text-2xl font-black text-foreground mb-2">Xəta Baş Verdi</h2>
      <p className="text-sm text-muted-foreground mb-6 max-w-md font-medium">
        Səhifə yüklənərkən mühüm bir xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="px-6 py-2.5 bg-rubik-brand text-white font-bold rounded-xl shadow-md hover:bg-rubik-brand-dark transition-colors cursor-pointer"
      >
        Yenidən Cəhd Et
      </button>
    </div>
  );
}
