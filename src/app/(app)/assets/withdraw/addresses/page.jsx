import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/ui/page-header";
import { AddressBook } from "@/features/assets/components/address-book";
import { loadAssetsPage } from "@/features/assets/dal/assets-dal";

export const metadata = {
  title: "Withdrawal Addresses",
};

const AddressesPage = async () => {
  const { signedIn, addresses } = await loadAssetsPage({ addresses: true });

  return (
    <Container className="flex flex-col gap-4 lg:gap-6">
      <PageHeader title="Withdrawal Addresses" description="Bind and manage the wallet addresses you withdraw to." backHref="/assets/withdraw" />
      <AddressBook addresses={addresses} signedIn={signedIn} />
    </Container>
  );
};

export default AddressesPage;
