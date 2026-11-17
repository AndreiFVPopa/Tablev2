export { TABLE_PACKAGE_VERSION, TABLE_PEER_DEPENDENCIES } from "./package-info";
export type { TablePeerDependency } from "./package-info";
export {
  DIAGNOSTIC_CODES,
  FIELD_KINDS,
  interpretSchema,
  SchemaInterpretationError,
  URL_VALUE_ENCODINGS,
  resolveOptionUrlEncoding,
  toUrlSlug,
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
  InterpretationResult,
  InterpretOptions,
  NumericFieldDescriptor,
  ResolvedFieldMeta,
  TableFieldMeta,
  TagsFieldDescriptor,
  TextFieldDescriptor,
  UrlValueEncoding,
  OptionUrlEncodingIssue,
} from "./schema/index";
export {
  decodeDescriptorOption,
  decodeOptionFromUrlToken,
  encodeDescriptorOption,
  encodeOptionToUrlToken,
} from "./url/option-encoding";
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
} from "./filters/shared/filter-values.types";
export { composeTableSearchValidator } from "./url/compose-search-validator";
export type { ComposeTableSearchValidatorOptions } from "./url/compose-search-validator";
export { SearchKeyCollisionError } from "./url/search-keys";
export type { SearchKeyCollision } from "./url/search-keys";
export { useDataTableUrlState } from "./hooks/use-data-table-url-state";
export type {
  UseDataTableUrlStateOptions,
  UseDataTableUrlStateResult,
} from "./hooks/use-data-table-url-state";
