import { toUrlSlug } from "@table/lib/to-url-slug";

import { DIAGNOSTIC_CODES } from "./diagnostic-codes.constants";
import { URL_VALUE_ENCODINGS, type UrlValueEncoding } from "./url-value-encoding.constants";

import type { OptionUrlEncodingIssue } from "./option-encoding-config.types";

export type { OptionUrlEncodingIssue } from "./option-encoding-config.types";

export function resolveOptionUrlEncoding(input: {
  readonly requestedEncoding: UrlValueEncoding;
  readonly optionValues: readonly string[];
  readonly allowPositional: boolean;
  readonly slugOverrides?: Readonly<Record<string, string>>;
}): OptionUrlEncodingIssue | undefined {
  if (input.requestedEncoding === URL_VALUE_ENCODINGS.CANONICAL) {
    return undefined;
  }

  if (input.requestedEncoding === URL_VALUE_ENCODINGS.POSITIONAL) {
    if (input.allowPositional) {
      return undefined;
    }
    return {
      code: DIAGNOSTIC_CODES.URL_VALUE_ENCODING_UNSUPPORTED,
      message: "positional URL encoding is only supported for single-select enum fields",
      hint: 'Use urlValueEncoding: "canonical" or "slug" for tag fields, or model the field as an enum.',
    };
  }

  const collision = findSlugCollision(input.optionValues, input.slugOverrides);
  if (collision === undefined) {
    return undefined;
  }
  return {
    code: DIAGNOSTIC_CODES.URL_SLUG_COLLISION,
    message: collision,
    hint: "Provide unique table.urlSlugOverrides for the colliding options, or use canonical/positional encoding.",
  };
}

function findSlugCollision(
  optionValues: readonly string[],
  slugOverrides: Readonly<Record<string, string>> | undefined,
): string | undefined {
  const slugOwners = new Map<string, string>();
  for (const option of optionValues) {
    const slug = slugOverrides?.[option] ?? toUrlSlug(option);
    if (slug === "") {
      return `option "${option}" produces an empty URL slug; provide table.urlSlugOverrides`;
    }
    const owner = slugOwners.get(slug);
    if (owner !== undefined && owner !== option) {
      return `URL slug "${slug}" collides for options "${owner}" and "${option}"`;
    }
    slugOwners.set(slug, option);
  }
  return undefined;
}
