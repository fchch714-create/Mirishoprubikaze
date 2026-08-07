import Link from 'next/link';

export default function LocaleNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
      <h1 className="text-4xl font-black mb-2 text-foreground">404 - Səhifə Tapılmadı</h1>
      <p className="text-muted-foreground mb-6 max-w-md">Axtardığınız səhifə mövcud deyil, ünvan dəyişdirilib və ya silinib.</p>
      <Link
        href="/az"
        className="px-6 py-3 bg-rubik-brand text-white font-bold rounded-xl shadow-md hover:bg-rubik-brand-dark transition-colors"
      >
        Ana Səhifəyə Qayıt
      </Link>
    </div>
  );
}
