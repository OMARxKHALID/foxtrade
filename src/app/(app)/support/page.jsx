import { Clock, Mail, MessagesSquare } from "lucide-react";
import { Container } from "@/components/ui/container";
import { CardBody, CardHeader, GlowCard } from "@/components/ui/glow-card";
import { IconTile } from "@/components/ui/icon-tile";
import { PageHeader } from "@/components/ui/page-header";
import { SignInPrompt } from "@/components/ui/sign-in-prompt";
import { getCurrentUser } from "@/lib/session";
import { listUserTickets } from "@/lib/ticket-store";
import { TicketList } from "@/features/support/components/ticket-list";
import { TicketForm } from "@/features/support/components/ticket-form";

export const metadata = {
  title: "Support",
};

export const instant = false;

const channels = [
  { icon: MessagesSquare, title: "Support tickets", text: "Replies inside your account, usually within a few hours." },
  { icon: Mail, title: "Email", text: "support@foxtrade.app" },
  { icon: Clock, title: "Hours", text: "Every day, 08:00 – 22:00 UTC" },
];

const SupportPage = async () => {
  const user = await getCurrentUser();
  const tickets = user ? await listUserTickets(user.id) : null;

  return (
    <Container className="flex flex-col gap-4 lg:gap-6">
      <PageHeader title="Customer Support" description="Tell us what you need help with and our team will get back to you." />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-6">
        <GlowCard as="section" aria-labelledby="new-ticket">
          <CardHeader id="new-ticket" title="New ticket" />
          <CardBody>
            <TicketForm />
          </CardBody>
        </GlowCard>
        <div className="flex flex-col gap-4 lg:gap-6">
          <GlowCard as="section" aria-labelledby="channels-title">
            <CardHeader id="channels-title" title="Contact channels" />
            <CardBody>
              <ul className="flex flex-col gap-5">
                {channels.map((channel) => (
                  <li key={channel.title} className="flex items-start gap-4">
                    <IconTile icon={channel.icon} />
                    <div className="min-w-0">
                      <p className="text-sm text-white">{channel.title}</p>
                      <p className="mt-1 text-xs text-neutral-400">{channel.text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardBody>
          </GlowCard>
          <GlowCard as="section" aria-labelledby="tickets-title">
            <CardHeader id="tickets-title" title="Your tickets" />
            {tickets ? <TicketList tickets={tickets} /> : <SignInPrompt title="Log in to see your tickets" />}
          </GlowCard>
        </div>
      </div>
    </Container>
  );
};

export default SupportPage;
