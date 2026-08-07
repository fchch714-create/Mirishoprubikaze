import { getDictionary } from '@/i18n/dictionaries';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getWishlist } from '@/lib/actions/wishlist';
import { WishlistClient } from '@/components/layout/WishlistClient';

export const revalidate = 0; // Dynamic wishlist must never cache

interface WishlistPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function WishlistPage({ params }: WishlistPageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  let wishlistItems: any[] = [];
  let user: any = null;

  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    user = authUser;
    
    if (user) {
      const res = await getWishlist(user.id);
      if (res.success && res.data) {
        // Map products correctly from joint query
        wishlistItems = res.data
          .map((item: any) => {
            if (!item.products) return null;
            return {
              id: item.products.id,
              title: item.products.title,
              price_azn: item.products.price_azn,
              image_url: item.products.image_url,
              stock_quantity: item.products.stock_quantity || 1,
              brand: item.products.brand || 'GAN',
            };
          })
          .filter(Boolean);
      }
    }
  } catch (error) {
    console.error('Failed to load server-side wishlist:', error);
  }

  return (
    <div className="min-h-screen bg-background py-8 md:py-12">
      <WishlistClient
        locale={locale}
        dict={dict}
        initialItems={wishlistItems}
        isLoggedIn={!!user}
      />
    </div>
  );
}
