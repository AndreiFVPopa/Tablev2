import { createContext, useContext } from "react";

import { DEFAULT_LABELS, type TableLabels } from "@table/table-labels";

import type { LabelsProviderProps } from "./labels-context.types";

const LabelsContext = createContext<TableLabels>(DEFAULT_LABELS);

export type { LabelsProviderProps } from "./labels-context.types";

export function LabelsProvider({ value, children }: LabelsProviderProps): React.JSX.Element {
  return <LabelsContext.Provider value={value}>{children}</LabelsContext.Provider>;
}
export function useLabels(): TableLabels {
  return useContext(LabelsContext);
}
