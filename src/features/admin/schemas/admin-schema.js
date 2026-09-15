import Big from "big.js";
import { z } from "zod";
import { passwordSchema } from "@/features/auth/schemas/auth-schema";

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

export const pairSchema = z.object({
  base: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{2,15}$/, "Use the coin ticker, e.g. BTC"),
  name: z.string().trim().min(1, "Enter a name").max(40),
  color: z.string().regex(/^#[0-9a-f]{6}$/i, "Pick a color"),
  timedEnabled: z.boolean(),
  perpetualEnabled: z.boolean(),
  featured: z.boolean(),
  maxLeverage: z.coerce.number().int().min(1, "At least 1x").max(500, "At most 500x"),
});

export const pairSymbolSchema = z.string().regex(/^[A-Z0-9]{2,15}USDT$/, "Invalid pair");

const percent = (max) => z.coerce.number({ error: "Enter a number" }).min(0, "Cannot be negative").max(max, `At most ${max}%`);

export const platformSettingsSchema = z
  .object({
    siteName: z.string().trim().min(2, "At least 2 characters").max(40),
    tagline: z.string().trim().min(2, "At least 2 characters").max(120),
    description: z.string().trim().min(10, "At least 10 characters").max(300),
    supportEmail: z.email("Enter a valid email"),
    demoAmount: z.coerce.number({ error: "Enter an amount" }).min(0).max(1e9),
    convertSpreadPercent: percent(20),
    takerFeePercent: percent(10),
    maintenanceMarginPercent: percent(50),
    maxLeverage: z.coerce.number().int().min(1, "At least 1x").max(500, "At most 500x"),
    timedDurations: z
      .array(
        z.object({
          seconds: z.coerce.number().int().min(5, "At least 5 seconds").max(86400, "At most 1 day"),
          payoutPercent: z.coerce.number().min(1, "At least 1%").max(500, "At most 500%"),
          minAmount: z.coerce.number().min(1, "At least 1").max(1e9),
        }),
      )
      .min(1, "Add at least one duration")
      .max(10, "At most 10 durations"),
  })
  .refine((value) => new Set(value.timedDurations.map((item) => item.seconds)).size === value.timedDurations.length, {
    path: ["timedDurations"],
    message: "Each duration must be unique",
  });

export const documentsReviewSchema = z
  .object({
    id: objectIdSchema,
    decision: z.enum(["approved", "rejected"]),
    reason: z.string().trim().max(200).optional(),
  })
  .refine((value) => value.decision === "approved" || (value.reason?.length ?? 0) >= 3, { path: ["reason"], message: "Add a reason for rejection" });

export const clientProfileSchema = z.object({
  userId: objectIdSchema,
  name: z.string().trim().min(1, "Enter a name").max(60),
  email: z.email("Enter a valid email"),
});

export const clientPasswordSchema = z.object({
  userId: objectIdSchema,
  password: passwordSchema,
});

export const clientRoleSchema = z.object({
  userId: objectIdSchema,
  role: z.enum(["admin", "user"]),
});

export const balanceAdjustSchema = z.object({
  userId: objectIdSchema,
  wallet: z.enum(["spot", "timed", "perpetual"], { error: "Choose a wallet" }),
  asset: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{2,20}$/, "Choose an asset"),
  amount: z
    .union([z.string(), z.number()], { error: "Enter an amount" })
    .transform((value) => String(value).trim())
    .refine((value) => /^-?\d+(\.\d+)?$/.test(value) && !new Big(value).eq(0), "Enter an amount other than 0")
    .refine((value) => !/^-?\d+(\.\d+)?$/.test(value) || new Big(value).abs().lte(1e9), "Amount is too large"),
  note: z.string().trim().min(3, "Add a short reason").max(120),
});

export const contentSchema = z.object({
  key: z.string().regex(/^[a-z0-9-]{2,60}$/, "Unknown document"),
  title: z.string().trim().min(2, "Add a title").max(120),
  summary: z.string().trim().max(600).optional().default(""),
  sections: z
    .array(
      z.object({
        heading: z.string().trim().min(1, "Add a heading").max(200),
        body: z.string().trim().min(1, "Add some text").max(4000),
      }),
    )
    .min(1, "Keep at least one section")
    .max(30, "At most 30 sections"),
});

export const contentKeySchema = z.string().regex(/^[a-z0-9-]{2,60}$/, "Unknown document");
