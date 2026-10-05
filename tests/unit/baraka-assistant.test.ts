import { afterEach, describe, expect, it, vi } from "vitest";
import { askBarakaAssistant } from "@/features/assistant/server/baraka-assistant.client";

describe("Baraka assistant client", () => {
  afterEach(() => vi.restoreAllMocks());

  it("sends the Bale text using the documented API contract", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      ok: true,
      reply: "سلام! من دستیار هوشمند هستم.",
      model: "glm-4-plus",
      usedRag: true,
      sources: [],
    }), { status: 200 }));

    const reply = await askBarakaAssistant("سلام! خودت را معرفی کن", {
      endpoint: "https://assistant.test/api/assistant",
      fetcher,
    });

    expect(reply).toBe("سلام! من دستیار هوشمند هستم.");
    expect(fetcher).toHaveBeenCalledWith(
      "https://assistant.test/api/assistant",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ message: "سلام! خودت را معرفی کن" }),
      }),
    );
  });

  it("rejects non-HTTPS endpoints", async () => {
    await expect(askBarakaAssistant("سلام", { endpoint: "http://assistant.test/api" }))
      .rejects.toMatchObject({ code: "INVALID_CONFIGURATION" });
  });

  it("rejects invalid service responses", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    await expect(askBarakaAssistant("سلام", {
      endpoint: "https://assistant.test/api/assistant",
      fetcher,
    })).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
  });

  it("keeps replies below Bale's safe message size", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true, reply: "ف".repeat(5_000) }), { status: 200 }));
    const reply = await askBarakaAssistant("سلام", {
      endpoint: "https://assistant.test/api/assistant",
      fetcher,
    });
    expect(reply.length).toBeLessThanOrEqual(3_800);
    expect(reply).toContain("کوتاه شد");
  });
});
