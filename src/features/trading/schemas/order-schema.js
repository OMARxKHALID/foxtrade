import { z } from "zod";
import { perpetualRules, timedDurations } from "@/lib/market/trading-rules";

export const timedOrderSchema = z
  .object({
    symbol: z.string().min(1),
    direction: z.enum(["call", "put"]),
    duration: z.coerce.number().refine((value) => timedDurations.some((item) => item.seconds === value), "Choose a duration"),
    amount: z.coerce.number({ error: "Enter an amount" }).positive("Enter an amount"),
  })
  .refine(
    (order) => order.amount >= (timedDurations.find((item) => item.seconds === order.duration)?.minAmount ?? 0),
    { path: ["amount"], message: "Amount is below the minimum for this duration" },
  );

export const perpetualOrderSchema = z
  .object({
    symbol: z.string().min(1),
    side: z.enum(["long", "short"]),
    type: z.enum(["market", "limit"]),
    price: z.coerce.number().optional(),
    amount: z.coerce.number({ error: "Enter a margin amount" }).min(5, "Minimum margin is 5 USDT"),
    leverage: z.coerce.number().int().min(1).max(perpetualRules.maxLeverage),
    takeProfit: z.coerce.number().nonnegative().optional(),
    stopLoss: z.coerce.number().nonnegative().optional(),
  })
  .refine((order) => order.type === "market" || (order.price ?? 0) > 0, {
    path: ["price"],
    message: "Enter a limit price",
  });

export const positionIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid position");

export const addMarginSchema = z.object({
  id: positionIdSchema,
  amount: z.coerce.number({ error: "Enter an amount" }).positive("Enter an amount greater than 0").max(1e9),
});
