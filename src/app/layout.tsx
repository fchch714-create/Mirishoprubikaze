import './globals.css';
import GoogleAnalytics from '@/components/analytics/GoogleAnalytics';

export const dynamic = 'force-dynamic';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="az">
      <body>
        <GoogleAnalytics gaId="G-9W0ZP3GHS6" />
        {children}
      </body>
    </html>
  );
}
