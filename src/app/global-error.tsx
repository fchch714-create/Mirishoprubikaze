'use client';

import * as React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error('Global error caught:', error);
  }, [error]);

  return (
    <html lang="az">
      <body className="bg-background text-foreground flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <h2 className="text-2xl font-black mb-2">Sistem Xətası</h2>
        <p className="text-sm text-muted-foreground mb-6 max-w-md">Səhifə yüklənərkən xəta baş verdi. Zəhmət olmasa səhifəni yeniləyin.</p>
        <button
          onClick={() => reset()}
          className="px-6 py-2.5 bg-rubik-brand text-white font-bold rounded-xl shadow-md transition-colors cursor-pointer"
        >
          Yenidən Cəhd Et
        </button>
      </body>
    </html>
  );
}
