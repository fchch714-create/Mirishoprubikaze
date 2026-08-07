import { redirect } from 'next/navigation';

export default function AdminDeveloperAliasPage({ params }: { params: { locale: string } }) {
  const locale = params?.locale || 'az';
  redirect(`/${locale}/admin/api-tools`);
}
