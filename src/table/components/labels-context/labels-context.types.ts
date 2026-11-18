import type { TableLabels } from "@table/table-labels.types";
import type { ReactNode } from "react";

export interface LabelsProviderProps {
  readonly value: TableLabels;
  readonly children: ReactNode;
}
