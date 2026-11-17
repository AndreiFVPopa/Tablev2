import type { DiagnosticCode } from "./diagnostic-codes.constants";

export interface OptionUrlEncodingIssue {
  readonly code: DiagnosticCode;
  readonly message: string;
  readonly hint: string;
}
