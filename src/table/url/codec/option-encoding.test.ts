import { describe, expect, it } from "vitest";

import { toUrlSlug } from "@table/lib/to-url-slug";
import { URL_VALUE_ENCODINGS } from "@table/schema/url-value-encoding.constants";

import { decodeOptionFromUrlToken, encodeOptionToUrlToken } from "./option-encoding";

describe("option token encode/decode", () => {
  const positionalOptions = ["first", "second", "third"] as const;

  it("maps positional options to 1-based tokens", () => {
    expect(
      encodeOptionToUrlToken({
        canonicalOption: "first",
        optionValues: positionalOptions,
        encoding: URL_VALUE_ENCODINGS.POSITIONAL,
      }),
    ).toBe("1");
    expect(
      encodeOptionToUrlToken({
        canonicalOption: "second",
        optionValues: positionalOptions,
        encoding: URL_VALUE_ENCODINGS.POSITIONAL,
      }),
    ).toBe("2");
    expect(
      decodeOptionFromUrlToken({
        urlToken: "3",
        optionValues: positionalOptions,
        encoding: URL_VALUE_ENCODINGS.POSITIONAL,
      }),
    ).toBe("third");
  });

  it("returns undefined when the option is absent or the slug is empty", () => {
    expect(
      encodeOptionToUrlToken({
        canonicalOption: "missing",
        optionValues: positionalOptions,
        encoding: URL_VALUE_ENCODINGS.CANONICAL,
      }),
    ).toBeUndefined();
    expect(
      encodeOptionToUrlToken({
        canonicalOption: "???",
        optionValues: ["???"],
        encoding: URL_VALUE_ENCODINGS.SLUG,
      }),
    ).toBeUndefined();
  });

  it("rejects invalid positional tokens", () => {
    expect(
      decodeOptionFromUrlToken({
        urlToken: "0",
        optionValues: positionalOptions,
        encoding: URL_VALUE_ENCODINGS.POSITIONAL,
      }),
    ).toBeUndefined();
    expect(
      decodeOptionFromUrlToken({
        urlToken: "01",
        optionValues: positionalOptions,
        encoding: URL_VALUE_ENCODINGS.POSITIONAL,
      }),
    ).toBeUndefined();
    expect(
      decodeOptionFromUrlToken({
        urlToken: "4",
        optionValues: positionalOptions,
        encoding: URL_VALUE_ENCODINGS.POSITIONAL,
      }),
    ).toBeUndefined();
  });

  it("round-trips slug tokens including Romanian diacritics", () => {
    const diacriticOptions = ["bursă", "olimpic"] as const;
    expect(toUrlSlug("bursă")).toBe("bursa");
    expect(
      encodeOptionToUrlToken({
        canonicalOption: "bursă",
        optionValues: diacriticOptions,
        encoding: URL_VALUE_ENCODINGS.SLUG,
      }),
    ).toBe("bursa");
    expect(
      decodeOptionFromUrlToken({
        urlToken: "bursa",
        optionValues: diacriticOptions,
        encoding: URL_VALUE_ENCODINGS.SLUG,
      }),
    ).toBe("bursă");
  });

  it("honors slug overrides for colliding options", () => {
    const collidingOptions = ["bursă", "bursa"] as const;
    const overrides = { bursă: "bursa-scholarship", bursa: "bursa-plain" };
    expect(
      encodeOptionToUrlToken({
        canonicalOption: "bursă",
        optionValues: collidingOptions,
        encoding: URL_VALUE_ENCODINGS.SLUG,
        slugOverrides: overrides,
      }),
    ).toBe("bursa-scholarship");
    expect(
      decodeOptionFromUrlToken({
        urlToken: "bursa-plain",
        optionValues: collidingOptions,
        encoding: URL_VALUE_ENCODINGS.SLUG,
        slugOverrides: overrides,
      }),
    ).toBe("bursa");
  });
});
