import * as xlsx from 'xlsx';
import { supabase } from '../../config/supabase';
import { googleSheetService } from '../../services/google/GoogleSheetProvider';
import { ImportRowData, ValidationReport, ValidatedRow, InvalidRow } from './companyImport.types';
import { importRowSchema } from './companyImport.validator';

export class CompanyImportService {
  /**
   * Parses Excel or CSV Buffer into raw JSON objects
   */
  public parseFileBuffer(buffer: Buffer, fileName: string): ImportRowData[] {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // We expect headers like 'Company Name', 'HR Name', 'HR Email', 'HR Phone', 'Description'
    const rawData = xlsx.utils.sheet_to_json<any>(worksheet, { defval: '' });
    
    return rawData.map(row => this.mapRawRow(row));
  }

  /**
   * Fetches data from Google Sheet and parses it
   */
  public async parseGoogleSheet(sheetId: string): Promise<ImportRowData[]> {
    const rawData = await googleSheetService.fetchFirstSheetData(sheetId);
    if (!rawData || rawData.length <= 1) return [];

    const headers = rawData[0].map(h => h.trim().toLowerCase());
    const rows = rawData.slice(1);

    return rows.map(rowArray => {
      const rowObj: any = {};
      headers.forEach((header, index) => {
        rowObj[header] = rowArray[index] || '';
      });
      return this.mapRawRow(rowObj);
    });
  }

  /**
   * Maps varying header names to our standard ImportRowData interface
   */
  private mapRawRow(row: any): ImportRowData {
    // Normalization logic for header names
    const getVal = (keys: string[]) => {
      const key = Object.keys(row).find(k => keys.includes(k.trim().toLowerCase()));
      return key ? String(row[key]).trim() : undefined;
    };

    return {
      companyName: getVal(['company name', 'company', 'name']) || '',
      hrName: getVal(['hr name', 'contact name', 'contact person']),
      hrEmail: getVal(['hr email', 'email', 'contact email']),
      hrPhone: getVal(['hr phone', 'phone', 'contact number', 'mobile']),
      description: getVal(['description', 'notes', 'remarks']),
      branch: getVal(['branch', 'department']),
    };
  }

  /**
   * Validates parsed rows
   */
  public validateRows(rows: ImportRowData[]): ValidationReport {
    const report: ValidationReport = {
      totalRows: rows.length,
      validRows: 0,
      duplicateRows: 0, // Duplicate checking inside file
      missingEmail: 0,
      invalidRows: 0,
      validData: [],
      invalidData: []
    };

    const seenCompanies = new Set<string>();

    for (const row of rows) {
      if (!row.companyName) {
        continue; // Skip entirely empty rows
      }

      // Check duplicates inside the file itself (basic check by name)
      const normalizedName = row.companyName.toLowerCase().trim();
      if (seenCompanies.has(normalizedName)) {
        report.duplicateRows++;
        report.invalidRows++;
        report.invalidData.push({ ...row, isValid: false, errors: ['Duplicate company name in file'] });
        continue;
      }
      seenCompanies.add(normalizedName);

      if (!row.hrEmail) {
        report.missingEmail++;
      }

      const result = importRowSchema.safeParse(row);
      
      if (result.success) {
        report.validRows++;
        report.validData.push({ ...row, isValid: true });
      } else {
        report.invalidRows++;
        report.invalidData.push({ 
          ...row, 
          isValid: false, 
          errors: result.error.issues.map((e: any) => e.message) 
        });
      }
    }

    // Recalculate total relevant rows
    report.totalRows = report.validRows + report.invalidRows;

    return report;
  }

  /**
   * Inserts validated rows into Supabase using the insert_company_safe RPC
   */
  public async confirmImport(
    userId: string, 
    branchId: string, 
    fileName: string, 
    rows: ValidatedRow[]
  ): Promise<{ jobId: string, imported: number, duplicates: number, failed: number }> {
    
    let imported = 0;
    let duplicates = 0;
    let failed = 0;
    const errorDetails: any[] = [];

    // Create import job record first
    const { data: jobData, error: jobError } = await supabase
      .from('import_jobs')
      .insert({
        uploaded_by: userId,
        branch_id: branchId,
        file_name: fileName,
        total_rows: rows.length,
        status: 'processing'
      })
      .select('id')
      .single();

    if (jobError || !jobData) {
      throw new Error('Failed to create import job record: ' + (jobError?.message || 'Unknown error'));
    }

    const jobId = jobData.id;

    // Process rows sequentially or in small batches
    // RPC handles duplicate checking cleanly
    for (const row of rows) {
      try {
        const { data: result, error: rpcError } = await supabase.rpc('insert_company_safe', {
          p_company_name: row.companyName,
          p_branch_id: branchId,
          p_hr_name: row.hrName || null,
          p_email: row.hrEmail || null,
          p_phone_number: row.hrPhone || null,
          p_description: row.description || null,
          p_data: {} // Empty JSONB for now since we mapped specific fields
        });

        if (rpcError) {
          failed++;
          errorDetails.push({ company: row.companyName, error: rpcError.message });
          continue;
        }

        if (result && result.is_duplicate) {
          duplicates++;
        } else {
          imported++;
        }
      } catch (err: any) {
        failed++;
        errorDetails.push({ company: row.companyName, error: err.message });
      }
    }

    // Finalize import job status
    await supabase
      .from('import_jobs')
      .update({
        imported_rows: imported,
        duplicate_rows: duplicates,
        failed_rows: failed,
        status: failed > 0 ? 'completed_with_errors' : 'completed',
        error_details: errorDetails.length > 0 ? errorDetails : null,
        completed_at: new Date().toISOString()
      })
      .eq('id', jobId);

    return { jobId, imported, duplicates, failed };
  }

