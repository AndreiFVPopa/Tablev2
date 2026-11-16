import styles from "../filters.module.scss";

import { useNumberRangeFilter } from "./use-number-range-filter";

import type { NumberRangeFilterProps } from "./number-range-filter.types";

export function NumberRangeFilter(props: NumberRangeFilterProps): React.JSX.Element {
  const {
    minimumInput,
    maximumInput,
    minimumLabel,
    maximumLabel,
    integer,
    minimumPlaceholder,
    maximumPlaceholder,
    handleMinimumChange,
    handleMaximumChange,
  } = useNumberRangeFilter(props);

  return (
    <div className={styles.filter}>
      <div className={styles.filter__range}>
        <input
          type="number"
          inputMode={integer ? "numeric" : "decimal"}
          step={integer ? 1 : "any"}
          aria-label={minimumLabel}
          placeholder={minimumPlaceholder}
          value={minimumInput}
          onChange={handleMinimumChange}
          className={styles.filter__numberInput}
        />
        <input
          type="number"
          inputMode={integer ? "numeric" : "decimal"}
          step={integer ? 1 : "any"}
          aria-label={maximumLabel}
          placeholder={maximumPlaceholder}
          value={maximumInput}
          onChange={handleMaximumChange}
          className={styles.filter__numberInput}
        />
      </div>
    </div>
  );
}
