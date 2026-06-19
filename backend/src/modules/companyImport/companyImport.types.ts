export interface ImportRowData {
  companyName: string;
  hrName?: string;
  hrEmail?: string;
  hrPhone?: string;
  description?: string;
  branch?: string;
}

export interface ValidationReport {
  totalRows: number;
  validRows: number;
  duplicateRows: number;
  missingEmail: number;
  invalidRows: number;
  validData: ValidatedRow[];
  invalidData: InvalidRow[];
}

export interface ValidatedRow extends ImportRowData {
  isValid: true;
}

export interface InvalidRow extends ImportRowData {
  isValid: false;
  errors: string[];
}

export interface ImportPreviewResponse {
  report: ValidationReport;
  fileName: string;
}
