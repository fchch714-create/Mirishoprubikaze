'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  Menu,
  Bell,
  Search,
  ChevronDown,
  User,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Boxes,
  Compass,
  Sparkles,
  Info
} from 'lucide-react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { supabase } from '@/lib/supabase/client';

interface AdminLayoutClientProps {
  children: React.ReactNode;
  locale: string;
  userEmail: string;
  userRole: string;
}

export default function AdminLayoutClient({
  children,
  locale,
  userEmail,
  userRole
}: AdminLayoutClientProps) {
  const pathname = usePathname();

  // Sidebar responsive states
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  // Search input state
  const [searchQuery, setSearchQuery] = React.useState('');

  // Notifications state
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [notifications, setNotifications] = React.useState<any[]>([]);

  // Fetch actual notifications from active database
  React.useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(8);

        if (error) {
          console.error('Error fetching admin notifications:', error);
          return;
        }

        if (data && data.length > 0) {
          const mapped = data.map((n: any, idx: number) => ({
            id: n.id || idx,
            title: n.title_az || 'Sistem Bildirişi',
            desc: n.message_az || '',
            time: new Date(n.created_at).toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' }),
            unread: !n.is_read
          }));
          setNotifications(mapped);
        } else {
          // Dynamic live fallback from actual orders and low stock items
          const [recentOrdersRes, lowStockRes] = await Promise.all([
            supabase.from('orders').select('id, total, status, created_at').order('created_at', { ascending: false }).limit(4),
            supabase.from('products').select('id, title_az, stock').lte('stock', 5).order('stock', { ascending: true }).limit(4)
          ]);

          const liveItems: any[] = [];

          if (recentOrdersRes.data && recentOrdersRes.data.length > 0) {
            recentOrdersRes.data.forEach((ord: any) => {
              const orderShort = ord.id ? String(ord.id).substring(0, 8) : 'ord';
              liveItems.push({
                id: `ord-${ord.id}`,
                title: 'Yeni Sifariş daxil oldu',
                desc: `Sifariş #${orderShort} (${ord.total || 0} AZN). Status: ${ord.status || 'Gözləyir'}`,
                time: new Date(ord.created_at).toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' }),
                unread: ord.status === 'pending' || ord.status === 'processing'
              });
            });
          }

          if (lowStockRes.data && lowStockRes.data.length > 0) {
            lowStockRes.data.forEach((prod: any) => {
              liveItems.push({
                id: `stock-${prod.id}`,
                title: 'Anbar Xəbərdarlığı',
                desc: `${prod.title_az || 'Məhsul'} stok miqdarı ${prod.stock ?? 0} ədədə düşdü.`,
                time: 'Azalan Stok',
                unread: true
              });
            });
          }

          if (liveItems.length > 0) {
            setNotifications(liveItems.slice(0, 8));
          } else {
            setNotifications([
              { id: 'sys-1', title: 'Sistem Statusu', desc: 'Bütün anbarlar və kuryerlər optimal işləyir.', time: 'Canlı', unread: false }
            ]);
          }
        }
      } catch (err) {
        console.error('Error in fetchNotifications:', err);
      }
    };

    fetchNotifications();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('admin_notifications_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllAsRead = async () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('is_read', false);
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  };

  // Derive page heading based on current path
  const getPageTitle = () => {
    const segments = pathname.split('/');
    const lastSegment = segments[segments.length - 1];
    
    if (lastSegment === 'admin') return 'Süper Admin Dashboard';
    if (lastSegment === 'products') return 'Məhsulların İdarə Edilməsi';
    if (lastSegment === 'categories') return 'Kateqoriyalar';
    if (lastSegment === 'brands') return 'Brendlər & İstehsalçılar';
    if (lastSegment === 'collections') return 'Kolleksiyaların Qurulması';
    if (lastSegment === 'orders') return 'Sifarişlərin Monitorinqi';
    if (lastSegment === 'customers') return 'Müştəri Verilənlər Bazası';
    if (lastSegment === 'inventory') return 'İnventar & Stok İzləmə';
    if (lastSegment === 'warehouses') return 'Anbarlar & Logistika';
    if (lastSegment === 'shipping') return 'Çatdırılma Qiymətləri';
    if (lastSegment === 'payments') return 'Ödəniş Metodları';
    if (lastSegment === 'returns') return 'Qaytarılma Sorğuları';
    if (lastSegment === 'marketing') return 'Kampaniyalar & Kuponlar';
    if (lastSegment === 'cms') return 'CMS Səhifələrin Redaktəsi';
    if (lastSegment === 'seo') return 'SEO Optimizasiyası';
    if (lastSegment === 'reviews') return 'Müştəri Rəyləri';
    if (lastSegment === 'support') return 'Dəstək Biletləri (CRM)';
    if (lastSegment === 'analytics') return 'Analitik Göstəricilər';
    if (lastSegment === 'reports') return 'Satış Hesabatları';
    if (lastSegment === 'settings') return 'Sistem Konfiqurasiyası';
    
    return 'Admin Control Panel';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex relative overflow-hidden font-sans">
      
      {/* Background Decorative Ambient light */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Sidebar - Desktop (Collapsible) */}
      <div
        className={`hidden md:block h-screen sticky top-0 z-30 transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-72'
        }`}
      >
        <AdminSidebar
          locale={locale}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
        />
      </div>

      {/* Sidebar - Mobile Drawer */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 bg-black z-40 md:hidden"
            />
            {/* Sidebar drawer container */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 20 }}
              className="fixed inset-y-0 left-0 w-72 z-50 md:hidden"
            >
              <AdminSidebar
                locale={locale}
                isCollapsed={false}
                setIsCollapsed={setIsCollapsed}
                isMobileOpen={isMobileOpen}
                setIsMobileOpen={setIsMobileOpen}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        
        {/* Workspace Top Navigation Bar */}
        <header className="sticky top-0 z-20 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 px-4 md:px-8 py-4 flex items-center justify-between gap-4">
          
          {/* Mobile burger & Page Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="md:hidden p-2 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>
            
            <div className="leading-none hidden sm:block">
              <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest block">System Workspace</span>
              <h1 className="text-sm md:text-base font-black text-white mt-0.5 tracking-tight">{getPageTitle()}</h1>
            </div>
          </div>

          {/* Core Search input */}
          <div className="flex-1 max-w-md relative hidden md:block">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Sifariş, məhsul və ya müştəri axtar..."
              className="w-full bg-slate-950/80 border border-slate-800/80 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all"
            />
          </div>

          {/* Quick Actions, Notifications & Profiles */}
          <div className="flex items-center gap-4">
            
            {/* Live Store link */}
            <Link
              href={`/${locale}/`}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white text-[11px] font-bold rounded-lg transition-colors border border-slate-800"
            >
              <Compass className="h-3.5 w-3.5 text-amber-500" />
              <span>Mağaza</span>
            </Link>

            {/* Notifications Alert Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 bg-slate-950/80 border border-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-all relative cursor-pointer"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 bg-amber-500 w-2 h-2 rounded-full animate-pulse" />
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="fixed left-3 right-3 top-16 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-3 sm:w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden"
                    >
                      <div className="px-4.5 py-3.5 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                        <span className="text-xs font-black text-white uppercase tracking-wider">Bildirişlər ({unreadCount})</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-[10px] text-amber-500 hover:underline font-bold cursor-pointer"
                          >
                            Oxunmuş kimi qeyd et
                          </button>
                        )}
                      </div>

                      <div className="divide-y divide-slate-800/60 max-h-64 overflow-y-auto">
                        {notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className={`p-4 hover:bg-slate-850/50 transition-colors text-left space-y-1 ${
                              notif.unread ? 'bg-amber-500/[0.01]' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-200">{notif.title}</span>
                              <span className="text-[9px] text-slate-500">{notif.time}</span>
                            </div>
                            <p className="text-[10px] text-slate-400 leading-relaxed">{notif.desc}</p>
                          </div>
                        ))}
                      </div>

                      <div className="p-2 border-t border-slate-800 bg-slate-950/40 text-center">
                        <span className="text-[10px] text-slate-400">Son 24 saatlıq log yeniləmələri</span>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Quick Profile context info */}
            <div className="flex items-center gap-2.5 bg-slate-950/60 border border-slate-800/80 px-3.5 py-1.5 rounded-xl">
              <div className="w-6.5 h-6.5 rounded-lg bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-md">
                M
              </div>
              <div className="text-left hidden lg:block">
                <span className="text-[10px] font-black text-white block">Mirsəlim</span>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block mt-0.5">Süper Admin</span>
              </div>
            </div>

          </div>

        </header>

        {/* Info Banner if bypass mode is active */}
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-2.5 flex flex-col md:flex-row items-center justify-between gap-3 text-amber-200 text-xs">
          <div className="flex items-center gap-2">
            <Info className="h-4.5 w-4.5 text-amber-500 shrink-0" />
            <p className="font-medium leading-none">
              <strong>İnkişaf Rejimi (Dev Mode) Bypass fəaldır:</strong> İstənilən rol ilə tam admin idarəetmə panelini test edə bilərsiniz.
            </p>
          </div>
          <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-lg uppercase tracking-wider">
            Süper Yetki Bypass
          </span>
        </div>

        {/* Content Children wrapper */}
        <main className="flex-1 p-6 md:p-8 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            {children}
          </motion.div>
        </main>

        {/* Footer */}
        <footer className="py-5 px-8 border-t border-slate-800 bg-slate-900/20 text-center text-[10px] text-slate-500 flex justify-between items-center">
          <span>© 2026 rubikshop.az. Bütün hüquqlar qorunur.</span>
          <span className="font-mono text-slate-600">v3.5 Enterprise Server API</span>
        </footer>

      </div>

    </div>
  );
}
