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

  it("rejects invalid positional tokens and accepts the canonical option when it is unambiguous", () => {
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
    expect(
      decodeOptionFromUrlToken({
        urlToken: "second",
        optionValues: positionalOptions,
        encoding: URL_VALUE_ENCODINGS.POSITIONAL,
      }),
    ).toBe("second");
  });

  it("decodes positional tokens, canonical values, and normalized display labels", () => {
    const optionValues = ["male", "female"] as const;
    const optionLabels = { male: "Mașculin", female: "Feminin" };
    const encoding = URL_VALUE_ENCODINGS.POSITIONAL;
    for (const urlToken of [
      "1",
      "male",
      "masculin",
      "MASCULIN",
      "Mașculin",
      "%6D%61%73%63%75%6C%69%6E",
      "Ma%C8%99culin",
    ]) {
      expect(
        decodeOptionFromUrlToken({
          urlToken,
          optionValues,
          encoding,
          optionLabels,
        }),
      ).toBe("male");
    }
    expect(
      decodeOptionFromUrlToken({
        urlToken: "feminin",
        optionValues,
        encoding,
        optionLabels,
      }),
    ).toBe("female");
    expect(
      decodeOptionFromUrlToken({
        urlToken: "0",
        optionValues,
        encoding,
        optionLabels,
      }),
    ).toBeUndefined();
    expect(
      decodeOptionFromUrlToken({
        urlToken: "%",
        optionValues,
        encoding,
        optionLabels,
      }),
    ).toBeUndefined();
    expect(
      encodeOptionToUrlToken({
        canonicalOption: "male",
        optionValues,
        encoding,
      }),
    ).toBe("1");
  });

  it("refuses a token that is both a position and a different canonical option", () => {
    const ambiguousOptions = ["alpha", "1"] as const;
    expect(
      decodeOptionFromUrlToken({
        urlToken: "1",
        optionValues: ambiguousOptions,
        encoding: URL_VALUE_ENCODINGS.POSITIONAL,
      }),
    ).toBeUndefined();
    expect(
      decodeOptionFromUrlToken({
        urlToken: "2",
        optionValues: ambiguousOptions,
        encoding: URL_VALUE_ENCODINGS.POSITIONAL,
      }),
    ).toBe("1");
    expect(
      decodeOptionFromUrlToken({
        urlToken: "1",
        optionValues: ["1", "alpha"],
        encoding: URL_VALUE_ENCODINGS.POSITIONAL,
      }),
    ).toBe("1");
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
