import { useLabels } from "@table/components/labels-context";

import styles from "../filters.module.scss";

import type { NumberRangeFilterValue } from "../filter-values.types";
import type { NumberRangeFilterProps } from "./number-range-filter.types";
export function NumberRangeFilter({
  descriptor,
  value,
  onChange,
}: NumberRangeFilterProps): React.JSX.Element {
  const labels = useLabels();
  const current = value ?? {};
  const minText = current.min === undefined ? "" : String(current.min);
  const maxText = current.max === undefined ? "" : String(current.max);
  const updateBound = (bound: "min" | "max") => (event: React.ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value;
    const parsed = parseBound(raw);
    const next: NumberRangeFilterValue = { ...current, [bound]: parsed };
    onChange(next.min === undefined && next.max === undefined ? undefined : next);
  };
  const labelMin = `${labels.filterLabelPrefix} ${descriptor.meta.title} — ${labels.filterMinPlaceholder}`;
  const labelMax = `${labels.filterLabelPrefix} ${descriptor.meta.title} — ${labels.filterMaxPlaceholder}`;
  return (
    <div className={styles.filterRoot}>
      <div className={styles.rangeRow}>
        <input
          type="number"
          inputMode={descriptor.integer ? "numeric" : "decimal"}
          step={descriptor.integer ? 1 : "any"}
          aria-label={labelMin}
          placeholder={labels.filterMinPlaceholder}
          value={minText}
          onChange={updateBound("min")}
          className={styles.numberInput}
        />
        <input
          type="number"
          inputMode={descriptor.integer ? "numeric" : "decimal"}
          step={descriptor.integer ? 1 : "any"}
          aria-label={labelMax}
          placeholder={labels.filterMaxPlaceholder}
          value={maxText}
          onChange={updateBound("max")}
          className={styles.numberInput}
        />
      </div>
    </div>
  );
}
function parseBound(raw: string): number | undefined {
  if (raw.trim() === "") return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}
