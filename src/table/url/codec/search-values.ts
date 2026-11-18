export function coerceString(inputValue: unknown): string | undefined {
  if (typeof inputValue === "string") return inputValue;
  if (typeof inputValue === "number" && Number.isFinite(inputValue)) return String(inputValue);
  return undefined;
}

export function coerceFiniteNumber(inputValue: unknown): number | undefined {
  if (typeof inputValue === "number") {
    return Number.isFinite(inputValue) ? inputValue : undefined;
  }
  if (typeof inputValue === "string" && inputValue.trim() !== "") {
    const numericValue = Number(inputValue);
    return Number.isFinite(numericValue) ? numericValue : undefined;
  }
  return undefined;
}

export function toPositiveInt(inputValue: unknown): number | undefined {
  const numericValue = coerceFiniteNumber(inputValue);
  if (numericValue !== undefined && Number.isInteger(numericValue) && numericValue >= 1) {
    return numericValue;
  }
  return undefined;
}
