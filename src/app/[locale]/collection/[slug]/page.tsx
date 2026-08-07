import { getDictionary } from '@/i18n/dictionaries';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ProductCard } from '@/components/ProductCard';
import { Package, Sparkles } from 'lucide-react';
import { mapProductToLocale } from '@/lib/supabase/queries/products';
import { applyCampaignDiscounts } from '@/lib/actions/campaigns';

export const revalidate = 60;

interface CollectionPageProps {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { locale, slug } = await params;
  const dict = await getDictionary(locale);

  const supabase = await createServerSupabaseClient();

  // 1. Get collection info
  const { data: collection, error: collError } = await supabase
    .from('collections')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (collError || !collection) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <Package className="w-16 h-16 text-amber-500 mb-4 animate-bounce" />
        <h1 className="text-2xl font-black uppercase text-white tracking-wider">Kolleksiya Tapılmadı</h1>
        <p className="text-slate-400 mt-2 max-w-sm text-sm">
          Axtardığınız kolleksiya mövcud deyil və ya passivləşdirilib.
        </p>
      </div>
    );
  }

  // 2. Get associated products
  const { data: colProducts } = await supabase
    .from('collection_products')
    .select('product_id')
    .eq('collection_id', collection.id);

  const productIds = colProducts?.map(cp => cp.product_id) || [];

  let productsList: any[] = [];
  if (productIds.length > 0) {
    const { data: rawProducts } = await supabase
      .from('products')
      .select('*')
      .in('id', productIds)
      .eq('is_active', true);

    if (rawProducts) {
      const mapped = rawProducts.map(p => {
        const localized = mapProductToLocale(p, locale);
        return {
          id: p.id,
          title: localized.title || localized.name || '',
          price_azn: Number(p.price_azn),
          image_url: p.image_url || '',
          stock_quantity: Number(p.stock_quantity),
        };
      });
      productsList = await applyCampaignDiscounts(mapped);
    }
  }

  const localizedName = collection[`name_${locale}`] || collection.name_az;
  const localizedDesc = collection[`description_${locale}`] || collection.description_az;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Banner Section */}
        <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-900 p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 shadow-2xl">
          {collection.image_url && (
            <div className="w-full md:w-1/3 aspect-video md:aspect-square rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shrink-0">
              <img 
                src={collection.image_url} 
                alt={String(localizedName)} 
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="space-y-4 flex-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs font-black text-amber-500 uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5" /> Eksklüziv Kolleksiya
            </div>
            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-wider text-white">
              {String(localizedName)}
            </h1>
            {localizedDesc && (
              <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-2xl">
                {String(localizedDesc)}
              </p>
            )}
            <div className="text-xs font-mono text-slate-500">
              Məhsul sayı: <span className="text-amber-500 font-bold">{productsList.length}</span>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div>
          {productsList.length === 0 ? (
            <div className="text-center py-24 bg-slate-900 rounded-3xl border border-slate-800 p-8">
              <Package className="w-12 h-12 text-slate-700 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-1">Kolleksiya boşdur</h3>
              <p className="text-slate-500 text-sm">Bu kolleksiyaya hələlik heç bir məhsul əlavə edilməyib.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {productsList.map((product) => (
                <div key={product.id} className="text-slate-900">
                  <ProductCard product={product} dict={dict} />
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
