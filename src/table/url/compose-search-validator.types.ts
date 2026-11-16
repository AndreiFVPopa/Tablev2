export interface ComposeTableSearchValidatorOptions {
  readonly urlNamespace?: string;
  readonly defaultPageSize?: number;
  readonly pageSizes?: readonly number[];
  readonly extend?: (extras: Record<string, unknown>) => Record<string, unknown>;
}
