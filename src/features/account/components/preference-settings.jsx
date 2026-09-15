"use client";

import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { FlagIcon } from "@/components/icons/flag-icon";
import { locales } from "@/lib/content/locales";
import { cn } from "@/lib/utils";
import { usePreferencesStore } from "@/store/use-preferences-store";

export const LanguageList = () => {
  const locale = usePreferencesStore((state) => state.locale);
  const setLocale = usePreferencesStore((state) => state.setLocale);
  const router = useRouter();

  const handleLocaleChange = (code) => {
    setLocale(code);
    router.refresh();
  };

  return (
    <ul role="radiogroup" aria-label="Language" className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {locales.map((item) => {
        const active = item.code === locale;
        return (
          <li key={item.code}>
            <button
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => handleLocaleChange(item.code)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left",
                active ? "border-brand/50 bg-brand/5" : "border-white/5 bg-field",
              )}
            >
              <FlagIcon code={item.flag} className="size-7" />
              <span className="flex-1">
                <span className="block text-sm text-white">{item.native}</span>
                <span className="block text-xs text-neutral-500">{item.label}</span>
              </span>
              {active && <Check className="size-4 text-brand" />}
            </button>
          </li>
        );
      })}
    </ul>
  );
};
