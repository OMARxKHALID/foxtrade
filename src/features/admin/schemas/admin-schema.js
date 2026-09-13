import { z } from "zod";

export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

export const banSchema = z.object({
  userId: objectIdSchema,
  reason: z.string().trim().min(3, "Add a short reason").max(200),
});

export const reviewSchema = z
  .object({
    id: objectIdSchema,
    decision: z.enum(["approved", "rejected"]),
    reason: z.string().trim().max(200).optional(),
  })
  .refine((value) => value.decision === "approved" || (value.reason?.length ?? 0) >= 3, { path: ["reason"], message: "Add a reason for rejection" });

export const noticeCategories = ["Announcement", "Product", "Security", "Maintenance", "Promotion"];

export const noticeSchema = z.object({
  id: objectIdSchema.optional(),
  title: z.string().trim().min(5, "Title needs at least 5 characters").max(120),
  category: z.enum(noticeCategories, { error: "Choose a category" }),
  summary: z.string().trim().min(10, "Summary needs at least 10 characters").max(200),
  body: z.string().trim().min(20, "Write at least 20 characters").max(10000),
  published: z.boolean(),
});

const internalLink = z
  .string()
  .trim()
  .regex(/^\/(?![\/\\])[^\s\\]*$/, "Use an internal link that starts with /");

export const bannerSchema = z.object({
  id: objectIdSchema.optional(),
  eyebrow: z.string().trim().min(2, "Add a short label").max(30),
  title: z.string().trim().min(5, "Title needs at least 5 characters").max(60),
  text: z.string().trim().min(10, "Add a short description").max(140),
  ctaLabel: z.string().trim().min(2, "Add a button label").max(24),
  ctaHref: internalLink,
  active: z.boolean(),
  order: z.coerce.number().int().min(0).max(99),
});

export const ticketReplySchema = z.object({
  id: objectIdSchema,
  message: z.string().trim().min(2, "Write a reply").max(4000),
});

export const ticketStatusSchema = z.object({
  id: objectIdSchema,
  status: z.enum(["open", "closed"]),
});

export const pairSettingSchema = z.object({
  symbol: z.string().regex(/^[A-Z0-9]{5,20}$/, "Invalid pair"),
  timedEnabled: z.boolean(),
  perpetualEnabled: z.boolean(),
  maxLeverage: z.coerce.number().int().min(1, "At least 1x").max(100, "At most 100x"),
});
