import styles from "../filters.module.scss";

import { useDateRangeFilter } from "./use-date-range-filter";

import type { DateRangeFilterProps } from "./date-range-filter.types";

export function DateRangeFilter(props: DateRangeFilterProps): React.JSX.Element {
  const { fromInput, toInput, fromLabel, toLabel, handleFromChange, handleToChange } =
    useDateRangeFilter(props);

  return (
    <div className={styles.filter}>
      <div className={styles.filter__range}>
        <input
          type="date"
          aria-label={fromLabel}
          value={fromInput}
          onChange={handleFromChange}
          className={styles.filter__dateInput}
        />
        <input
          type="date"
          aria-label={toLabel}
          value={toInput}
          onChange={handleToChange}
          className={styles.filter__dateInput}
        />
      </div>
    </div>
  );
}
