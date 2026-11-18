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

  it("rejects a positional token that names a different option", () => {
    const issue = resolveOptionUrlEncoding({
      requestedEncoding: URL_VALUE_ENCODINGS.POSITIONAL,
      optionValues: ["alpha", "1"],
      allowPositional: true,
    });
    expect(issue?.code).toBe(DIAGNOSTIC_CODES.URL_POSITION_COLLISION);
    expect(issue?.message).toMatch(/token "1"/);
  });

  it("allows positional encoding when the numeric option is that same position", () => {
    const issue = resolveOptionUrlEncoding({
      requestedEncoding: URL_VALUE_ENCODINGS.POSITIONAL,
      optionValues: ["1", "2"],
      allowPositional: true,
    });
    expect(issue).toBeUndefined();
  });

  it("allows a display label that slugs to the same option", () => {
    const issue = resolveOptionUrlEncoding({
      requestedEncoding: URL_VALUE_ENCODINGS.POSITIONAL,
      optionValues: ["male", "female"],
      allowPositional: true,
      optionLabels: { male: "Masculin", female: "Feminin" },
    });
    expect(issue).toBeUndefined();
    const sameOption = resolveOptionUrlEncoding({
      requestedEncoding: URL_VALUE_ENCODINGS.POSITIONAL,
      optionValues: ["male", "female"],
      allowPositional: true,
      optionLabels: { male: "1" },
    });
    expect(sameOption).toBeUndefined();
  });

  it("rejects a display label or slug that names a different option", () => {
    const labelCollision = resolveOptionUrlEncoding({
      requestedEncoding: URL_VALUE_ENCODINGS.POSITIONAL,
      optionValues: ["male", "female"],
      allowPositional: true,
      optionLabels: { female: "1" },
    });
    expect(labelCollision?.code).toBe(DIAGNOSTIC_CODES.URL_POSITION_COLLISION);
    expect(labelCollision?.message).toMatch(/token "1"/);
    const slugCollision = resolveOptionUrlEncoding({
      requestedEncoding: URL_VALUE_ENCODINGS.POSITIONAL,
      optionValues: ["alpha", "beta"],
      allowPositional: true,
      optionLabels: { alpha: "Persoană", beta: "Persoana" },
    });
    expect(slugCollision?.code).toBe(DIAGNOSTIC_CODES.URL_POSITION_COLLISION);
    expect(slugCollision?.message).toMatch(/token "persoana"/);
    const overrideCollision = resolveOptionUrlEncoding({
      requestedEncoding: URL_VALUE_ENCODINGS.POSITIONAL,
      optionValues: ["alpha", "beta"],
      allowPositional: true,
      slugOverrides: { beta: "1" },
    });
    expect(overrideCollision?.code).toBe(DIAGNOSTIC_CODES.URL_POSITION_COLLISION);
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
