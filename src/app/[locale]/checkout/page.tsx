import { getDictionary } from '@/i18n/dictionaries';
import { CheckoutForm } from '@/components/CheckoutForm';

export default async function CheckoutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <CheckoutForm dict={dict} locale={locale} />
    </div>
  );
}
