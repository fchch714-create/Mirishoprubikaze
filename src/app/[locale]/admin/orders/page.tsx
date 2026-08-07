import OrdersListClient from '@/components/admin/orders/OrdersListClient';
import { getOrders } from '@/lib/actions/admin';

export default async function AdminOrdersPage() {
  const ordersRes = await getOrders();
  const orders = ordersRes.success && ordersRes.data ? ordersRes.data : [];
  
  return <OrdersListClient initialOrders={orders} />;
}
