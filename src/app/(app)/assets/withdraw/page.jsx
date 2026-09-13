import { BookUser, Info, ReceiptText } from "lucide-react";
import { Container } from "@/components/ui/container";
import { CardBody, CardHeader, GlowCard } from "@/components/ui/glow-card";
import { GradientButton } from "@/components/ui/gradient-button";
import { PageHeader } from "@/components/ui/page-header";
import { WithdrawForm } from "@/features/assets/components/withdraw-form";
import { loadAssetsPage } from "@/features/assets/dal/assets-dal";

export const metadata = {
  title: "Withdraw",
};

export const instant = false;

const notes = [
  "Demo balances have no monetary value and are never sent to external wallets.",
  "The withdrawal flow mirrors a live exchange so you can practice address and network checks.",
  "Always double-check the network. Sending to the wrong network loses funds on real exchanges.",
];

const WithdrawPage = async () => {
  const { overview, addresses } = await loadAssetsPage({ addresses: true });

  return (
    <Container className="flex flex-col gap-4 lg:gap-6">
      <PageHeader
        title="Withdraw"
        description="Send assets to an external wallet address."
        backHref="/assets"
        actions={
          <>
            <GradientButton href="/assets/records" variant="dark" size="sm">
              <ReceiptText className="size-4" />
              Records
            </GradientButton>
            <GradientButton href="/assets/withdraw/addresses" variant="dark" size="sm">
              <BookUser className="size-4" />
              Address Book
            </GradientButton>
          </>
        }
      />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-6">
        <GlowCard as="section" aria-labelledby="withdraw-title">
          <CardHeader id="withdraw-title" title="Withdrawal details" />
          <CardBody>
            <WithdrawForm holdings={overview?.holdings} addresses={addresses} />
          </CardBody>
        </GlowCard>
        <GlowCard as="section" aria-labelledby="notes-title" className="h-fit">
          <CardHeader
            id="notes-title"
            title={
              <span className="flex items-center gap-2">
                <Info className="size-4 text-brand" />
                Important
              </span>
            }
          />
          <CardBody>
            <ul className="flex flex-col gap-3">
              {notes.map((note) => (
                <li key={note} className="text-sm leading-6 text-neutral-400">
                  {note}
                </li>
              ))}
            </ul>
          </CardBody>
        </GlowCard>
      </div>
    </Container>
  );
};

export default WithdrawPage;
