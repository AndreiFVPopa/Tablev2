import { useLabels } from "@table/components/labels-context";

import styles from "../filters.module.scss";

import type { DateRangeFilterValue } from "../filter-values.types";
import type { DateRangeFilterProps } from "./date-range-filter.types";
export function DateRangeFilter({
  descriptor,
  value,
  onChange,
}: DateRangeFilterProps): React.JSX.Element {
  const labels = useLabels();
  const current = value ?? {};
  const fromText = current.from ?? "";
  const toText = current.to ?? "";
  const updateBound = (bound: "from" | "to") => (event: React.ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value;
    const next: DateRangeFilterValue = { ...current, [bound]: raw === "" ? undefined : raw };
    onChange(!next.from && !next.to ? undefined : next);
  };
  const labelFrom = `${labels.filterLabelPrefix} ${descriptor.meta.title} — ${labels.filterFromPlaceholder}`;
  const labelTo = `${labels.filterLabelPrefix} ${descriptor.meta.title} — ${labels.filterToPlaceholder}`;
  return (
    <div className={styles.filterRoot}>
      <div className={styles.rangeRow}>
        <input
          type="date"
          aria-label={labelFrom}
          value={fromText}
          onChange={updateBound("from")}
          className={styles.dateInput}
        />
        <input
          type="date"
          aria-label={labelTo}
          value={toText}
          onChange={updateBound("to")}
          className={styles.dateInput}
        />
      </div>
    </div>
  );
}
