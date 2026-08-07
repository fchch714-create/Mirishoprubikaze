export const dynamic = 'force-dynamic';
export const revalidate = 0;

import * as React from 'react';
import AdminDashboardClient from '@/components/admin/AdminDashboardClient';
import { getDashboardStats, getOrders } from '@/lib/actions/admin';

export default async function AdminDashboardPage() {
  const statsRes = await getDashboardStats();
  const ordersRes = await getOrders();
  
  const stats = statsRes.success && statsRes.stats ? statsRes.stats : {
    totalSales: 0,
    totalOrders: 0,
    totalProducts: 0,
    openSupportTickets: 0,
  };
  
  const recentOrders = ordersRes.success && ordersRes.data ? ordersRes.data.slice(0, 10) : [];
  
  return <AdminDashboardClient stats={stats} recentOrders={recentOrders} />;
}
