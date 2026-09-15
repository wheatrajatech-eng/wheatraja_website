import { AdminCustomerProfile } from "@/components/admin-customer-profile";

export default async function Page({ params }: { params: Promise<{ phone: string }> }) {
  const { phone } = await params;
  return <AdminCustomerProfile phone={phone} />;
}
