import styles from "../shared/filters.module.scss";

import { useTagsFilter } from "./use-tags-filter";

import type { TagsFilterProps } from "./tags-filter.types";

export function TagsFilter(props: TagsFilterProps): React.JSX.Element {
  const { selectedTags, options, optionLabels, legend, handleTagToggle } = useTagsFilter(props);

  return (
    <fieldset className={styles.filter__tagsGroup}>
      <legend className={styles.filter__srOnly}>{legend}</legend>
      {options.map((option) => (
        <label key={option}>
          <input
            type="checkbox"
            checked={selectedTags.includes(option)}
            onChange={handleTagToggle(option)}
          />
          {optionLabels?.[option] ?? option}
        </label>
      ))}
    </fieldset>
  );
}
