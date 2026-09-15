import { PageHeader } from "@/components/ui/page-header";
import { ClientsTable } from "@/features/admin/components/clients-table";
import { listClients } from "@/features/admin/dal/admin-dal";

export const metadata = {
  title: "Clients",
};

export const instant = false;

const UsersPage = async () => {
  const clients = await listClients();

  return (
    <>
      <PageHeader title="Clients" description="Every registered account. Open one to edit its profile, password, role, balances or access." />
      <ClientsTable clients={clients} />
    </>
  );
};

export default UsersPage;