  /**
   * Retrieves past import jobs for a branch
   */
  public async getImportHistory(branchId: string) {
    const { data, error } = await supabase
      .from('import_jobs')
      .select('*, users!import_jobs_uploaded_by_fkey(name)')
      .eq('branch_id', branchId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data;
  }

  /**
   * Syncs the Master Google Sheets into Supabase
   */
  public async syncMasterSheets(): Promise<{ syncedCount: number, duplicates: number, errors: number, errorDetails: string[], headers?: string[] }> {
    const Settings = (await import('../../models/Settings')).default;
    const settings = await Settings.findOne();
    
    if (!settings) {
      throw new Error('Settings not configured');
    }

    const sheetsToSync = [];
    if (settings.currentAcademicYearSheetId) sheetsToSync.push(settings.currentAcademicYearSheetId);
    // As per request, we only sync the current year sheet for now.
    // if (settings.pastAcademicYearSheetId) sheetsToSync.push(settings.pastAcademicYearSheetId);

    if (sheetsToSync.length === 0) {
      throw new Error('No Google Sheets configured in settings');
    }

    // Fetch branches from Supabase to map names to UUIDs
    const { data: branches, error: branchError } = await supabase.from('branches').select('id, code, name');
    if (branchError || !branches) {
      throw new Error('Failed to fetch branches from database');
    }

    // Create a map like { 'CSE': 'uuid', 'ECE': 'uuid' }
    const branchMap = new Map<string, string>();
    branches.forEach(b => {
      branchMap.set(b.code.toUpperCase(), b.id);
      branchMap.set(b.name.toUpperCase(), b.id);
    });

    let totalSynced = 0;
    let totalDuplicates = 0;
    let totalErrors = 0;
    const errorDetails: string[] = [];
    let detectedHeaders: string[] = [];

    for (const sheetId of sheetsToSync) {
      try {
        await (googleSheetService as any).initialize();
        const spreadsheet = await (googleSheetService as any).sheets?.spreadsheets.get({ spreadsheetId: sheetId });
        if (!spreadsheet) throw new Error('Could not access spreadsheet');
        
        const tabs = spreadsheet.data.sheets.map((s: any) => s.properties.title);
        console.log(`Tabs found in sheet ${sheetId}:`, tabs);

        for (const tabName of tabs) {
          // Identify Branch UUID from tabName
          const rawBranch = tabName.toUpperCase().trim();
          const branchId = branchMap.get(rawBranch);

          if (!branchId) {
            console.log(`Skipping tab ${tabName} because it doesn't match any branch.`);
            continue;
          }

          // Now parse data specifically for this branch tab
          const rawData = await googleSheetService.fetchInboundData(sheetId, tabName);
          if (!rawData || rawData.length <= 1) continue;
          
          if (detectedHeaders.length === 0) detectedHeaders = rawData[0].map((h: string) => h.trim().toLowerCase());

          const headers = rawData[0].map((h: string) => h.trim().toLowerCase());
          const getVal = (rowArray: any[], keys: string[]) => {
            const index = headers.findIndex((h: string) => keys.includes(h));
            return index >= 0 && rowArray[index] ? String(rowArray[index]).trim() : undefined;
          };

          const validRows = rawData.slice(1).filter((r: any) => getVal(r, ['company name', 'company', 'name']));

          const batchPromises = validRows.map(async (rowArray: any) => {
            const companyName = getVal(rowArray, ['company name', 'company', 'name']) || '';
            if (!companyName) return null;

            const hrName = getVal(rowArray, ['hr name', 'contact name', 'contact person', 'hr / recruiter name']);
            const hrEmail = getVal(rowArray, ['hr email', 'email', 'contact email', 'hr / recruiter email id']);
            const hrPhone = getVal(rowArray, ['hr phone', 'phone', 'contact number', 'mobile', 'hr /  recruiter phone no.']);
            const description = getVal(rowArray, ['description', 'notes', 'remarks']);

            const { data: result, error: rpcError } = await supabase.rpc('insert_company_safe', {
              p_company_name: companyName,
              p_branch_id: branchId,
              p_hr_name: hrName || null,
              p_email: hrEmail || null,
              p_phone_number: hrPhone || null,
              p_description: description || null,
              p_data: {} 
            });

            return { companyName, result, rpcError };
          });

          const batchResults = await Promise.all(batchPromises);

          for (const res of batchResults) {
            if (!res) continue;
            if (res.rpcError) {
              const msg = `Tab ${tabName} - Row ${res.companyName} RPC error: ${res.rpcError.message}`;
              console.error(msg);
              errorDetails.push(msg);
              totalErrors++;
            } else if (res.result && res.result.is_duplicate) {
              totalDuplicates++;
            } else {
              totalSynced++;
            }
          }
        }
      } catch (e: any) {
        console.error(`Failed to sync sheet ${sheetId}:`, e.message);
        throw new Error(`Failed to process sheet ${sheetId}: ${e.message}`);
      }
    }

    // Update settings
    settings.lastSyncDate = new Date();
    settings.totalSynced = (settings.totalSynced || 0) + totalSynced;
    await settings.save();

    return { syncedCount: totalSynced, duplicates: totalDuplicates, errors: totalErrors, errorDetails, headers: detectedHeaders };
  }
}

export const companyImportService = new CompanyImportService();
