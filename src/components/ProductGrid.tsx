import { ProductCard } from '@/components/ProductCard';
import type { ApplicationDictionary } from '@/types/application.types';

interface Product {
  id: string;
  title: string;
  price_azn: number;
  image_url: string;
  stock_quantity: number;
}

interface ProductGridProps {
  products: Product[];
  dict: ApplicationDictionary;
}

export function ProductGrid({ products = [], dict }: ProductGridProps) {
  const uniqueProducts = Array.isArray(products)
    ? Array.from(new Map(products.map((p) => [p.id, p])).values())
    : [];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 w-full max-w-screen-2xl mx-auto px-4 md:px-8 py-8">
      {uniqueProducts.map((product) => (
        <ProductCard key={product.id} product={product} dict={dict} />
      ))}
    </div>
  );
}
