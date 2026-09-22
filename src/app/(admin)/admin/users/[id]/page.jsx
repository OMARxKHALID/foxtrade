import Link from "next/link";
import { notFound } from "next/navigation";
import { getEnv } from "@/lib/env";
import { requireAdmin } from "@/lib/session";
import { CardBody, CardHeader, GlowCard } from "@/components/ui/glow-card";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { walletLabels } from "@/lib/ledger-labels";
import { formatQuantity } from "@/lib/format";
import { documentStatus, kycStatus, ticketStatus } from "@/lib/status";
import { toRecordRow } from "@/features/assets/components/record-rows";
import { getClientDetail } from "@/features/admin/dal/admin-dal";
import { ClientAccessPanel, ClientBalanceForm, ClientPasswordForm, ClientProfileForm } from "@/features/admin/components/client-detail-panels";
import { SideText, Status, dateTime, pairLabel, positionStatus, timedStatus } from "@/features/trading/components/trade-format";

export const metadata = {
  title: "Client",
};

export const instant = false;

const recordColumns = [
  { key: "time", header: "Time", sortable: true },
  { key: "type", header: "Type" },
  { key: "asset", header: "Asset", hideBelow: "sm" },
  { key: "wallet", header: "Wallet", hideBelow: "lg" },
  { key: "amount", header: "Amount", align: "right", sortable: true },
  { key: "balance", header: "Balance After", align: "right", hideBelow: "md" },
];

const ListCard = ({ id, title, actions, empty, children }) => (
  <GlowCard as="section" aria-labelledby={id} className="overflow-hidden">
    <CardHeader id={id} title={title} actions={actions} />
    {children ?? <EmptyState title={empty} className="py-8" />}
  </GlowCard>
);

const Row = ({ children }) => <li className="flex items-center justify-between gap-3 px-4 py-3 text-sm sm:px-6">{children}</li>;

