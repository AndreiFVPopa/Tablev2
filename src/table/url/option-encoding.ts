import { toUrlSlug } from "@table/lib/to-url-slug";
import {
  URL_VALUE_ENCODINGS,
  type UrlValueEncoding,
} from "@table/schema/url-value-encoding.constants";

import type { EnumFieldDescriptor, TagsFieldDescriptor } from "@table/schema/descriptors";

export type OptionFieldDescriptor = EnumFieldDescriptor | TagsFieldDescriptor;

export function encodeOptionToUrlToken(
  canonicalOption: string,
  optionValues: readonly string[],
  encoding: UrlValueEncoding,
  slugOverrides?: Readonly<Record<string, string>>,
): string | undefined {
  const index = optionValues.indexOf(canonicalOption);
  if (index < 0) return undefined;

  switch (encoding) {
    case URL_VALUE_ENCODINGS.CANONICAL:
      return canonicalOption;
    case URL_VALUE_ENCODINGS.POSITIONAL:
      return String(index + 1);
    case URL_VALUE_ENCODINGS.SLUG: {
      const slug = slugOverrides?.[canonicalOption] ?? toUrlSlug(canonicalOption);
      return slug === "" ? undefined : slug;
    }
  }
}

export function decodeOptionFromUrlToken(
  urlToken: string,
  optionValues: readonly string[],
  encoding: UrlValueEncoding,
  slugOverrides?: Readonly<Record<string, string>>,
): string | undefined {
  switch (encoding) {
    case URL_VALUE_ENCODINGS.CANONICAL:
      return optionValues.includes(urlToken) ? urlToken : undefined;
    case URL_VALUE_ENCODINGS.POSITIONAL:
      return decodePositionalUrlToken(urlToken, optionValues);
    case URL_VALUE_ENCODINGS.SLUG:
      return decodeSlugUrlToken(urlToken, optionValues, slugOverrides);
  }
}

export function encodeDescriptorOption(
  canonicalOption: string,
  descriptor: OptionFieldDescriptor,
): string | undefined {
  return encodeOptionToUrlToken(
    canonicalOption,
    descriptor.options,
    descriptor.meta.urlValueEncoding,
    descriptor.meta.urlSlugOverrides,
  );
}

export function decodeDescriptorOption(
  urlToken: string,
  descriptor: OptionFieldDescriptor,
): string | undefined {
  return decodeOptionFromUrlToken(
    urlToken,
    descriptor.options,
    descriptor.meta.urlValueEncoding,
    descriptor.meta.urlSlugOverrides,
  );
}

function decodePositionalUrlToken(
  urlToken: string,
  optionValues: readonly string[],
): string | undefined {
  if (!/^[1-9]\d*$/.test(urlToken)) return undefined;
  const position = Number(urlToken);
  if (!Number.isInteger(position) || position < 1 || position > optionValues.length) {
    return undefined;
  }
  return optionValues[position - 1];
}

function decodeSlugUrlToken(
  urlToken: string,
  optionValues: readonly string[],
  slugOverrides: Readonly<Record<string, string>> | undefined,
): string | undefined {
  for (const option of optionValues) {
    const slug = slugOverrides?.[option] ?? toUrlSlug(option);
    if (slug === urlToken) return option;
  }
  return undefined;
}
