import { afterEach, describe, expect, it, vi } from "vitest";

import { getJson, HttpError, resetJsonGetter, setJsonGetter } from "./http";

afterEach(() => {
  resetJsonGetter();
  vi.unstubAllGlobals();
});

describe("getJson", () => {
  it("returns parsed JSON for ok responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ok: true }),
      }),
    );
    await expect(getJson("/api/x")).resolves.toEqual({ ok: true });
  });

  it("throws HttpError for non-ok responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        statusText: "Unavailable",
      }),
    );
    await expect(getJson("/api/x")).rejects.toBeInstanceOf(HttpError);
    await expect(getJson("/api/x")).rejects.toMatchObject({
      status: 503,
      url: "/api/x",
    });
  });

  it("allows overriding the getter for tests", async () => {
    setJsonGetter(() => Promise.resolve({ injected: true }));
    await expect(getJson("/ignored")).resolves.toEqual({ injected: true });
  });
});
