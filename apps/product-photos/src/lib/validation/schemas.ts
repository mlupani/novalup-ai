import { z } from "zod";
import { isFormatId, isStyleId, isBackgroundId } from "@/lib/ai/options";
import { MAX_PHOTOS } from "@/lib/limits";

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

// The sender's email is taken from the authenticated session in the API route,
// never from the client — so the form only carries the free-text comment.
export const feedbackSchema = z.object({
  message: z.string().trim().min(1).max(2000),
});

export const photoOptionSchema = z.object({
  format: z.string().refine(isFormatId, "invalid_format"),
  style: z.string().refine(isStyleId, "invalid_style"),
  background: z.string().refine(isBackgroundId, "invalid_background"),
});

export const batchInputSchema = z.object({
  photos: z.array(photoOptionSchema).min(1).max(MAX_PHOTOS),
  instructions: z.string().trim().max(1000).optional(),
});

export type FeedbackInput = z.infer<typeof feedbackSchema>;
export type PhotoOption = z.infer<typeof photoOptionSchema>;
export type BatchInput = z.infer<typeof batchInputSchema>;
