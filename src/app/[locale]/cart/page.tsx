import { getDictionary } from '@/i18n/dictionaries';
import { CartClientContent } from '@/components/layout/CartClientContent';

export const revalidate = 0; // Dynamic shopping cart must never cache

interface CartPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function CartPage({ params }: CartPageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  return (
    <div className="min-h-screen bg-background">
      <CartClientContent locale={locale} dict={dict} />
    </div>
  );
}
