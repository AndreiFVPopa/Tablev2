import { describe, expect, it } from "vitest";

import { toUrlSlug } from "./to-url-slug";

describe("toUrlSlug", () => {
  it("strips Romanian diacritics", () => {
    expect(toUrlSlug("bursă")).toBe("bursa");
    expect(toUrlSlug("Brașov")).toBe("brasov");
    expect(toUrlSlug("Știință")).toBe("stiinta");
  });

  it("normalizes spaces, punctuation, and case", () => {
    expect(toUrlSlug("Hello World!")).toBe("hello-world");
    expect(toUrlSlug("  A--B__C  ")).toBe("a-b-c");
  });

  it("returns empty when nothing alphanumeric remains", () => {
    expect(toUrlSlug("!!!")).toBe("");
    expect(toUrlSlug("   ")).toBe("");
  });
});
