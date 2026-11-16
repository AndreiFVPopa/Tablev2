import { useLabels } from "@table/components/labels-context";

import { DATE_RANGE_BOUNDARY, type DateRangeBoundary } from "./date-range-boundary.constants";

import type { DateRangeFilterValue } from "../filter-values.types";
import type { DateRangeFilterProps } from "./date-range-filter.types";

export function useDateRangeFilter({ descriptor, value, onChange }: DateRangeFilterProps): {
  readonly fromInput: string;
  readonly toInput: string;
  readonly fromLabel: string;
  readonly toLabel: string;
  readonly handleFromChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  readonly handleToChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
} {
  const labels = useLabels();
  const currentRange = value ?? {};
  const fromInput = currentRange.from ?? "";
  const toInput = currentRange.to ?? "";

  const handleRangeBoundaryChange =
    (rangeBoundary: DateRangeBoundary) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = event.target.value;
      const updatedRange: DateRangeFilterValue = {
        ...currentRange,
        [rangeBoundary]: inputValue === "" ? undefined : inputValue,
      };
      onChange(!updatedRange.from && !updatedRange.to ? undefined : updatedRange);
    };

  return {
    fromInput,
    toInput,
    fromLabel: `${labels.filterLabelPrefix} ${descriptor.meta.title} — ${labels.filterFromPlaceholder}`,
    toLabel: `${labels.filterLabelPrefix} ${descriptor.meta.title} — ${labels.filterToPlaceholder}`,
    handleFromChange: handleRangeBoundaryChange(DATE_RANGE_BOUNDARY.FROM),
    handleToChange: handleRangeBoundaryChange(DATE_RANGE_BOUNDARY.TO),
  };
}
