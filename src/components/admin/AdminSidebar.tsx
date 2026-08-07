'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  Tag,
  FolderOpen,
  Layers,
  Bookmark,
  ShoppingBag,
  Users,
  Boxes,
  Warehouse,
  Truck,
  CreditCard,
  RefreshCw,
  Megaphone,
  FileText,
  Globe,
  Star,
  HelpCircle,
  BarChart3,
  Sliders,
  Settings,
  ShieldAlert,
  Database,
  Activity,
  Key,
  Share2,
  FileCode,
  ArrowUpDown,
  History,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  LogOut,
  User,
  Sparkles,
  Clock,
  FileSpreadsheet
} from 'lucide-react';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  href?: string;
  subItems?: { label: string; href: string; icon?: React.ComponentType<any> }[];
}

interface AdminSidebarProps {
  locale: string;
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (val: boolean) => void;
}

export default function AdminSidebar({
  locale,
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen
}: AdminSidebarProps) {
  const pathname = usePathname();

  // Expanded parent categories state
  const [expandedSections, setExpandedSections] = React.useState<Record<string, boolean>>({
    catalog: true,
    sales: true,
    marketing: false,
    analytics: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const menuStructure: { category: string; key: string; items: SidebarItem[] }[] = [
    {
      category: 'Əsas',
      key: 'main',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: LayoutDashboard,
          href: `/${locale}/admin`
        }
      ]
    },
    {
      category: 'Məhsul Kataloqu',
      key: 'catalog',
      items: [
        {
          id: 'catalog-parent',
          label: 'Kataloq (Catalog)',
          icon: FolderOpen,
          subItems: [
            { label: 'Məhsullar', href: `/${locale}/admin/products`, icon: Tag },
            { label: 'Kateqoriyalar', href: `/${locale}/admin/categories`, icon: Layers },
            { label: 'Brendlər', href: `/${locale}/admin/brands`, icon: Bookmark },
            { label: 'Kolleksiyalar', href: `/${locale}/admin/collections`, icon: Sparkles },
            { label: 'Nis Xidmətlər (Quraşdırma)', href: `/${locale}/admin/services`, icon: FolderOpen }
          ]
        }
      ]
    },
    {
      category: 'Satış & Əməliyyat',
      key: 'sales',
      items: [
        {
          id: 'sales-parent',
          label: 'Satış & Əməliyyatlar',
          icon: ShoppingBag,
          subItems: [
            { label: 'Sifarişlər', href: `/${locale}/admin/orders`, icon: FileText },
            { label: 'Ön Sifarişlər', href: `/${locale}/admin/preorders`, icon: Clock },
            { label: 'Təchizatçı Hesabatı (Çin)', href: `/${locale}/admin/preorders/supplier-report`, icon: FileSpreadsheet },
            { label: 'Müştərilər', href: `/${locale}/admin/customers`, icon: Users },
            { label: 'İnventar', href: `/${locale}/admin/inventory`, icon: Boxes },
            { label: 'Anbarlar', href: `/${locale}/admin/warehouses`, icon: Warehouse },
            { label: 'Çatdırılma', href: `/${locale}/admin/settings/shipping`, icon: Truck },
            { label: 'Ödənişlər', href: `/${locale}/admin/settings/payments`, icon: CreditCard },
            { label: 'Qaytarılmalar (RMA)', href: `/${locale}/admin/returns`, icon: RefreshCw }
          ]
        }
      ]
    },
    {
      category: 'Marketinq & Məzmun',
      key: 'marketing',
      items: [
        {
          id: 'marketing-parent',
          label: 'Marketinq & Kontent',
          icon: Megaphone,
          subItems: [
            { label: 'Marketinq', href: `/${locale}/admin/marketing`, icon: Megaphone },
            { label: 'CMS Məzmun', href: `/${locale}/admin/cms`, icon: FileText },
            { label: 'SEO Ayarları', href: `/${locale}/admin/seo`, icon: Globe },
            { label: 'Rəylər', href: `/${locale}/admin/reviews`, icon: Star },
            { label: 'Dəstək (CRM)', href: `/${locale}/admin/support`, icon: HelpCircle }
          ]
        }
      ]
    },
    {
      category: 'Analitika & Sistem',
      key: 'analytics',
      items: [
        {
          id: 'analytics-parent',
          label: 'Analitika & Sistem',
          icon: BarChart3,
          subItems: [
            { label: 'Analitika', href: `/${locale}/admin/analytics`, icon: BarChart3 },
            { label: 'Hesabatlar', href: `/${locale}/admin/reports`, icon: FileText },
            { label: 'İstifadəçilər & Rollar', href: `/${locale}/admin/users`, icon: Users },
            { label: 'Sistem Ayarları', href: `/${locale}/admin/settings`, icon: Settings },
            { label: 'Integrasiyalar', href: `/${locale}/admin/integrations`, icon: Share2 },
            { label: 'Fayllar', href: `/${locale}/admin/files`, icon: FolderOpen },
            { label: 'Sistem & Audit Logları', href: `/${locale}/admin/system`, icon: History },
            { label: 'İdxal / İxrac', href: `/${locale}/admin/import-export`, icon: ArrowUpDown },
            { label: 'API / Tərtibatçı Alətləri', href: `/${locale}/admin/api-tools`, icon: FileCode }
          ]
        }
      ]
    }
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 border-r border-slate-800">
      
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex items-center justify-between">
        <Link href={`/${locale}/admin`} className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center font-black text-slate-900 shadow-lg shadow-amber-500/20 shrink-0">
            R
          </div>
          {!isCollapsed && (
            <div className="leading-none">
              <span className="font-black text-sm tracking-wider text-amber-400 block">RUBIKSHOP</span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Control Center</span>
            </div>
          )}
        </Link>

        {/* Collapse Toggle button desktop */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </button>

        {/* Close mobile menu */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
        >
          <X className="h-4.5 w-4.5" />
        </button>
      </div>

      {/* User Status Summary in Sidebar */}
      {!isCollapsed && (
        <div className="p-4 mx-4 my-4 bg-slate-950/50 border border-slate-800/80 rounded-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700 font-bold text-amber-500 text-xs shrink-0">
            A
          </div>
          <div className="overflow-hidden">
            <span className="text-[11px] font-black text-white block truncate">Mirsəlim Admin</span>
            <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1 uppercase tracking-wider mt-0.5">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              Süper Admin
            </span>
          </div>
        </div>
      )}

      {/* Navigation Menu */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-6 scrollbar-thin">
        {menuStructure.map((group) => {
          const isGroupExpanded = expandedSections[group.key];
          return (
            <div key={group.key} className="space-y-1.5">
              {/* Category label */}
              {!isCollapsed && (
                <span className="px-3 text-[9px] font-black uppercase tracking-widest text-slate-500 block">
                  {group.category}
                </span>
              )}

              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const hasSubItems = item.subItems && item.subItems.length > 0;
                  const isSectionActive = pathname.startsWith(`/${locale}/admin/${item.id}`) || 
                    (item.subItems?.some((sub) => pathname === sub.href));

                  if (!hasSubItems) {
                    const isSingleActive = pathname === item.href;
                    return (
                      <Link
                        key={item.id}
                        href={item.href || 'javascript:void(0)'}
                        onClick={(e) => {
                          if (!item.href) {
                            e.preventDefault();
                          }
                        }}
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                          isSingleActive
                            ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/10'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                        }`}
                      >
                        <Icon className="h-4.5 w-4.5 shrink-0" />
                        {!isCollapsed && <span>{item.label}</span>}
                      </Link>
                    );
                  }

                  // Collapsible nested items
                  return (
                    <div key={item.id} className="space-y-1">
                      <button
                        onClick={() => toggleSection(group.key)}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          isSectionActive
                            ? 'text-white bg-slate-800/40'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <Icon className="h-4.5 w-4.5 shrink-0" />
                          {!isCollapsed && <span>{item.label}</span>}
                        </span>
                        {!isCollapsed && (
                          isGroupExpanded ? <ChevronDown className="h-4 w-4 opacity-60" /> : <ChevronRight className="h-4 w-4 opacity-60" />
                        )}
                      </button>

                      {/* Sub-items block */}
                      {isGroupExpanded && !isCollapsed && (
                        <div className="pl-6.5 space-y-1 border-l border-slate-800/80 ml-5.5">
                          {item.subItems?.map((sub) => {
                            const SubIcon = sub.icon || DotIcon;
                            const isSubActive = pathname === sub.href;
                            return (
                              <Link
                                key={sub.label}
                                href={sub.href}
                                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[11px] font-bold transition-colors ${
                                  isSubActive
                                    ? 'text-amber-400 font-black'
                                    : 'text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                <SubIcon className="h-3.5 w-3.5 shrink-0 opacity-80" />
                                <span>{sub.label}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-slate-800 space-y-2">
        <Link
          href={`/${locale}/`}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-850 transition-all"
        >
          <Globe className="h-4 w-4 shrink-0" />
          {!isCollapsed && <span>Mağazaya Keç</span>}
        </Link>
        <Link
          href={`/${locale}/login`}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!isCollapsed && <span>Çıxış Et</span>}
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 80 : 280 }}
        className="hidden lg:block fixed inset-y-0 left-0 z-40 bg-slate-900 border-r border-slate-800"
      >
        {sidebarContent}
      </motion.aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 z-40 bg-black lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
            className="fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 lg:hidden"
          >
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

function DotIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
