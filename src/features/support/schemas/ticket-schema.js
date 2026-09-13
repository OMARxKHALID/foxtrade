import { z } from "zod";

export const ticketCategories = ["Account", "Trading", "Assets", "Verification", "Bug report", "Other"];

export const ticketSchema = z.object({
  category: z.enum(ticketCategories, { error: "Choose a category" }),
  subject: z.string().trim().min(5, "Subject must be at least 5 characters").max(120),
  message: z.string().trim().min(20, "Describe the issue in at least 20 characters").max(4000),
});

export const ticketIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid ticket");

export const replySchema = z.object({
  id: ticketIdSchema,
  message: z.string().trim().min(2, "Write a message").max(4000),
});
