import { describe, expect, it } from "vitest";

import { DIAGNOSTIC_CODES } from "../diagnostic-codes.constants";
import { URL_VALUE_ENCODINGS } from "../url-value-encoding.constants";

import { resolveOptionUrlEncoding } from "./option-encoding-config";

describe("resolveOptionUrlEncoding", () => {
  it("rejects positional encoding for tag fields without rewriting the request", () => {
    const issue = resolveOptionUrlEncoding({
      requestedEncoding: URL_VALUE_ENCODINGS.POSITIONAL,
      optionValues: ["alpha", "beta"],
      allowPositional: false,
    });
    expect(issue?.code).toBe(DIAGNOSTIC_CODES.URL_VALUE_ENCODING_UNSUPPORTED);
  });

  it("detects slug collisions without suggesting a silent fallback encoding", () => {
    const collidingOptions = ["bursă", "bursa"] as const;
    const issue = resolveOptionUrlEncoding({
      requestedEncoding: URL_VALUE_ENCODINGS.SLUG,
      optionValues: collidingOptions,
      allowPositional: false,
    });
    expect(issue?.code).toBe(DIAGNOSTIC_CODES.URL_SLUG_COLLISION);
    expect(issue?.message).toMatch(/collides/);
  });

  it("accepts explicit overrides to resolve collisions", () => {
    const collidingOptions = ["bursă", "bursa"] as const;
    const issue = resolveOptionUrlEncoding({
      requestedEncoding: URL_VALUE_ENCODINGS.SLUG,
      optionValues: collidingOptions,
      allowPositional: false,
      slugOverrides: { bursă: "bursa-scholarship", bursa: "bursa-plain" },
    });
    expect(issue).toBeUndefined();
  });
});
