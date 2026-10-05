import { z } from "zod";
import { assistantResponseSchema } from "../schemas/assistant-response.schema";

const assistantMessageSchema = z.string().trim().min(1).max(2_000);
const DEFAULT_ASSISTANT_API_URL = "https://barakaagent.space-z.ai/api/assistant";
const DEFAULT_TIMEOUT_MS = 15_000;
const BALE_SAFE_REPLY_LENGTH = 3_800;

export class AssistantClientError extends Error {
  constructor(
    message: string,
    readonly code: "INVALID_MESSAGE" | "INVALID_CONFIGURATION" | "TIMEOUT" | "NETWORK_ERROR" | "HTTP_ERROR" | "INVALID_RESPONSE",
  ) {
    super(message);
    this.name = "AssistantClientError";
  }
}

type AskAssistantOptions = {
  endpoint?: string;
  timeoutMs?: number;
  fetcher?: typeof fetch;
};

function resolveEndpoint(value?: string): string {
  const raw = value?.trim() || process.env.ASSISTANT_API_URL?.trim() || DEFAULT_ASSISTANT_API_URL;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") throw new Error("HTTPS is required");
    return url.toString();
  } catch {
    throw new AssistantClientError("نشانی سرویس دستیار معتبر نیست.", "INVALID_CONFIGURATION");
  }
}

function limitReplyForBale(reply: string): string {
  if (reply.length <= BALE_SAFE_REPLY_LENGTH) return reply;
  return `${reply.slice(0, BALE_SAFE_REPLY_LENGTH - 38).trimEnd()}\n\n… پاسخ برای نمایش در بله کوتاه شد.`;
}

export async function askBarakaAssistant(message: string, options: AskAssistantOptions = {}): Promise<string> {
  const parsedMessage = assistantMessageSchema.safeParse(message);
  if (!parsedMessage.success) {
    throw new AssistantClientError("پیام سرویس دستیار باید بین ۱ تا ۲۰۰۰ کاراکتر باشد.", "INVALID_MESSAGE");
  }

  const endpoint = resolveEndpoint(options.endpoint);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  try {
    const response = await (options.fetcher ?? fetch)(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: parsedMessage.data }),
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new AssistantClientError(`سرویس دستیار با وضعیت ${response.status} پاسخ داد.`, "HTTP_ERROR");
    }
    const parsedResponse = assistantResponseSchema.safeParse(await response.json().catch(() => null));
    if (!parsedResponse.success || !parsedResponse.data.ok) {
      throw new AssistantClientError("پاسخ سرویس دستیار معتبر نبود.", "INVALID_RESPONSE");
    }
    return limitReplyForBale(parsedResponse.data.reply);
  } catch (error) {
    if (error instanceof AssistantClientError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new AssistantClientError("مهلت پاسخ‌گویی سرویس دستیار پایان یافت.", "TIMEOUT");
    }
    throw new AssistantClientError("ارتباط با سرویس دستیار برقرار نشد.", "NETWORK_ERROR");
  } finally {
    clearTimeout(timeout);
  }
}
