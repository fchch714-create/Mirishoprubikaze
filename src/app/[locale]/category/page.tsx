import { getDictionary } from '@/i18n/dictionaries';
import { CategoryClientContent } from '@/components/layout/CategoryClientContent';
import { getActiveProducts, mapProductToLocale, Product } from '@/lib/supabase/queries/products';
import { applyCampaignDiscounts } from '@/lib/actions/campaigns';

export const revalidate = 60;

interface CategoryPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function CatalogPage({ params }: CategoryPageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  let formattedProducts: Product[] = [];
  try {
    const products = await getActiveProducts();
    const mapped = products.map((p) => ({
      ...mapProductToLocale(p, locale),
      category_slug: p.category_slug || p.category_id || p.category || undefined,
      brand: p.brands?.name || p.brand || p.brand_name || undefined,
      brands: p.brands,
      brand_id: p.brand_id,
      mechanics: p.mechanics || undefined
    }));
    formattedProducts = await applyCampaignDiscounts(mapped);
  } catch (err) {
    console.error('Failed to load products:', err);
  }

  return (
    <div className="min-h-screen bg-background">
      <CategoryClientContent
        initialProducts={formattedProducts}
        categoryItem={null}
        locale={locale}
        dict={dict}
      />
    </div>
  );
}
