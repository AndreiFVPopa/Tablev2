import { useLabels } from "@table/components/labels-context";

import { NUMBER_RANGE_BOUNDARY, type NumberRangeBoundary } from "./number-range-boundary.constants";
import { parseNumericBoundary } from "./parse-numeric-boundary";

import type { NumberRangeFilterValue } from "../shared/filter-values.types";
import type { NumberRangeFilterProps } from "./number-range-filter.types";

export function useNumberRangeFilter({ descriptor, value, onChange }: NumberRangeFilterProps): {
  readonly minimumInput: string;
  readonly maximumInput: string;
  readonly minimumLabel: string;
  readonly maximumLabel: string;
  readonly integer: boolean;
  readonly minimumPlaceholder: string;
  readonly maximumPlaceholder: string;
  readonly handleMinimumChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  readonly handleMaximumChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
} {
  const labels = useLabels();
  const currentRange = value ?? {};
  const minimumInput = currentRange.min === undefined ? "" : String(currentRange.min);
  const maximumInput = currentRange.max === undefined ? "" : String(currentRange.max);

  const handleRangeBoundaryChange =
    (rangeBoundary: NumberRangeBoundary) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = event.target.value;
      const parsedBoundary = parseNumericBoundary(inputValue);
      const updatedRange: NumberRangeFilterValue = {
        ...currentRange,
        [rangeBoundary]: parsedBoundary,
      };
      onChange(
        updatedRange.min === undefined && updatedRange.max === undefined ? undefined : updatedRange,
      );
    };

  return {
    minimumInput,
    maximumInput,
    minimumLabel: `${labels.filterLabelPrefix} ${descriptor.meta.title} — ${labels.filterMinPlaceholder}`,
    maximumLabel: `${labels.filterLabelPrefix} ${descriptor.meta.title} — ${labels.filterMaxPlaceholder}`,
    integer: descriptor.integer,
    minimumPlaceholder: labels.filterMinPlaceholder,
    maximumPlaceholder: labels.filterMaxPlaceholder,
    handleMinimumChange: handleRangeBoundaryChange(NUMBER_RANGE_BOUNDARY.MINIMUM),
    handleMaximumChange: handleRangeBoundaryChange(NUMBER_RANGE_BOUNDARY.MAXIMUM),
  };
}
