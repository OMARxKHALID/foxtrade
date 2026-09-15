import Big from "big.js";
import { z } from "zod";
import { networks, wallets } from "@/features/assets/data/assets-config";

const walletValues = wallets.map((wallet) => wallet.value);
const assetField = z.string({ error: "Choose an asset" }).regex(/^[A-Z0-9]{2,20}$/, "Choose an asset");

const isDecimal = (value) => /^\d+(\.\d{1,8})?$/.test(value);

const positiveAmount = z
  .union([z.string(), z.number()], { error: "Enter an amount" })
  .transform((value) => String(value).trim())
  .refine((value) => isDecimal(value) && new Big(value).gt(0), "Enter an amount greater than 0 with at most 8 decimals")
  .refine((value) => !isDecimal(value) || new Big(value).lte(1e12), "Amount is too large");

export const withdrawSchema = z.object({
  asset: assetField,
  network: z.enum(networks, { error: "Choose a network" }),
  address: z.string().trim().min(26, "Enter a valid wallet address").max(64, "Enter a valid wallet address"),
  amount: positiveAmount,
  pin: z.string().regex(/^\d{6}$/, "Withdrawal PIN is 6 digits"),
});

export const convertSchema = z
  .object({
    from: assetField,
    to: assetField,
    amount: positiveAmount,
  })
  .refine((value) => value.from !== value.to, { path: ["to"], message: "Choose a different asset" });

export const transferSchema = z
  .object({
    from: z.enum(walletValues),
    to: z.enum(walletValues),
    asset: assetField,
    amount: positiveAmount,
  })
  .refine((value) => value.from !== value.to, { path: ["to"], message: "Choose a different wallet" });

export const addressSchema = z.object({
  label: z.string().trim().min(1, "Enter a label").max(32, "Keep the label under 32 characters"),
  asset: assetField,
  network: z.enum(networks, { error: "Choose a network" }),
  address: z.string().trim().min(26, "Enter a valid wallet address").max(64, "Enter a valid wallet address"),
});
