import { toUrlSlug } from "@table/lib/to-url-slug";

import { DIAGNOSTIC_CODES } from "../diagnostic-codes.constants";
import { URL_VALUE_ENCODINGS, type UrlValueEncoding } from "../url-value-encoding.constants";

import type { OptionUrlEncodingIssue } from "./option-encoding-config.types";

export type { OptionUrlEncodingIssue } from "./option-encoding-config.types";

export const BOOLEAN_CANONICAL_OPTIONS = ["true", "false"] as const;

const POSITIONAL_TOKEN = /^[1-9]\d*$/;

export function positionalOptionForToken(
  urlToken: string,
  optionValues: readonly string[],
): string | undefined {
  if (!POSITIONAL_TOKEN.test(urlToken)) return undefined;
  const position = Number(urlToken);
  if (!Number.isInteger(position) || position < 1 || position > optionValues.length) {
    return undefined;
  }
  return optionValues[position - 1];
}

export function resolveOptionUrlEncoding(input: {
  readonly requestedEncoding: UrlValueEncoding;
  readonly optionValues: readonly string[];
  readonly allowPositional: boolean;
  readonly optionLabels?: Readonly<Record<string, string>>;
  readonly slugOverrides?: Readonly<Record<string, string>>;
}): OptionUrlEncodingIssue | undefined {
  if (input.requestedEncoding === URL_VALUE_ENCODINGS.CANONICAL) {
    return undefined;
  }

  if (input.requestedEncoding === URL_VALUE_ENCODINGS.POSITIONAL) {
    if (!input.allowPositional) {
      return {
        code: DIAGNOSTIC_CODES.URL_VALUE_ENCODING_UNSUPPORTED,
        message:
          "positional URL encoding is only supported for boolean and single-select enum fields",
        hint: 'Use urlValueEncoding: "canonical" or "slug" for tag fields.',
      };
    }
    const collision = findPositionalAliasCollision(input);
    if (collision === undefined) return undefined;
    return {
      code: DIAGNOSTIC_CODES.URL_POSITION_COLLISION,
      message: collision,
      hint: "Rename the option, display label, or slug so each URL token maps to one option, or use canonical encoding.",
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

export function optionForPositionalAlias(input: {
  readonly urlToken: string;
  readonly optionValues: readonly string[];
  readonly optionLabels?: Readonly<Record<string, string>>;
  readonly slugOverrides?: Readonly<Record<string, string>>;
}): string | undefined {
  const slug = toUrlSlug(input.urlToken);
  const matches = new Set<string>();
  const positional = positionalOptionForToken(input.urlToken, input.optionValues);
  if (positional !== undefined) matches.add(positional);
  for (const option of input.optionValues) {
    const aliases = aliasTokensForOption(option, input);
    if (aliases.has(input.urlToken) || (slug !== "" && aliases.has(slug))) matches.add(option);
  }
  if (matches.size !== 1) return undefined;
  return [...matches][0];
}

function findPositionalAliasCollision(input: {
  readonly optionValues: readonly string[];
  readonly optionLabels?: Readonly<Record<string, string>>;
  readonly slugOverrides?: Readonly<Record<string, string>>;
}): string | undefined {
  const owners = new Map<string, string>();
  for (let index = 0; index < input.optionValues.length; index += 1) {
    const option = input.optionValues[index];
    if (option === undefined) continue;
    const tokens = new Set<string>([String(index + 1), ...aliasTokensForOption(option, input)]);
    for (const token of tokens) {
      const owner = owners.get(token);
      if (owner !== undefined && owner !== option) {
        return `URL token "${token}" matches both "${owner}" and "${option}"`;
      }
      owners.set(token, option);
    }
  }
  return undefined;
}

function aliasTokensForOption(
  option: string,
  input: {
    readonly optionLabels?: Readonly<Record<string, string>>;
    readonly slugOverrides?: Readonly<Record<string, string>>;
  },
): ReadonlySet<string> {
  const tokens = new Set<string>([option]);
  addSlugToken(tokens, input.slugOverrides?.[option] ?? toUrlSlug(option));
  const label = input.optionLabels?.[option];
  if (label !== undefined) addSlugToken(tokens, toUrlSlug(label));
  return tokens;
}

function addSlugToken(tokens: Set<string>, slug: string): void {
  if (slug !== "") tokens.add(slug);
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
