import { Resend } from "resend";
import { getEnv } from "@/lib/env";
import { site } from "@/lib/site";

export const sendEmail = async ({ to, subject, text }) => {
  const { RESEND_API_KEY, EMAIL_FROM } = getEnv();
  if (!RESEND_API_KEY) {
    console.info(`[email] to=${to} subject="${subject}"\n${text}`);
    return;
  }
  const resend = new Resend(RESEND_API_KEY);
  const { error } = await resend.emails.send({ from: EMAIL_FROM ?? `${site.name} <onboarding@resend.dev>`, to, subject, text });
  if (error) throw new Error(error.message);
};
