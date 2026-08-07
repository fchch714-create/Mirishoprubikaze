'use client';

import * as React from 'react';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error('Root error caught:', error);
  }, [error]);

  return (
    <div className="bg-background text-foreground flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <h1 className="text-4xl font-black mb-2">Server Xətası (500)</h1>
      <p className="text-muted-foreground mb-6 max-w-md">Müvəqqəti texniki xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.</p>
      <button
        type="button"
        onClick={() => reset()}
        className="px-6 py-3 bg-rubik-brand text-white font-bold rounded-xl shadow-md hover:bg-rubik-brand-dark transition-colors cursor-pointer"
      >
        Yenidən Cəhd Et
      </button>
    </div>
  );
}
