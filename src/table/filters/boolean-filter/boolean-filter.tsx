import styles from "../shared/filters.module.scss";

import { BOOLEAN_FILTER_CHOICE } from "./boolean-filter-choice.constants";
import { useBooleanFilter } from "./use-boolean-filter";

import type { BooleanFilterProps } from "./boolean-filter.types";

export function BooleanFilter(props: BooleanFilterProps): React.JSX.Element {
  const {
    selectedChoice,
    fieldName,
    legend,
    allLabel,
    trueLabel,
    falseLabel,
    handleAllChange,
    handleTrueChange,
    handleFalseChange,
  } = useBooleanFilter(props);

  return (
    <fieldset className={styles.filter__booleanGroup}>
      <legend className={styles.filter__srOnly}>{legend}</legend>
      <label>
        <input
          type="radio"
          name={fieldName}
          checked={selectedChoice === BOOLEAN_FILTER_CHOICE.ALL}
          onChange={handleAllChange}
        />
        {allLabel}
      </label>
      <label>
        <input
          type="radio"
          name={fieldName}
          checked={selectedChoice === BOOLEAN_FILTER_CHOICE.TRUE}
          onChange={handleTrueChange}
        />
        {trueLabel}
      </label>
      <label>
        <input
          type="radio"
          name={fieldName}
          checked={selectedChoice === BOOLEAN_FILTER_CHOICE.FALSE}
          onChange={handleFalseChange}
        />
        {falseLabel}
      </label>
    </fieldset>
  );
}
