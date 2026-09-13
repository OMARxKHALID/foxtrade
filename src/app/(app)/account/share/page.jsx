import { BookOpen } from "lucide-react";
import { Container } from "@/components/ui/container";
import { GradientButton } from "@/components/ui/gradient-button";
import { PageHeader } from "@/components/ui/page-header";
import { ShareCard } from "@/features/account/components/share-card";

export const metadata = {
  title: "Invite Friends",
};

const SharePage = () => (
  <Container className="flex flex-col gap-4 lg:gap-6">
    <PageHeader title="Invite Friends" description="Bring friends to practice trading together."
      backHref="/account"
      actions={
        <GradientButton href="/account/share/rules" variant="dark" size="sm">
          <BookOpen className="size-4" />
          Invite Rules
        </GradientButton>
      }
    />
    <ShareCard />
  </Container>
);

export default SharePage;
