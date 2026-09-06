import { z } from "zod";
import { isFormatId, isStyleId, isBackgroundId } from "@/lib/ai/options";

export const signupSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    email: z.string().trim().email(),
    password: z.string().min(8).max(200),
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "passwords_do_not_match",
  });

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export const generationInputSchema = z.object({
  format: z.string().refine(isFormatId, "invalid_format"),
  style: z.string().refine(isStyleId, "invalid_style"),
  background: z.string().refine(isBackgroundId, "invalid_background"),
  instructions: z.string().trim().max(1000).optional(),
});

export const feedbackSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email(),
  thoughts: z.string().trim().min(1).max(2000),
  nextIdeas: z.string().trim().min(1).max(2000),
});

export type GenerationInput = z.infer<typeof generationInputSchema>;
export type FeedbackInput = z.infer<typeof feedbackSchema>;
