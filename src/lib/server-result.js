import "server-only";
import { formFailure } from "@/lib/action-result";
import { reportError } from "@/lib/error-log";

// Third party libraries phrase failures for developers, not for clients. Prose
// is safe to pass through; codes, JSON fragments and URLs are not.
const readableMessage = (message) => /[a-z]/.test(message) && /\s/.test(message) && message.length <= 160 && !/[{}<>]|https?:\/\//.test(message);

export const serverFailure = (error, context = {}) => {
  const message = (error?.body?.message ?? error?.message ?? "").trim();
  if (message.startsWith("Invalid environment configuration")) return formFailure("The server is not configured yet. Add the keys from .env.example to .env.local.");
  // Expected, already worded for the client, and not worth recording.
  if (error?.name === "LedgerError") return formFailure(message);
  if (error?.body?.message && readableMessage(message)) return formFailure(message);
  void reportError(error, context);
  return formFailure("Something went wrong. Please try again.");
};
