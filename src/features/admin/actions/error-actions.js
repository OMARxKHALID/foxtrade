"use server";

import { clearErrors } from "@/lib/error-log";
import { asAdmin, writeAudit } from "@/features/admin/dal/admin-dal";

export const clearErrorLog = async () =>
  asAdmin(async (admin) => {
    const removed = await clearErrors();
    await writeAudit(admin, "errors.clear", `${removed} error(s)`);
  });
