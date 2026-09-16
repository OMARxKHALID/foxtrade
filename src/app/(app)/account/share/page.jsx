import { BookOpen } from "lucide-react";
import { Container } from "@/components/ui/container";
import { GradientButton } from "@/components/ui/gradient-button";
import { PageHeader } from "@/components/ui/page-header";
import { getInvite, listInvited } from "@/lib/referrals";
import { absoluteUrl } from "@/lib/site-url";
import { requireUser } from "@/lib/session";
import { ShareCard } from "@/features/account/components/share-card";

export const metadata = {
  title: "Invite Friends",
};

const SharePage = async () => {
  const user = await requireUser("/account/share");
  const invite = await getInvite(user.id, user.email);
  const invited = await listInvited(user.id);

  return (
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
      <ShareCard inviteUrl={absoluteUrl(`/register?ref=${invite.code}`)} inviteCode={invite.code} invited={invited} />
    </Container>
  );
};

export default SharePage;
