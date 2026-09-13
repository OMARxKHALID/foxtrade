import { z } from "zod";

export const validationFailure = (error) => ({
  ok: false,
  fieldErrors: z.flattenError(error).fieldErrors,
});

export const formFailure = (message) => ({ ok: false, formError: message });

export const signInRequired = (message = "Sign in to continue.") => formFailure(message);

export const serverFailure = (error) => {
  const message = error?.body?.message ?? error?.message ?? "";
  if (message.startsWith("Invalid environment configuration")) return formFailure("The server is not configured yet. Add the keys from .env.example to .env.local.");
  if (error?.name === "LedgerError" || error?.body?.message) return formFailure(message);
  console.error(error);
  return formFailure("Something went wrong. Please try again.");
};

export const applyFieldErrors = (result, setError) => {
  Object.entries(result.fieldErrors ?? {}).forEach(([name, messages]) => {
    if (messages?.[0]) setError(name, { message: messages[0] });
  });
};
