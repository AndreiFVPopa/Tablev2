import { useLabels } from "@table/components/labels-context";

import { BOOLEAN_FILTER_CHOICE, type BooleanFilterChoice } from "./boolean-filter-choice.constants";

import type { BooleanFilterValue } from "../filter-values.types";
import type { BooleanFilterProps } from "./boolean-filter.types";

export function useBooleanFilter({ descriptor, value, onChange }: BooleanFilterProps): {
  readonly selectedChoice: BooleanFilterChoice;
  readonly fieldName: string;
  readonly legend: string;
  readonly allLabel: string;
  readonly trueLabel: string;
  readonly falseLabel: string;
  readonly handleAllChange: () => void;
  readonly handleTrueChange: () => void;
  readonly handleFalseChange: () => void;
} {
  const labels = useLabels();
  const selectedChoice = resolveBooleanFilterChoice(value);

  const handleChoiceSelect = (choice: BooleanFilterChoice) => () => {
    if (choice === BOOLEAN_FILTER_CHOICE.ALL) {
      onChange(undefined);
      return;
    }
    onChange(choice === BOOLEAN_FILTER_CHOICE.TRUE);
  };

  return {
    selectedChoice,
    fieldName: `boolean-filter-${descriptor.path}`,
    legend: `${labels.filterLabelPrefix} ${descriptor.meta.title}`,
    allLabel: labels.filterBooleanAll,
    trueLabel: labels.filterBooleanTrue,
    falseLabel: labels.filterBooleanFalse,
    handleAllChange: handleChoiceSelect(BOOLEAN_FILTER_CHOICE.ALL),
    handleTrueChange: handleChoiceSelect(BOOLEAN_FILTER_CHOICE.TRUE),
    handleFalseChange: handleChoiceSelect(BOOLEAN_FILTER_CHOICE.FALSE),
  };
}

function resolveBooleanFilterChoice(value: BooleanFilterValue | undefined): BooleanFilterChoice {
  if (value === true) return BOOLEAN_FILTER_CHOICE.TRUE;
  if (value === false) return BOOLEAN_FILTER_CHOICE.FALSE;
  return BOOLEAN_FILTER_CHOICE.ALL;
}
