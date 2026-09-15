"use server";

import { formFailure, validationFailure } from "@/lib/action-result";
import { deleteBanner, deleteNotice, saveBanner, saveNotice } from "@/lib/content-store";
import { pairBySymbol } from "@/lib/market/pairs";
import { savePairSetting } from "@/lib/pair-settings";
import { asAdmin, writeAudit } from "@/features/admin/dal/admin-dal";
import { bannerSchema, noticeSchema, objectIdSchema, pairSettingSchema } from "@/features/admin/schemas/admin-schema";

export const upsertNotice = async (input) => {
  const parsed = noticeSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  return asAdmin(async (admin) => {
    const notice = await saveNotice(parsed.data);
    if (!notice) return formFailure("Notice not found.");
    await writeAudit(admin, parsed.data.id ? "notice.update" : "notice.create", notice.title, notice.published ? "Published" : "Draft");
  });
};

export const removeNotice = async (id) => {
  const parsed = objectIdSchema.safeParse(id);
  if (!parsed.success) return formFailure("Invalid notice.");
  return asAdmin(async (admin) => {
    const deleted = await deleteNotice(parsed.data);
    if (!deleted) return formFailure("Notice not found.");
    await writeAudit(admin, "notice.delete", deleted.title);
  });
};

export const upsertBanner = async (input) => {
  const parsed = bannerSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  return asAdmin(async (admin) => {
    const banner = await saveBanner(parsed.data);
    if (!banner) return formFailure("Banner not found.");
    await writeAudit(admin, parsed.data.id ? "banner.update" : "banner.create", banner.title, banner.active ? "Active" : "Hidden");
  });
};

export const removeBanner = async (id) => {
  const parsed = objectIdSchema.safeParse(id);
  if (!parsed.success) return formFailure("Invalid banner.");
  return asAdmin(async (admin) => {
    const deleted = await deleteBanner(parsed.data);
    if (!deleted) return formFailure("Banner not found.");
    await writeAudit(admin, "banner.delete", deleted.title);
  });
};

export const updatePairSetting = async (input) => {
  const parsed = pairSettingSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed.error);
  if (!pairBySymbol[parsed.data.symbol]) return formFailure("Unknown pair.");
  return asAdmin(async (admin) => {
    const { symbol, ...setting } = parsed.data;
    await savePairSetting(symbol, setting);
    await writeAudit(admin, "pair.update", symbol, `Futures ${setting.timedEnabled ? "on" : "off"}, Option ${setting.perpetualEnabled ? "on" : "off"}, max ${setting.maxLeverage}x`);
  });
};
