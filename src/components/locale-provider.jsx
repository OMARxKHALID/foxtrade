"use client";

import { useEffect, useState } from "react";
import { NextIntlClientProvider } from "next-intl";
import { defaultLocale, defaultMessages, loadMessages, resolveLocale } from "@/i18n/messages";
import { usePreferencesStore } from "@/store/use-preferences-store";

export const LocaleProvider = ({ children }) => {
  const locale = resolveLocale(usePreferencesStore((state) => state.locale));
  const [loaded, setLoaded] = useState({ locale: defaultLocale, messages: defaultMessages });

  useEffect(() => {
    if (locale === loaded.locale) return;
    let active = true;
    loadMessages(locale).then((messages) => {
      if (active) setLoaded({ locale, messages });
    });
    return () => {
      active = false;
    };
  }, [locale, loaded.locale]);

  return (
    <NextIntlClientProvider locale={loaded.locale} messages={loaded.messages}>
      {children}
    </NextIntlClientProvider>
  );
};
