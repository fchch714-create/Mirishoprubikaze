import { getActiveProducts, mapProductToLocale, Product } from '@/lib/supabase/queries/products';
import { applyCampaignDiscounts } from '@/lib/actions/campaigns';
import { createClient } from '@/lib/supabase/client';
import { getDictionary } from '@/i18n/dictionaries';
import { HomepageContent } from '@/components/layout/HomepageContent';

export const revalidate = 60;

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function StorefrontPage({ params }: PageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  let banners: any[] = [];
  try {
    const supabase = createClient();
    const { data: bannersData } = await supabase
      .from('banners')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });
    if (bannersData) {
      banners = bannersData;
    }
  } catch (err) {
    console.warn('Banners fetch error:', err);
  }

  let formattedProducts: Product[] = [];
  try {
    const rawProducts = await getActiveProducts();
    const formatted = (rawProducts || []).map((p) => mapProductToLocale(p, locale));
    formattedProducts = await applyCampaignDiscounts(formatted);
  } catch (err) {
    console.warn('Products fetch error:', err);
  }

  return (
    <div className="min-h-screen bg-background">
      <HomepageContent
        products={formattedProducts}
        dict={dict}
        locale={locale}
        banners={banners}
      />
    </div>
  );
}
