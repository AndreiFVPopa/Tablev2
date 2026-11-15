import { createContext, useContext, type ReactNode } from "react";

import { DEFAULT_LABELS, type TableLabels } from "@table/table-labels";
const LabelsContext = createContext<TableLabels>(DEFAULT_LABELS);
export interface LabelsProviderProps {
  readonly value: TableLabels;
  readonly children: ReactNode;
}
export function LabelsProvider({ value, children }: LabelsProviderProps): React.JSX.Element {
  return <LabelsContext.Provider value={value}>{children}</LabelsContext.Provider>;
}
export function useLabels(): TableLabels {
  return useContext(LabelsContext);
}
