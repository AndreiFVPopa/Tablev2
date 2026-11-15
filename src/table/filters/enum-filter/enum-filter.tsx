import { useLabels } from "@table/components/labels-context";

import styles from "../filters.module.scss";

import type { EnumFilterProps } from "./enum-filter.types";
const ALL_SENTINEL = "__all__";
export function EnumFilter({ descriptor, value, onChange }: EnumFilterProps): React.JSX.Element {
  const labels = useLabels();
  const current = typeof value === "string" && value.length > 0 ? value : ALL_SENTINEL;
  const label = `${labels.filterLabelPrefix} ${descriptor.meta.title}`;
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    const next = event.target.value;
    onChange(next === ALL_SENTINEL ? undefined : next);
  };
  return (
    <div className={styles.filterRoot}>
      <select aria-label={label} value={current} onChange={handleChange} className={styles.select}>
        <option value={ALL_SENTINEL}>{labels.filterEnumAll}</option>
        {descriptor.options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
