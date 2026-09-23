import { z } from "zod";

export const validationFailure = (error) => ({
  ok: false,
  fieldErrors: z.flattenError(error).fieldErrors,
});

export const formFailure = (message) => ({ ok: false, formError: message });

export const signInRequired = (message = "Log in to continue.") => formFailure(message);

export const applyFieldErrors = (result, setError) => {
  Object.entries(result.fieldErrors ?? {}).forEach(([name, messages]) => {
    if (messages?.[0]) setError(name, { message: messages[0] });
  });
};
