import { getDictionary } from '@/i18n/dictionaries';
import { CategoryClientContent } from '@/components/layout/CategoryClientContent';
import { searchProducts, Product } from '@/lib/supabase/queries/products';
import { applyCampaignDiscounts } from '@/lib/actions/campaigns';

export const revalidate = 0;

interface SearchPageProps {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    q?: string;
  }>;
}

export default async function SearchPage({ params, searchParams }: SearchPageProps) {
  const { locale } = await params;
  const { q } = await searchParams;
  const dict = await getDictionary(locale);

  const queryTerm = (q || '').trim();

  let formattedProducts: Product[] = [];
  if (queryTerm) {
    try {
      const foundProducts = await searchProducts(queryTerm, locale);
      const mapped = foundProducts.map((p) => ({
        ...p,
        category_slug: p.category_slug || p.category_id || p.category || undefined,
        brand: p.brands?.name || p.brand || p.brand_name || undefined,
        brands: p.brands,
        brand_id: p.brand_id,
        mechanics: p.mechanics || undefined
      }));
      formattedProducts = await applyCampaignDiscounts(mapped);
    } catch (err) {
      console.error('Failed to execute search in SearchPage:', err);
    }
  }

  const categoryItem = {
    id: 'search',
    slug: 'search',
    title: {
      az: queryTerm ? `Axtarış nəticələri: "${queryTerm}"` : 'Axtarış',
      en: queryTerm ? `Search results for "${queryTerm}"` : 'Search',
      ru: queryTerm ? `Результаты поиска: "${queryTerm}"` : 'Поиск',
    },
    description: {
      az: queryTerm
        ? `${formattedProducts.length} məhsul tapıldı.`
        : 'Axtarış zolağına məhsul adı və ya brend yazın.',
      en: queryTerm
        ? `${formattedProducts.length} products found.`
        : 'Type a product name or brand in the search bar.',
      ru: queryTerm
        ? `Найдено ${formattedProducts.length} товаров.`
        : 'Введите название товара или бренд в строку поиска.',
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <CategoryClientContent
        initialProducts={formattedProducts}
        categoryItem={categoryItem}
        locale={locale}
        dict={dict}
      />
    </div>
  );
}
