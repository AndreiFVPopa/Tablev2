export interface TableLabels {
  readonly filterTextPlaceholder: string;
  readonly filterMinPlaceholder: string;
  readonly filterMaxPlaceholder: string;
  readonly filterFromPlaceholder: string;
  readonly filterToPlaceholder: string;
  readonly filterEnumAll: string;
  readonly filterBooleanAll: string;
  readonly filterBooleanTrue: string;
  readonly filterBooleanFalse: string;
  readonly filterTagsNoneSelected: string;
  readonly filterLabelPrefix: string;
  readonly cellBooleanTrue: string;
  readonly cellBooleanFalse: string;
  readonly cellEmpty: string;
  readonly sortAscending: string;
  readonly sortDescending: string;
  readonly sortClear: string;
  readonly sortLabelPrefix: string;
  readonly paginationFirst: string;
  readonly paginationPrevious: string;
  readonly paginationNext: string;
  readonly paginationLast: string;
  readonly paginationPageSize: string;
  readonly paginationPageOf: string;
  readonly paginationRowsOf: string;
  readonly paginationLandmark: string;
  readonly tableEmpty: string;
  readonly tableLandmark: string;
}
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
