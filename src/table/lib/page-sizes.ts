export const DEFAULT_PAGE_SIZE = 25;
export const DEFAULT_PAGE_SIZES: readonly number[] = [10, 25, 50, 100];

export function resolveDefaultPageSize(pageSizes: readonly number[]): number {
  if (pageSizes.includes(DEFAULT_PAGE_SIZE)) return DEFAULT_PAGE_SIZE;
  return pageSizes[0] ?? DEFAULT_PAGE_SIZE;
}
