"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Headset, ShieldCheck, UserRound } from "lucide-react";
import { Container } from "@/components/ui/container";
import { LogoMark } from "@/components/ui/logo-mark";
import { appNavLinks } from "@/components/layout/nav-links";
import { UserMenu } from "@/components/layout/user-menu";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

export const AppNavbar = ({ user, signOutAction }) => {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 pt-3 lg:pt-5">
      <Container>
        <nav
          aria-label="Main"
          className="flex h-12 items-center justify-between rounded-xl border border-white/10 bg-panel/85 pr-3 pl-4 backdrop-blur-md md:pr-4 md:pl-5"
        >
          <div className="flex items-center gap-10">
            <Link href="/" className="flex items-center gap-2.5" aria-label={`${site.name} home`}>
              <LogoMark />
              <span className="font-heading text-sm font-semibold text-white">{site.name}</span>
            </Link>
            <ul className="hidden items-center gap-6 lg:flex">
              {appNavLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    aria-current={link.match(pathname) ? "page" : undefined}
                    className={cn(
                      "text-sm transition-colors hover:text-neutral-300",
                      link.match(pathname) ? "text-brand" : "text-white",
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link href="/support" aria-label="Customer support" className="flex size-8 items-center justify-center rounded-md text-white hover:text-neutral-300">
              <Headset className="size-[18px]" />
            </Link>
            {user?.role === "admin" && (
              <Link href="/admin" className="hidden h-8 items-center gap-1.5 rounded-lg border border-brand/40 px-3 text-sm text-brand sm:flex">
                <ShieldCheck className="size-4" />
                Admin
              </Link>
            )}
            {user ? (
              <UserMenu user={user} signOutAction={signOutAction} />
            ) : (
              <>
                <Link href="/account" aria-label="Account" className="flex size-8 items-center justify-center rounded-md text-white sm:hidden">
                  <UserRound className="size-[18px]" />
                </Link>
                <Link href="/login" className="hidden h-8 items-center rounded-lg px-3 text-sm text-white sm:flex">
                  Login
                </Link>
                <Link href="/register" className="hidden h-8 items-center rounded-lg bg-white px-4 text-sm font-medium text-neutral-900 sm:flex">
                  Register
                </Link>
              </>
            )}
          </div>
        </nav>
      </Container>
    </header>
  );
};
