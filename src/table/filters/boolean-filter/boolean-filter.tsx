import { useLabels } from "@table/components/labels-context";

import styles from "../filters.module.scss";

import type { BooleanFilterValue } from "../filter-values.types";
import type { BooleanFilterChoice, BooleanFilterProps } from "./boolean-filter.types";
export function BooleanFilter({
  descriptor,
  value,
  onChange,
}: BooleanFilterProps): React.JSX.Element {
  const labels = useLabels();
  const current = currentChoice(value);
  const name = `boolean-filter-${descriptor.path}`;
  const legend = `${labels.filterLabelPrefix} ${descriptor.meta.title}`;
  const select = (choice: BooleanFilterChoice) => () => {
    onChange(choice === "all" ? undefined : choice === "true");
  };
  return (
    <fieldset className={styles.booleanGroup}>
      <legend className={styles.srOnly}>{legend}</legend>
      <label>
        <input type="radio" name={name} checked={current === "all"} onChange={select("all")} />
        {labels.filterBooleanAll}
      </label>
      <label>
        <input type="radio" name={name} checked={current === "true"} onChange={select("true")} />
        {labels.filterBooleanTrue}
      </label>
      <label>
        <input type="radio" name={name} checked={current === "false"} onChange={select("false")} />
        {labels.filterBooleanFalse}
      </label>
    </fieldset>
  );
}
function currentChoice(value: BooleanFilterValue | undefined): BooleanFilterChoice {
  if (value === true) return "true";
  if (value === false) return "false";
  return "all";
}
