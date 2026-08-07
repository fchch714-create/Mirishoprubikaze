'use client';

import * as React from 'react';
import Link from 'next/link';
import { Package } from 'lucide-react';
import type { ApplicationDictionary } from '@/types/application.types';

interface FooterProps {
  dict: ApplicationDictionary;
  locale: string;
}

export function Footer({ dict, locale }: FooterProps) {
  const [phone, setPhone] = React.useState('+994 50 668 49 25');
  const [email, setEmail] = React.useState('info@rubikshop.az');
  const [address, setAddress] = React.useState('Bakı, Azərbaycan');

  React.useEffect(() => {
    async function loadFooterSettings() {
      try {
        const { getSettings } = await import('@/lib/actions/settings');
        const res = await getSettings('general');
        if (res.success && res.data) {
          if (res.data.contactPhone && !res.data.contactPhone.includes('000 00') && res.data.contactPhone !== '+994 50 000 00 00') {
            setPhone(res.data.contactPhone);
          }
          if (res.data.contactEmail) setEmail(res.data.contactEmail);
          if (res.data.address) setAddress(res.data.address);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadFooterSettings();
  }, []);

  return (
    <footer className="bg-[#FFFFFF] text-[#6B7280] py-12 border-t border-[#E5E7EB] mt-auto">
      <div className="max-w-screen-2xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <Link href={`/${locale}`} className="inline-flex items-center gap-2 mb-4 group">
              <div className="w-8 h-8 rounded-lg bg-[#D8232A] text-white flex items-center justify-center font-black text-sm shadow-sm group-hover:scale-105 transition-transform">
                <Package className="w-5 h-5" />
              </div>
              <span className="font-sans font-black text-[#D8232A] text-xl tracking-tight">
                RubikShop<span className="text-[#17181C] text-sm font-bold ml-0.5">.az</span>
              </span>
            </Link>
            <p className="text-sm text-[#6B7280] max-w-xs">
              {dict.footer?.bio_desc || "Premium speedcubing products and accessories. Designed for professional cubers."}
            </p>
          </div>
          <div>
            <h4 className="text-[#17181C] font-semibold mb-4">{dict.footer?.useful_links || "Məlumat / Info"}</h4>
            <ul className="space-y-2 text-sm text-[#6B7280]">
              <li><Link href={`/${locale}`} className="hover:text-[#D8232A] transition-colors">{dict.navigation.home}</Link></li>
              <li><Link href={`/${locale}/admin`} className="hover:text-[#D8232A] transition-colors">{dict.navigation.admin}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[#17181C] font-semibold mb-4">{dict.footer?.contact_us || "Əlaqə / Contact"}</h4>
            <ul className="space-y-2 text-sm text-[#6B7280]">
              <li>{address}</li>
              <li>{email}</li>
              <li><a href={`tel:${phone}`} className="hover:text-[#D8232A] transition-colors">{phone}</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-[#E5E7EB] pt-8 flex flex-col md:flex-row items-center justify-between text-sm text-[#6B7280]">
          <p>© {new Date().getFullYear()} RubikShop.az. {dict.footer?.all_rights_reserved || "Bütün hüquqlar qorunur."}</p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <span className="hover:text-[#D8232A] cursor-pointer transition-colors">Instagram</span>
            <span className="hover:text-[#D8232A] cursor-pointer transition-colors">WhatsApp</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
