import { z } from "zod";

export const assistantResponseSchema = z.object({
  ok: z.boolean(),
  reply: z.string().trim().min(1).max(12_000),
  model: z.string().max(120).optional(),
  usedRag: z.boolean().optional(),
  sources: z.array(z.object({
    fileName: z.string().max(500).optional(),
    matches: z.number().int().nonnegative().optional(),
  }).passthrough()).max(100).optional(),
}).passthrough();

export type AssistantResponse = z.infer<typeof assistantResponseSchema>;
