"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Bell, Coins, FileText, History, IdCard, Image, LayoutDashboard, LifeBuoy, Settings, Users } from "lucide-react";
import { LogoMark } from "@/components/ui/logo-mark";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Clients", icon: Users },
  { href: "/admin/kyc", label: "KYC Review", icon: IdCard },
  { href: "/admin/pairs", label: "Pairs", icon: Coins },
  { href: "/admin/banners", label: "Banners", icon: Image },
  { href: "/admin/notices", label: "Notices", icon: Bell },
  { href: "/admin/tickets", label: "Tickets", icon: LifeBuoy },
  { href: "/admin/content", label: "Content", icon: FileText },
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/audit", label: "Audit Log", icon: History },
];

export const AdminSidebar = ({ email, signOut, mobileSignOut }) => {
  const pathname = usePathname();
  const isActive = (href) => (href === "/admin" ? pathname === href : pathname.startsWith(href));

  return (
    <aside className="flex flex-col border-b border-white/10 lg:sticky lg:top-0 lg:h-screen lg:border-r lg:border-b-0">
      <div className="flex items-center justify-between gap-3 px-5 py-4 lg:py-6">
        <span className="flex items-center gap-2.5">
          <LogoMark />
          <span className="font-heading text-sm font-semibold text-white">Admin</span>
        </span>
        <div className="flex items-center gap-2 lg:hidden">
          <Link href="/" className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/10 px-3 text-xs text-neutral-300">
            <ArrowLeft className="size-3.5" />
            Home
          </Link>
          {mobileSignOut}
        </div>
      </div>
      <nav aria-label="Admin">
        <ul className="scrollbar-none flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:pb-0">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm whitespace-nowrap",
                  isActive(link.href) ? "bg-white/5 text-brand" : "text-neutral-400",
                )}
              >
                <link.icon className="size-4" strokeWidth={1.75} />
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="mt-auto hidden border-t border-white/10 p-3 lg:block">
        <p className="truncate px-3 pb-2 text-xs text-neutral-500">{email}</p>
        <Link href="/" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-neutral-400">
          <ArrowLeft className="size-4" strokeWidth={1.75} />
          Back to Home
        </Link>
        <div className="px-3 pt-2">{signOut}</div>
      </div>
    </aside>
  );
};
