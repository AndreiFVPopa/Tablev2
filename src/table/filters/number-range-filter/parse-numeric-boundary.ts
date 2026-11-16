export function parseNumericBoundary(inputValue: string): number | undefined {
  if (inputValue.trim() === "") return undefined;
  const numericValue = Number(inputValue);
  return Number.isFinite(numericValue) ? numericValue : undefined;
}
