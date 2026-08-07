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
      const ref = typeof document !== 'undefined' ? (document.referrer?.toLowerCase() || '') : '';

      let source = 'direct';
      if (utmSource.includes('instagram') || ref.includes('instagram.com') || ref.includes('ig.me')) {
        source = 'instagram';
      } else if (utmSource.includes('google') || ref.includes('google.com') || ref.includes('google.az')) {
        source = 'google_seo';
      } else if (utmSource.includes('ref') || utmSource.includes('referral') || (ref && !ref.includes(window.location.hostname))) {
        source = 'referral';
      } else if (utmSource) {
        source = utmSource;
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
