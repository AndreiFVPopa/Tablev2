import type { TableLabels } from "./table-labels.types";

export type { TableLabels } from "./table-labels.types";

export const DEFAULT_LABELS: TableLabels = {
  filterTextPlaceholder: "Caută…",
  filterMinPlaceholder: "Min",
  filterMaxPlaceholder: "Max",
  filterFromPlaceholder: "De la",
  filterToPlaceholder: "Până la",
  filterEnumAll: "Toate",
  filterBooleanAll: "Toate",
  filterBooleanTrue: "Da",
  filterBooleanFalse: "Nu",
  filterTagsNoneSelected: "Fără filtru",
  filterLabelPrefix: "Filtrează",
  cellBooleanTrue: "Da",
  cellBooleanFalse: "Nu",
  cellEmpty: "—",
  sortAscending: "crescător",
  sortDescending: "descrescător",
  sortClear: "elimină sortarea",
  sortLabelPrefix: "Sortează",
  paginationFirst: "Prima pagină",
  paginationPrevious: "Pagina anterioară",
  paginationNext: "Pagina următoare",
  paginationLast: "Ultima pagină",
  paginationPageSize: "Rânduri pe pagină",
  paginationPageOf: "din",
  paginationRowsOf: "din",
  paginationLandmark: "Paginare",
  tableEmpty: "Nu există rezultate.",
  tableLandmark: "Tabel de date",
};
export function resolveLabels(overrides: Partial<TableLabels> | undefined): TableLabels {
  if (!overrides) return DEFAULT_LABELS;
  return { ...DEFAULT_LABELS, ...overrides };
}
