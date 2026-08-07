"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Settings, Globe, Truck, CreditCard, Bell, Shield } from 'lucide-react';

const MENU_ITEMS = [
  { href: '/admin/settings/general', label: 'Ümumi Tənzimləmələr', icon: Settings },
  { href: '/admin/settings/localization', label: 'Dil və Valyuta', icon: Globe },
  { href: '/admin/settings/shipping', label: 'Çatdırılma & Vergi', icon: Truck },
  { href: '/admin/settings/payments', label: 'Ödəniş & Checkout', icon: CreditCard },
  { href: '/admin/settings/notifications', label: 'Bildirişlər', icon: Bell },
];

export default function SettingsSidebar() {
  const pathname = usePathname();

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-soft-md">
      <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4 px-4">Tənzimləmələr Menyu</h3>
      <nav className="space-y-1">
        {MENU_ITEMS.map((item) => {
          const isActive = pathname.includes(item.href);
          const Icon = item.icon;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                isActive 
                  ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
