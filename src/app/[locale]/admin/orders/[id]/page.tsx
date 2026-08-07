import OrderDetailClient from '@/components/admin/orders/OrderDetailClient';

export default function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  return <OrderDetailClient orderId={params.id} />;
}
