import { Bell, BookUser, LayoutDashboard, Download, Globe, CircleQuestionMark, Headset, Info, IdCard, KeyRound, ReceiptText, Settings, ShieldCheck, UserPlus, UserRound, Wallet } from "lucide-react";
import { Container } from "@/components/ui/container";
import { CardHeader, GlowCard } from "@/components/ui/glow-card";
import { GradientButton } from "@/components/ui/gradient-button";
import { MenuRow } from "@/components/ui/menu-row";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { collections } from "@/lib/mongo";
import { getCurrentUser, isAdmin } from "@/lib/session";
import { SignOutButton } from "@/features/auth/components/sign-out-button";

export const metadata = {
  title: "Account",
};

export const instant = false;

const verificationLabels = { none: "Unverified", pending: "Under review", approved: "Verified", rejected: "Rejected" };

const buildGroups = (verification) => [
  {
    title: "Profile",
    rows: [
      { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", description: "Balances, open trades and activity" },
      { href: "/account/verification", icon: IdCard, label: "Identity Verification", description: "Basic and advanced verification", value: verificationLabels[verification] },
      { href: "/assets/records", icon: ReceiptText, label: "Transaction History", description: "Every balance change" },
      { href: "/assets", icon: Wallet, label: "Assets", description: "Wallets and holdings" },
      { href: "/account/share", icon: UserPlus, label: "Invite Friends", description: "Share your invite link" },
    ],
  },
  {
    title: "Security",
    rows: [
      { href: "/account/security", icon: ShieldCheck, label: "Security Center", description: "Password, withdrawal PIN, sessions" },
      { href: "/account/security#withdrawal-pin", icon: KeyRound, label: "Withdrawal PIN", description: "Required for withdrawals" },
      { href: "/assets/withdraw/addresses", icon: BookUser, label: "Withdrawal Addresses", description: "Bind and manage addresses" },
    ],
  },
  {
    title: "Preferences & Support",
    rows: [
      { href: "/account/settings", icon: Settings, label: "Settings", description: "Currency and app preferences" },
      { href: "/account/language", icon: Globe, label: "Language", value: "English" },
      { href: "/notices", icon: Bell, label: "Notices" },
      { href: "/help", icon: CircleQuestionMark, label: "Help Center" },
      { href: "/support", icon: Headset, label: "Customer Support" },
      { href: "/download", icon: Download, label: "Download App" },
      { href: "/about", icon: Info, label: "About Us" },
    ],
  },
];

const AccountPage = async () => {
  const user = await getCurrentUser();
  const verification = user ? (await collections.verifications().findOne({ userId: user.id }))?.status ?? "none" : "none";
  const joined = user ? new Intl.DateTimeFormat("en", { month: "short", year: "numeric" }).format(new Date(user.createdAt)) : null;

  return (
    <Container className="flex flex-col gap-4 lg:gap-6">
      <PageHeader title="Account" />
      <div className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-6">
        <GlowCard variant="warm" className="h-fit p-4 sm:p-6">
          <div className="flex items-center gap-4">
            <span className="flex size-14 items-center justify-center rounded-full border border-white/10 bg-white/5">
              <UserRound className="size-6 text-neutral-300" />
            </span>
            <div>
              <p className="max-w-[14rem] truncate font-heading text-lg font-semibold text-white">{user ? user.email : "Guest"}</p>
              {user ? <StatusBadge tone={isAdmin(user) ? "brand" : "neutral"}>{isAdmin(user) ? "Admin" : "Client"}</StatusBadge> : <StatusBadge>Not signed in</StatusBadge>}
            </div>
          </div>
          {user ? (
            <>
              <p className="mt-5 text-sm leading-6 text-neutral-400">Member since {joined}. Demo balances and trades are private to your account.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                {isAdmin(user) && (
                  <GradientButton href="/admin" size="sm">
                    Admin Panel
                  </GradientButton>
                )}
                <SignOutButton />
              </div>
            </>
          ) : (
            <>
              <p className="mt-5 text-sm leading-6 text-neutral-400">Create an account to get demo funds, place trades and track your performance.</p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <GradientButton href="/login" variant="dark" size="sm">
                  Login
                </GradientButton>
                <GradientButton href="/register" size="sm">
                  Register
                </GradientButton>
              </div>
            </>
          )}
        </GlowCard>
        <div className="flex flex-col gap-4 lg:gap-6">
          {buildGroups(verification).map((group) => (
            <GlowCard key={group.title} as="section" aria-labelledby={`account-${group.title}`}>
              <CardHeader id={`account-${group.title}`} title={group.title} />
              <div className="p-2">
                {group.rows.map((row) => (
                  <MenuRow key={row.label} {...row} />
                ))}
              </div>
            </GlowCard>
          ))}
        </div>
      </div>
    </Container>
  );
};

export default AccountPage;
