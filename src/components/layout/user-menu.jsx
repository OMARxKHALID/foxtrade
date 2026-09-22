"use client";

import Link from "next/link";
import { Menu } from "@base-ui/react/menu";
import { ChevronDown, LayoutDashboard, LogOut, ShieldCheck, UserRound, Wallet } from "lucide-react";
import { hitArea } from "@/components/ui/gradient-button";
import { menuItemClass, menuPopupClass, menuSideOffset } from "@/components/ui/menu-styles";
import { useActionSubmit } from "@/hooks/use-action-submit";
import { cn } from "@/lib/utils";

export const UserMenu = ({ user, signOutAction }) => {
  const { pending, submit } = useActionSubmit({ action: signOutAction });

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/assets", label: "Assets", icon: Wallet },
    { href: "/account", label: "Account", icon: UserRound },
    ...(user.role === "admin" ? [{ href: "/admin", label: "Admin Panel", icon: ShieldCheck }] : []),
  ];

  const handleSignOut = () => submit();

  return (
    <Menu.Root>
      <Menu.Trigger aria-label="Account menu" className={cn(hitArea, "flex h-8 cursor-pointer items-center gap-2 rounded-lg text-sm text-white outline-none")}>
        <span className="flex size-8 items-center justify-center rounded-full border border-white/10 bg-white/5 font-heading text-xs font-semibold uppercase">{user.email.slice(0, 1)}</span>
        <span className="hidden max-w-40 truncate md:block">{user.email}</span>
        <ChevronDown className="hidden size-4 text-neutral-500 md:block" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner sideOffset={menuSideOffset} align="end" className="z-50 outline-none">
          <Menu.Popup className={cn("w-56", menuPopupClass)}>
            <div className="border-b border-white/10 px-2.5 pt-1.5 pb-2.5">
              <p className="truncate text-sm text-white">{user.email}</p>
              <p className="text-xs text-neutral-500">{user.role === "admin" ? "Admin" : "Client"}</p>
            </div>
            <div className="py-1">
              {links.map((link) => (
                <Menu.Item key={link.href} className={menuItemClass} render={<Link href={link.href} />}>
                  <link.icon className="size-4 text-neutral-500" />
                  {link.label}
                </Menu.Item>
              ))}
            </div>
            <div className="border-t border-white/10 pt-1">
              <Menu.Item className={menuItemClass} onClick={handleSignOut} disabled={pending}>
                <LogOut className="size-4 text-down" />
                {pending ? "Signing out…" : "Log Out"}
              </Menu.Item>
            </div>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
};
