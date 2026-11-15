export { TABLE_PACKAGE_VERSION, TABLE_PEER_DEPENDENCIES } from "./package-info";
export type { TablePeerDependency } from "./package-info";
export {
  DIAGNOSTIC_CODES,
  FIELD_KINDS,
  FILTER_KINDS,
  interpretSchema,
  SchemaInterpretationError,
  isSortableKind,
  defaultFilterKind,
} from "./schema/index";
export type {
  BooleanFieldDescriptor,
  DateFieldDescriptor,
  DiagnosticCode,
  DiagnosticIssue,
  EnumFieldDescriptor,
  FieldDescriptor,
  FieldKind,
  FieldWrappers,
  FilterKind,
  InterpretationResult,
  InterpretOptions,
  NumericFieldDescriptor,
  ResolvedFieldMeta,
  TableFieldMeta,
  TagsFieldDescriptor,
  TextFieldDescriptor,
} from "./schema/index";
export { DataTable, DEFAULT_PAGE_SIZES } from "./components/data-table";
export type { DataTableProps } from "./components/data-table";
export { createDefaultTableState } from "./lib/table-state";
export { DEFAULT_PAGE_SIZE, resolveDefaultPageSize } from "./lib/page-sizes";
export type { DataTableState } from "./lib/table-state";

export { DEFAULT_LABELS, resolveLabels } from "./table-labels";
export type { TableLabels } from "./table-labels";
export type {
  BooleanFilterValue,
  ColumnFilterValue,
  DateRangeFilterValue,
  EnumFilterValue,
  NumberRangeFilterValue,
  TagsFilterValue,
} from "./filters/filter-values.types";
export { composeTableSearchValidator } from "./url/compose-search-validator";
export type { ComposeTableSearchValidatorOptions } from "./url/compose-search-validator";
export { useDataTableUrlState } from "./hooks/use-data-table-url-state";
export type {
  UseDataTableUrlStateOptions,
  UseDataTableUrlStateResult,
} from "./hooks/use-data-table-url-state";
