export function toUrlSlug(canonicalValue: string): string {
  return canonicalValue
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((segment) => segment.length > 0)
    .join("-");
}
