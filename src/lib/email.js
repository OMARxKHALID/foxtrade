import { Resend } from "resend";
import { getEnv } from "@/lib/env";
import { readPlatformSettings } from "@/lib/platform-settings";

export const sendEmail = async ({ to, subject, text }) => {
  const { RESEND_API_KEY, EMAIL_FROM } = getEnv();
  if (!RESEND_API_KEY) {
    console.info(`[email] to=${to} subject="${subject}"\n${text}`);
    return;
  }
  const resend = new Resend(RESEND_API_KEY);
  const { siteName } = await readPlatformSettings();
  const { error } = await resend.emails.send({ from: EMAIL_FROM ?? `${siteName} <onboarding@resend.dev>`, to, subject, text });
  if (error) throw new Error(error.message);
};
