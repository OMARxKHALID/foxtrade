"use server";

import { z } from "zod";
import { formFailure, signInRequired, validationFailure } from "@/lib/action-result";
import { serverFailure } from "@/lib/server-result";
import { LIVE, PRACTICE } from "@/lib/ledger";
import { getCurrentUser } from "@/lib/session";
import { liveAvailableFor, setTradingMode } from "@/lib/trading-mode";

const modeSchema = z.object({ mode: z.enum([PRACTICE, LIVE]) });

const reasons = {
  disabled: "Live trading is not open yet.",
  unverified: "Get your identity details and documents approved before switching to a live account.",
  "signed-out": "Log in to switch accounts.",
};

export const switchTradingMode = async (input) => {
  const parsed = modeSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  const user = await getCurrentUser().catch(() => null);
  if (!user) return signInRequired("Log in to switch accounts.");
  try {
    if (parsed.data.mode === LIVE) {
      const { available, reason } = await liveAvailableFor(user);
      if (!available) return formFailure(reasons[reason] ?? "Live trading is not available for this account.");
    }
    const mode = await setTradingMode(user.id, parsed.data.mode);
    return { ok: true, data: { mode } };
  } catch (error) {
    return serverFailure(error);
  }
};
