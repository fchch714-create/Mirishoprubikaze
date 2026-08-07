import { redirect } from 'next/navigation';

export default function AdminSettingsIndexPage({ params }: { params: { locale: string } }) {
  const locale = params?.locale || 'az';
  redirect(`/${locale}/admin/settings/general`);
}
