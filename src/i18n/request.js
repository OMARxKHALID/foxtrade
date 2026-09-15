import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { loadMessages, resolveLocale } from "@/i18n/messages";

export default getRequestConfig(async () => {
  const locale = resolveLocale((await cookies()).get("NEXT_LOCALE")?.value);
  return { locale, messages: await loadMessages(locale) };
});
