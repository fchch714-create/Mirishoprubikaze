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

  const supabase = createClient();

  // 1. Fetch Active Products
  let formattedProducts: Product[] = [];
  let rawFeaturedProduct: any = null;

  try {
    const rawProducts = await getActiveProducts();
    const formatted = (rawProducts || []).map((p) => mapProductToLocale(p, locale));
    formattedProducts = await applyCampaignDiscounts(formatted);

    // Look for is_featured product in rawProducts first
    rawFeaturedProduct = (rawProducts || []).find((p: any) => p.is_featured === true);
  } catch (err) {
    console.warn('Products fetch error:', err);
  }

  // 2. Fetch featured product explicitly if not found in active list
  if (!rawFeaturedProduct) {
    try {
      const { data: featuredData } = await supabase
        .from('products')
        .select('*, brands (*), categories (*), product_categories (*), variants (*)')
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (featuredData && featuredData.length > 0) {
        rawFeaturedProduct = featuredData[0];
      }
    } catch (err) {
      console.warn('Featured product fetch error:', err);
    }
  }

  const featuredProduct = rawFeaturedProduct
    ? mapProductToLocale(rawFeaturedProduct, locale)
    : (formattedProducts.length > 0 ? formattedProducts[0] : null);

  // 3. Fetch Active Campaign (now between start_date and end_date)
  let activeCampaign: any = null;
  try {
    const nowStr = new Date().toISOString();
    const { data: campaignData } = await supabase
      .from('campaigns')
      .select('*')
      .eq('is_active', true)
      .lte('start_date', nowStr)
      .gte('end_date', nowStr)
      .order('created_at', { ascending: false })
      .limit(1);

    if (campaignData && campaignData.length > 0) {
      activeCampaign = campaignData[0];
    }
  } catch (err) {
    console.warn('Campaign fetch error:', err);
  }

  // 4. Fetch Categories
  let categories: any[] = [];
  try {
    const { data: categoriesData } = await supabase
      .from('categories')
      .select('*')
      .order('name_az', { ascending: true });

    if (categoriesData && categoriesData.length > 0) {
      categories = categoriesData;
    }
  } catch (err) {
    console.warn('Categories fetch error:', err);
  }

  return (
    <div className="min-h-screen bg-background">
      <HomepageContent
        initialProducts={formattedProducts}
        featuredProduct={featuredProduct}
        activeCampaign={activeCampaign}
        categories={categories}
        dict={dict}
        locale={locale}
      />
    </div>
  );
}

