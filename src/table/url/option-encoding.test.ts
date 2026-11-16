import { describe, expect, it } from "vitest";

import { toUrlSlug } from "@table/lib/to-url-slug";
import { URL_VALUE_ENCODINGS } from "@table/schema/url-value-encoding.constants";

import { decodeOptionFromUrlToken, encodeOptionToUrlToken } from "./option-encoding";

describe("option token encode/decode", () => {
  const positionalOptions = ["first", "second", "third"] as const;

  it("maps positional options to 1-based tokens", () => {
    expect(encodeOptionToUrlToken("first", positionalOptions, URL_VALUE_ENCODINGS.POSITIONAL)).toBe(
      "1",
    );
    expect(
      encodeOptionToUrlToken("second", positionalOptions, URL_VALUE_ENCODINGS.POSITIONAL),
    ).toBe("2");
    expect(decodeOptionFromUrlToken("3", positionalOptions, URL_VALUE_ENCODINGS.POSITIONAL)).toBe(
      "third",
    );
  });

  it("rejects invalid positional tokens", () => {
    expect(
      decodeOptionFromUrlToken("0", positionalOptions, URL_VALUE_ENCODINGS.POSITIONAL),
    ).toBeUndefined();
    expect(
      decodeOptionFromUrlToken("01", positionalOptions, URL_VALUE_ENCODINGS.POSITIONAL),
    ).toBeUndefined();
    expect(
      decodeOptionFromUrlToken("4", positionalOptions, URL_VALUE_ENCODINGS.POSITIONAL),
    ).toBeUndefined();
  });

  it("round-trips slug tokens including Romanian diacritics", () => {
    const diacriticOptions = ["bursă", "olimpic"] as const;
    expect(toUrlSlug("bursă")).toBe("bursa");
    expect(encodeOptionToUrlToken("bursă", diacriticOptions, URL_VALUE_ENCODINGS.SLUG)).toBe(
      "bursa",
    );
    expect(decodeOptionFromUrlToken("bursa", diacriticOptions, URL_VALUE_ENCODINGS.SLUG)).toBe(
      "bursă",
    );
  });

  it("honors slug overrides for colliding options", () => {
    const collidingOptions = ["bursă", "bursa"] as const;
    const overrides = { bursă: "bursa-scholarship", bursa: "bursa-plain" };
    expect(
      encodeOptionToUrlToken("bursă", collidingOptions, URL_VALUE_ENCODINGS.SLUG, overrides),
    ).toBe("bursa-scholarship");
    expect(
      decodeOptionFromUrlToken(
        "bursa-plain",
        collidingOptions,
        URL_VALUE_ENCODINGS.SLUG,
        overrides,
      ),
    ).toBe("bursa");
  });
});
