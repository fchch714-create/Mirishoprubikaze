import { getDictionary } from '@/i18n/dictionaries';
import dynamic from 'next/dynamic';

// Load the client auth gate component safely without server-side cookie race conditions
const RequireAuthClient = dynamic(() => import('@/components/auth/RequireAuthClient'), { ssr: false });

interface AccountPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function AccountPage({ params }: AccountPageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  // Render the client-side authentication gate
  return <RequireAuthClient dict={dict} locale={locale} />;
}
