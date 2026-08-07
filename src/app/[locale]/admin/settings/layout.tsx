import React from 'react';
import SettingsSidebar from '@/components/admin/settings/SettingsSidebar';

export default function AdminSettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col lg:flex-row gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="w-full lg:w-64 shrink-0">
        <SettingsSidebar />
      </div>
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
}
