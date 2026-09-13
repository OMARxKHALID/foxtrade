import { z } from "zod";

const password = z
  .string()
  .min(8, "Use at least 8 characters")
  .regex(/[A-Z]/, "Add an uppercase letter")
  .regex(/\d/, "Add a number");

const safeNext = z
  .string()
  .optional()
  .transform((value) => (/^\/(?![\/\\])[^\\\s\x00-\x1f]*$/.test(value ?? "") ? value : "/"));

export const loginSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
  remember: z.boolean().optional(),
  next: safeNext,
});

export const registerSchema = z
  .object({
    email: z.email("Enter a valid email"),
    password,
    confirmPassword: z.string(),
    terms: z.literal(true, { error: "Accept the terms to continue" }),
  })
  .refine((value) => value.password === value.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match" });

export const emailSchema = z.object({
  email: z.email("Enter a valid email"),
});

export const resetPasswordSchema = z
  .object({
    email: z.email("Enter a valid email"),
    code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
    password,
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match" });
