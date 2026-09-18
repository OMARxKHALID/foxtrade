"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Headset, ShieldCheck, UserRound } from "lucide-react";
import { Container } from "@/components/ui/container";
import { GradientButton, focusRing, hitArea } from "@/components/ui/gradient-button";
import { LogoMark } from "@/components/ui/logo-mark";
import { appNavLinks } from "@/components/layout/nav-links";
import { UserMenu } from "@/components/layout/user-menu";
import { usePlatform } from "@/hooks/use-platform";
import { cn } from "@/lib/utils";

export const AppNavbar = ({ user, signOutAction }) => {
  const pathname = usePathname();
  const { siteName } = usePlatform().settings;

  return (
    <header className="sticky top-0 z-40 pt-3 lg:pt-5">
      <Container>
        <nav
          aria-label="Main"
          className="flex h-12 items-center justify-between rounded-xl border border-white/10 bg-panel/85 pr-3 pl-4 backdrop-blur-md md:pr-4 md:pl-5"
        >
          <div className="flex items-center gap-10">
            <Link href="/" className={cn("flex items-center gap-2.5 rounded-lg", focusRing)} aria-label={`${siteName} home`}>
              <LogoMark />
              <span className="font-heading text-sm font-semibold text-white">{siteName}</span>
            </Link>
            <ul className="hidden items-center gap-6 lg:flex">
              {appNavLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    aria-current={link.match(pathname) ? "page" : undefined}
                    className={cn(
                      "rounded text-sm transition-colors hover:text-neutral-300",
                      focusRing,
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
            <Link href="/support" aria-label="Customer support" className={cn(hitArea, "flex size-8 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/5", focusRing)}>
              <Headset className="size-[18px]" />
            </Link>
            {user?.role === "admin" && (
              <GradientButton href="/admin" variant="outline" size="xs" className="hidden text-sm font-medium sm:inline-flex">
                <ShieldCheck className="size-4" />
                Admin
              </GradientButton>
            )}
            {user ? (
              <UserMenu user={user} signOutAction={signOutAction} />
            ) : (
              <>
                <Link href="/account" aria-label="Account" className={cn(hitArea, "flex size-8 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/5 sm:hidden", focusRing)}>
                  <UserRound className="size-[18px]" />
                </Link>
                <GradientButton href="/login" variant="ghost" size="xs" className="hidden text-sm font-medium sm:inline-flex">
                  Log In
                </GradientButton>
                <GradientButton href="/register" variant="light" size="xs" className="hidden px-4 text-sm font-medium sm:inline-flex">
                  Sign Up
                </GradientButton>
              </>
            )}
          </div>
        </nav>
      </Container>
    </header>
  );
};
