import Link from "next/link";
import { Activity, CandlestickChart, Coins, IdCard, LifeBuoy, UserPlus, Users } from "lucide-react";
import { CardBody, CardHeader, GlowCard } from "@/components/ui/glow-card";
import { IconTile } from "@/components/ui/icon-tile";
import { MenuRow } from "@/components/ui/menu-row";
import { PageHeader } from "@/components/ui/page-header";
import { getDashboardStats } from "@/features/admin/dal/admin-dal";

export const metadata = {
  title: "Overview",
};

export const instant = false;

const dateFormat = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

const AdminOverviewPage = async () => {
  const stats = await getDashboardStats();
  const cards = [
    { label: "Total clients", value: stats.clients, icon: Users, href: "/admin/users" },
    { label: "New this week", value: stats.newClients, icon: UserPlus, href: "/admin/users" },
    { label: "Active sessions", value: stats.activeSessions, icon: Activity },
    { label: "Trades (24h)", value: stats.tradesToday, icon: CandlestickChart },
    { label: "Pending KYC", value: stats.pendingKyc, icon: IdCard, href: "/admin/kyc" },
    { label: "Open tickets", value: stats.openTickets, icon: LifeBuoy, href: "/admin/tickets" },
  ];

  return (
    <>
      <PageHeader title="Overview" description="Live overview of clients, trading activity and work waiting for you." />
      <ul className="grid grid-cols-2 gap-4 lg:gap-6 xl:grid-cols-3 2xl:grid-cols-6">
        {cards.map((card) => {
          const content = (
            <GlowCard className="flex h-full flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4 sm:p-5">
              <IconTile icon={card.icon} size="md" />
              <div>
                <p className="text-xs text-neutral-500">{card.label}</p>
                <p className="mt-1 font-heading text-2xl font-bold text-white tabular-nums">{card.value.toLocaleString("en")}</p>
              </div>
            </GlowCard>
          );
          return <li key={card.label}>{card.href ? <Link href={card.href} className="block h-full">{content}</Link> : content}</li>;
        })}
      </ul>
      <div className="grid grid-cols-1 gap-4 lg:gap-6 xl:grid-cols-2">
        <GlowCard as="section" aria-labelledby="recent-clients">
          <CardHeader id="recent-clients" title="Newest clients" actions={<Link href="/admin/users" className="text-xs text-brand">View all</Link>} />
          <CardBody>
            {stats.recentClients.length ? (
              <ul className="flex flex-col divide-y divide-white/5">
                {stats.recentClients.map((client) => (
                  <li key={client.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <span className="truncate text-sm text-white">{client.email}</span>
                    <span className="shrink-0 text-xs text-neutral-500">{dateFormat.format(new Date(client.createdAt))}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-neutral-500">No clients have registered yet.</p>
            )}
          </CardBody>
        </GlowCard>
        <GlowCard as="section" aria-labelledby="recent-audit">
          <CardHeader id="recent-audit" title="Recent admin activity" actions={<Link href="/admin/audit" className="text-xs text-brand">Audit log</Link>} />
          <CardBody>
            {stats.recentAudit.length ? (
              <ul className="flex flex-col divide-y divide-white/5">
                {stats.recentAudit.map((entry) => (
                  <li key={entry.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <span className="min-w-0">
                      <span className="block font-mono text-xs text-brand">{entry.action}</span>
                      <span className="block truncate text-sm text-white">{entry.target}</span>
                    </span>
                    <span className="shrink-0 text-xs text-neutral-500">{dateFormat.format(new Date(entry.createdAt))}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-neutral-500">Nothing yet. Actions you take appear here.</p>
            )}
          </CardBody>
        </GlowCard>
      </div>
      <GlowCard as="section" aria-labelledby="quick-links">
        <CardHeader id="quick-links" title="Quick links" />
        <div className="p-2">
          <MenuRow href="/admin/kyc" icon={IdCard} label="Review verifications" description="Approve or reject identity submissions" value={stats.pendingKyc ? `${stats.pendingKyc} pending` : undefined} />
          <MenuRow href="/admin/tickets" icon={LifeBuoy} label="Answer support tickets" description="Reply to clients waiting for help" value={stats.openTickets ? `${stats.openTickets} open` : undefined} />
          <MenuRow href="/admin/pairs" icon={Coins} label="Manage trading pairs" description="Pause pairs and cap leverage" />
        </div>
      </GlowCard>
    </>
  );
};

export default AdminOverviewPage;
