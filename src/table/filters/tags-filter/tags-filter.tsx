import { useLabels } from "@table/components/labels-context";

import styles from "../filters.module.scss";

import type { TagsFilterProps } from "./tags-filter.types";
export function TagsFilter({ descriptor, value, onChange }: TagsFilterProps): React.JSX.Element {
  const labels = useLabels();
  const selected: readonly string[] = Array.isArray(value) ? value : [];
  const legend = `${labels.filterLabelPrefix} ${descriptor.meta.title}`;
  const toggle = (option: string) => () => {
    const next: string[] = selected.includes(option)
      ? selected.filter((entry) => entry !== option)
      : [...selected, option];
    onChange(next.length === 0 ? undefined : next);
  };
  return (
    <fieldset className={styles.tagsGroup}>
      <legend className={styles.srOnly}>{legend}</legend>
      {descriptor.options.map((option) => (
        <label key={option}>
          <input type="checkbox" checked={selected.includes(option)} onChange={toggle(option)} />
          {option}
        </label>
      ))}
    </fieldset>
  );
}
