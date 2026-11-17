import { toUrlSlug } from "@table/lib/to-url-slug";
import { URL_VALUE_ENCODINGS } from "@table/schema/url-value-encoding.constants";

import type {
  DecodeOptionFromUrlTokenInput,
  DecodeSlugUrlTokenInput,
  EncodeOptionToUrlTokenInput,
  OptionFieldDescriptor,
} from "./option-encoding.types";

export type { OptionFieldDescriptor } from "./option-encoding.types";

export function encodeOptionToUrlToken({
  canonicalOption,
  optionValues,
  encoding,
  slugOverrides,
}: EncodeOptionToUrlTokenInput): string | undefined {
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

export function decodeOptionFromUrlToken({
  urlToken,
  optionValues,
  encoding,
  slugOverrides,
}: DecodeOptionFromUrlTokenInput): string | undefined {
  switch (encoding) {
    case URL_VALUE_ENCODINGS.CANONICAL:
      return optionValues.includes(urlToken) ? urlToken : undefined;
    case URL_VALUE_ENCODINGS.POSITIONAL:
      return decodePositionalUrlToken(urlToken, optionValues);
    case URL_VALUE_ENCODINGS.SLUG:
      return decodeSlugUrlToken({ urlToken, optionValues, slugOverrides });
  }
}

export function encodeDescriptorOption(
  canonicalOption: string,
  descriptor: OptionFieldDescriptor,
): string | undefined {
  return encodeOptionToUrlToken({
    canonicalOption,
    optionValues: descriptor.options,
    encoding: descriptor.meta.urlValueEncoding,
    slugOverrides: descriptor.meta.urlSlugOverrides,
  });
}

export function decodeDescriptorOption(
  urlToken: string,
  descriptor: OptionFieldDescriptor,
): string | undefined {
  return decodeOptionFromUrlToken({
    urlToken,
    optionValues: descriptor.options,
    encoding: descriptor.meta.urlValueEncoding,
    slugOverrides: descriptor.meta.urlSlugOverrides,
  });
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

function decodeSlugUrlToken({
  urlToken,
  optionValues,
  slugOverrides,
}: DecodeSlugUrlTokenInput): string | undefined {
  for (const option of optionValues) {
    const slug = slugOverrides?.[option] ?? toUrlSlug(option);
    if (slug === urlToken) return option;
  }
  return undefined;
}
