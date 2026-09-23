import { headers } from "next/headers";
import { Laptop, Smartphone } from "lucide-react";
import { Container } from "@/components/ui/container";
import { CardBody, CardHeader, GlowCard } from "@/components/ui/glow-card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { getAuth } from "@/lib/auth";
import { hasPin } from "@/lib/pin";
import { getSession } from "@/lib/session";
import { ChangePasswordForm, SignOutOtherDevicesButton, WithdrawalPinForm } from "@/features/account/components/security-forms";
import { fullDateTime as dateFormat } from "@/lib/format";

export const metadata = {
  title: "Security",
};

export const instant = false;


const describeAgent = (agent = "") => {
  const mobile = /Mobile|Android|iPhone|iPad/i.test(agent);
  const browser = agent.match(/(Edg|Chrome|Firefox|Safari)\/[\d.]+/)?.[1]?.replace("Edg", "Edge") ?? "Browser";
  const os = agent.match(/Windows|Mac OS X|Android|iPhone|iPad|Linux/)?.[0]?.replace("Mac OS X", "macOS") ?? "Unknown OS";
  return { mobile, label: `${browser} on ${os}` };
};

const SecurityPage = async () => {
  const session = await getSession();
  const [sessions, pinSet] = session
    ? await Promise.all([getAuth().api.listSessions({ headers: await headers() }), hasPin(session.user.id)])
    : [[], false];

  return (
    <Container className="flex flex-col gap-4 lg:gap-6">
      <PageHeader title="Security Center" description="Keep your account protected." backHref="/account" />
      <div className="grid grid-cols-1 gap-4 lg:gap-6 xl:grid-cols-2">
        <GlowCard as="section" aria-labelledby="password-title">
          <CardHeader id="password-title" title="Login password" description="Changing your password signs out your other devices." />
          <CardBody>
            <ChangePasswordForm />
          </CardBody>
        </GlowCard>
        <GlowCard as="section" id="withdrawal-pin" aria-labelledby="pin-title" className="h-fit scroll-mt-24">
          <CardHeader
            id="pin-title"
            title="Withdrawal PIN"
            description="Required to confirm withdrawals."
            actions={<StatusBadge tone={pinSet ? "success" : "warning"}>{pinSet ? "Set" : "Not set"}</StatusBadge>}
          />
          <CardBody>
            <WithdrawalPinForm />
          </CardBody>
        </GlowCard>
      </div>
      <GlowCard as="section" aria-labelledby="sessions-title">
        <CardHeader id="sessions-title" title="Active sessions" description="Devices currently signed in to your account." actions={sessions.length > 1 ? <SignOutOtherDevicesButton count={sessions.length - 1} /> : null} />
        <CardBody>
          {sessions.length ? (
            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {sessions.map((item) => {
                const device = describeAgent(item.userAgent ?? "");
                const DeviceIcon = device.mobile ? Smartphone : Laptop;
                return (
                  <li key={item.id} className="flex items-center gap-3 rounded-xl border border-white/5 bg-field px-4 py-3">
                    <DeviceIcon className="size-5 shrink-0 text-neutral-400" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-white">{device.label}</span>
                      <span className="block text-xs text-neutral-500">Signed in {dateFormat.format(new Date(item.createdAt))}</span>
                    </span>
                    {item.id === session.session.id && <StatusBadge tone="brand">This device</StatusBadge>}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-neutral-500">Log in to see your active sessions.</p>
          )}
        </CardBody>
      </GlowCard>
    </Container>
  );
};

export default SecurityPage;
