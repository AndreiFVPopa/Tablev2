import { useLabels } from "@table/components/labels-context";

import type { TagsFilterProps } from "./tags-filter.types";

export function useTagsFilter({ descriptor, value, onChange }: TagsFilterProps): {
  readonly selectedTags: readonly string[];
  readonly options: readonly string[];
  readonly optionLabels: Readonly<Record<string, string>> | undefined;
  readonly legend: string;
  readonly handleTagToggle: (option: string) => () => void;
} {
  const labels = useLabels();
  const selectedTags: readonly string[] = Array.isArray(value) ? value : [];

  const handleTagToggle = (option: string) => () => {
    const updatedSelectedTags: string[] = selectedTags.includes(option)
      ? selectedTags.filter((entry) => entry !== option)
      : [...selectedTags, option];
    onChange(updatedSelectedTags.length === 0 ? undefined : updatedSelectedTags);
  };

  return {
    selectedTags,
    options: descriptor.options,
    optionLabels: descriptor.meta.optionLabels,
    legend: `${labels.filterLabelPrefix} ${descriptor.meta.title}`,
    handleTagToggle,
  };
}
