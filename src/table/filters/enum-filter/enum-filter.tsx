import { useLabels } from "@table/components/labels-context";

import styles from "../shared/filters.module.scss";

import { ENUM_FILTER_ALL_OPTION } from "./enum-filter.constants";

import type { EnumFilterProps } from "./enum-filter.types";

export function EnumFilter({ descriptor, value, onChange }: EnumFilterProps): React.JSX.Element {
  const labels = useLabels();
  const selectedOption =
    typeof value === "string" && value.length > 0 ? value : ENUM_FILTER_ALL_OPTION;
  const label = `${labels.filterLabelPrefix} ${descriptor.meta.title}`;

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    const selectedValue = event.target.value;
    onChange(selectedValue === ENUM_FILTER_ALL_OPTION ? undefined : selectedValue);
  };

  return (
    <div className={styles.filter}>
      <select
        aria-label={label}
        value={selectedOption}
        onChange={handleChange}
        className={styles.filter__select}
      >
        <option value={ENUM_FILTER_ALL_OPTION}>{labels.filterEnumAll}</option>
        {descriptor.options.map((option) => (
          <option key={option} value={option}>
            {descriptor.meta.optionLabels?.[option] ?? option}
          </option>
        ))}
      </select>
    </div>
  );
}
