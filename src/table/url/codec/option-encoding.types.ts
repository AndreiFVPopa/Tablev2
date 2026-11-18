import type { EnumFieldDescriptor, TagsFieldDescriptor } from "@table/schema/descriptors";
import type { UrlValueEncoding } from "@table/schema/url-value-encoding.constants";

export type OptionFieldDescriptor = EnumFieldDescriptor | TagsFieldDescriptor;

export interface EncodeOptionToUrlTokenInput {
  readonly canonicalOption: string;
  readonly optionValues: readonly string[];
  readonly encoding: UrlValueEncoding;
  readonly slugOverrides?: Readonly<Record<string, string>> | undefined;
}

export interface DecodeOptionFromUrlTokenInput {
  readonly urlToken: string;
  readonly optionValues: readonly string[];
  readonly encoding: UrlValueEncoding;
  readonly slugOverrides?: Readonly<Record<string, string>> | undefined;
}

export interface DecodeSlugUrlTokenInput {
  readonly urlToken: string;
  readonly optionValues: readonly string[];
  readonly slugOverrides: Readonly<Record<string, string>> | undefined;
}
