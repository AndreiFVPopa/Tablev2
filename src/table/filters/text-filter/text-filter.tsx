import { useLabels } from "@table/components/labels-context";

import styles from "../filters.module.scss";

import type { TextFilterProps } from "./text-filter.types";

export function TextFilter({ descriptor, value, onChange }: TextFilterProps): React.JSX.Element {
  const labels = useLabels();
  const textValue = typeof value === "string" ? value : "";
  const label = `${labels.filterLabelPrefix} ${descriptor.meta.title}`;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const nextText = event.target.value;
    onChange(nextText === "" ? undefined : nextText);
  };

  return (
    <div className={styles.filter}>
      <input
        type="search"
        aria-label={label}
        placeholder={labels.filterTextPlaceholder}
        value={textValue}
        onChange={handleChange}
        className={styles.filter__textInput}
      />
    </div>
  );
}
