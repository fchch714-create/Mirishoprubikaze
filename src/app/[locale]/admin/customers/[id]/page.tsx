import CustomerProfileClient from '@/components/admin/customers/CustomerProfileClient';

export default function AdminCustomerProfilePage({ params }: { params: { id: string } }) {
  return <CustomerProfileClient customerId={params.id} />;
}
