import { PageHeader } from "@/components/ui/page-header";
import { ClientsTable } from "@/features/admin/components/clients-table";
import { listClients } from "@/features/admin/dal/admin-dal";

export const metadata = {
  title: "Clients",
};

const UsersPage = async () => {
  const clients = await listClients();

  return (
    <>
      <PageHeader title="Clients" description="Every registered client. Ban abusive accounts or reset a demo balance." />
      <ClientsTable clients={clients} />
    </>
  );
};

export default UsersPage;
