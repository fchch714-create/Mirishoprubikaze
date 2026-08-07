import ProductFormClient from '@/components/admin/products/ProductFormClient';

export default async function AdminProductFormPage({
  params
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;
  const isNew = !id || id === 'new';

  return <ProductFormClient isNew={isNew} productId={isNew ? undefined : id} />;
}


