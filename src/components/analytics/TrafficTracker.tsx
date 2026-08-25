'use client';

import { useEffect } from 'react';
import { recordTrafficVisit } from '@/lib/actions/admin';

export default function TrafficTracker() {
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;

      // Skip admin paths
      if (window.location.pathname.includes('/admin')) return;

      const tracked = sessionStorage.getItem('rubik_traffic_tracked');
      if (tracked) return;

      const urlParams = new URLSearchParams(window.location.search);
      const utmSource = urlParams.get('utm_source')?.toLowerCase() || '';
      
      let refHost = '';
      if (typeof document !== 'undefined' && document.referrer) {
        try {
          refHost = new URL(document.referrer).hostname.toLowerCase();
        } catch {
          refHost = '';
        }
      }

      let source = 'direct';
      if (
        utmSource === 'instagram' ||
        refHost === 'instagram.com' ||
        refHost.endsWith('.instagram.com') ||
        refHost === 'ig.me' ||
        refHost.endsWith('.ig.me')
      ) {
        source = 'instagram';
      } else if (
        utmSource === 'google' ||
        refHost === 'google.com' ||
        refHost.endsWith('.google.com') ||
        refHost === 'google.az' ||
        refHost.endsWith('.google.az')
      ) {
        source = 'google_seo';
      } else if (utmSource.includes('ref') || utmSource.includes('referral') || (refHost && refHost !== window.location.hostname)) {
        source = 'referral';
      } else if (utmSource) {
        source = utmSource.replace(/[^a-z0-9_-]/g, '').slice(0, 50) || 'direct';
      }

      sessionStorage.setItem('rubik_traffic_tracked', 'true');
      sessionStorage.setItem('rubik_traffic_source', source);

      recordTrafficVisit(source, false);
    } catch {
      // Ignore client analytics errors
    }
  }, []);

  return null;
}
