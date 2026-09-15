import { z } from "zod";
import { passwordSchema } from "@/features/auth/schemas/auth-schema";

export const basicVerificationSchema = z.object({
  country: z.string().min(2, "Choose your country"),
  fullName: z.string().trim().min(3, "Enter your full legal name").max(80),
  idNumber: z.string().trim().min(5, "Enter your ID number").max(30),
  city: z.string().trim().min(2, "Enter your city").max(60),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((value) => value.newPassword === value.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match" });

export const withdrawalPinSchema = z
  .object({
    pin: z.string().regex(/^\d{6}$/, "PIN must be 6 digits"),
    confirmPin: z.string(),
  })
  .refine((value) => value.pin === value.confirmPin, { path: ["confirmPin"], message: "PINs do not match" });