const ClientPage = async ({ params }) => {
  const { id } = await params;
  const [admin, detail] = await Promise.all([requireAdmin(), getClientDetail(id)]);
  if (!detail) notFound();
  const { user, balances, trading, records, tickets, verification, sessions } = detail;
  const isSelf = admin.id === user.id;
  const isConfiguredAdmin = user.email === getEnv().ADMIN_EMAIL?.toLowerCase();
  const openCount = trading.openPositions.length + trading.openTimed.length;

  return (
    <>
      <PageHeader title={user.email} description={`${user.name || "No name"} · joined ${dateTime.format(new Date(user.createdAt))}`} backHref="/admin/users" />
      <div className="flex flex-wrap gap-2">
        <StatusBadge tone={user.role === "admin" ? "brand" : "neutral"}>{user.role === "admin" ? "Admin" : "Client"}</StatusBadge>
        <StatusBadge tone={user.banned ? "danger" : "success"}>{user.banned ? "Banned" : "Active"}</StatusBadge>
        {user.forceWin && <StatusBadge tone="warning">Force win</StatusBadge>}
        <StatusBadge tone={user.emailVerified ? "success" : "neutral"}>{user.emailVerified ? "Email verified" : "Email not verified"}</StatusBadge>
        <StatusBadge tone={kycStatus[verification?.status ?? "none"].tone}>KYC: {kycStatus[verification?.status ?? "none"].label}</StatusBadge>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:gap-6 xl:grid-cols-3">
        <GlowCard as="section" aria-labelledby="profile-title">
          <CardHeader id="profile-title" title="Profile" description="Changing the email also updates their tickets and KYC record." />
          <CardBody>
            <ClientProfileForm user={user} />
          </CardBody>
        </GlowCard>
        <GlowCard as="section" aria-labelledby="password-title">
          <CardHeader id="password-title" title="Set new password" description={isSelf ? undefined : "All their sessions are signed out."} />
          <CardBody>
            {isSelf ? (
              <p className="text-sm leading-6 text-neutral-400">
                This is your account. Change your password from{" "}
                <Link href="/account/security" className="text-brand">
                  Security
                </Link>{" "}
                with your current password.
              </p>
            ) : (
              <ClientPasswordForm userId={user.id} />
            )}
          </CardBody>
        </GlowCard>
        <GlowCard as="section" aria-labelledby="access-title">
          <CardHeader id="access-title" title="Access" />
          <CardBody>
            <ClientAccessPanel user={user} isSelf={isSelf} isConfiguredAdmin={isConfiguredAdmin} openCount={trading.openPositions.filter((item) => item.status === "open").length} sessionCount={sessions.length} />
          </CardBody>
        </GlowCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:gap-6 xl:grid-cols-2">
        <ListCard id="balances-title" title="Balances" empty="All wallets are empty">
          {balances.length ? (
            <ul className="divide-y divide-white/5">
              {balances.map((item) => (
                <Row key={`${item.wallet}-${item.asset}`}>
                  <span className="text-neutral-300">{walletLabels[item.wallet] ?? item.wallet}</span>
                  <span className="text-white tabular-nums">
                    {formatQuantity(item.balance)} {item.asset}
                  </span>
                </Row>
              ))}
            </ul>
          ) : null}
        </ListCard>
        <GlowCard as="section" aria-labelledby="adjust-title">
          <CardHeader id="adjust-title" title="Credit or debit" description="Use a negative amount to debit. Every change is recorded in their ledger and the audit log." />
          <CardBody>
            <ClientBalanceForm userId={user.id} />
          </CardBody>
        </GlowCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:gap-6 xl:grid-cols-2">
        <ListCard id="open-trades-title" title={`Open trades (${openCount})`} empty="No open trades">
          {openCount ? (
            <ul className="divide-y divide-white/5">
              {trading.openPositions.map((item) => (
                <Row key={item.id}>
                  <span>
                    <span className="block text-white">{pairLabel(item.symbol)}</span>
                    <span className="block text-xs text-neutral-500">
                      <SideText value={item.side} /> {item.leverage}x · margin {formatQuantity(item.margin)} USDT
                    </span>
                  </span>
                  <Status map={positionStatus} value={item.status} />
                </Row>
              ))}
              {trading.openTimed.map((item) => (
                <Row key={item.id}>
                  <span>
                    <span className="block text-white">{pairLabel(item.symbol)}</span>
                    <span className="block text-xs text-neutral-500">
                      <SideText value={item.direction} /> {item.duration}s · stake {formatQuantity(item.amount)} USDT
                    </span>
                  </span>
                  <Status map={timedStatus} value={item.status} />
                </Row>
              ))}
            </ul>
          ) : null}
        </ListCard>
        <ListCard id="kyc-title" title="Identity verification" actions={<Link href="/admin/kyc" className="text-xs text-brand">Review in KYC</Link>} empty="Not submitted">
          {verification ? (
            <CardBody>
              <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                {[
                  ["Full name", verification.fullName],
                  ["Country", verification.country],
                  ["City", verification.city],
                  ["ID number", verification.idNumber],
                  ["Status", kycStatus[verification.status].label],
                  ["Documents", documentStatus[verification.documentsStatus].label],
                  ["Reason", verification.reason ?? "—"],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs text-neutral-500">{label}</dt>
                    <dd className="mt-1 text-white">{value}</dd>
                  </div>
                ))}
              </dl>
            </CardBody>
          ) : null}
        </ListCard>
      </div>

      <DataTable
        title="Ledger (latest 100)"
        titleId="client-ledger-title"
        searchPlaceholder="Search ledger"
        columns={recordColumns}
        rows={records.map(toRecordRow)}
        initialSort={{ key: "time", direction: "desc" }}
        emptyState={<EmptyState title="No ledger entries" />}
      />

      <div className="grid grid-cols-1 gap-4 lg:gap-6 xl:grid-cols-2">
        <ListCard id="tickets-title" title={`Support tickets (${tickets.length})`} empty="No tickets">
          {tickets.length ? (
            <ul className="divide-y divide-white/5">
              {tickets.map((ticket) => (
                <li key={ticket.id}>
                  <Link href={`/admin/tickets/${ticket.id}`} className="flex items-center justify-between gap-3 px-4 py-3 text-sm sm:px-6">
                    <span className="min-w-0 truncate text-white">{ticket.subject}</span>
                    <StatusBadge tone={ticketStatus[ticket.status].tone}>{ticketStatus[ticket.status].label}</StatusBadge>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </ListCard>
        <ListCard id="sessions-title" title={`Active sessions (${sessions.length})`} empty="No active sessions">
          {sessions.length ? (
            <ul className="divide-y divide-white/5">
              {sessions.map((session) => (
                <Row key={session.id}>
                  <span className="min-w-0">
                    <span className="block truncate text-white">{session.userAgent || "Unknown device"}</span>
                    <span className="block text-xs text-neutral-500">
                      {session.ipAddress || "Unknown IP"} · since {dateTime.format(new Date(session.createdAt))}
                    </span>
                  </span>
                </Row>
              ))}
            </ul>
          ) : null}
        </ListCard>
      </div>
    </>
  );
};

export default ClientPage;
