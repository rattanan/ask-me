import { z } from "zod";
import { EMOJIS, NOTE_COLORS } from "@/lib/types";

export const sessionSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  description: z.string().trim().max(280).default(""),
  presenter: z.string().trim().max(80).default(""),
  date: z.string().trim().max(40).default(""),
  active: z.boolean().default(false),
  allowQuestions: z.boolean().default(true),
});

export const questionSchema = z.object({
  sessionId: z.string().trim().min(1),
  name: z.string().trim().max(30).optional().default(""),
  question: z.string().trim().min(1, "Question is required").max(200),
  emoji: z.enum(EMOJIS),
  color: z.enum(NOTE_COLORS),
});

export const questionPatchSchema = z.object({
  status: z.enum(["pending", "approved", "hidden", "pinned"]),
});
