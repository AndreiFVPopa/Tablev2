import { useLabels } from "@table/components/labels-context";

import styles from "../filters.module.scss";

import type { TextFilterProps } from "./text-filter.types";
export function TextFilter({ descriptor, value, onChange }: TextFilterProps): React.JSX.Element {
  const labels = useLabels();
  const current = typeof value === "string" ? value : "";
  const label = `${labels.filterLabelPrefix} ${descriptor.meta.title}`;
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const next = event.target.value;
    onChange(next === "" ? undefined : next);
  };
  return (
    <div className={styles.filterRoot}>
      <input
        type="search"
        aria-label={label}
        placeholder={labels.filterTextPlaceholder}
        value={current}
        onChange={handleChange}
        className={styles.textInput}
      />
    </div>
  );
}
