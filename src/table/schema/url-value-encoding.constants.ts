export const URL_VALUE_ENCODINGS = {
  CANONICAL: "canonical",
  POSITIONAL: "positional",
  SLUG: "slug",
} as const;

export type UrlValueEncoding = (typeof URL_VALUE_ENCODINGS)[keyof typeof URL_VALUE_ENCODINGS];
