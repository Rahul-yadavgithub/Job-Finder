import { google, sheets_v4 } from 'googleapis';
import Settings from '../../models/Settings';
import { ICompany } from '../../models/Company';
import HrContact from '../../models/HrContact';
import ContactLog from '../../models/ContactLog';

export class GoogleSheetProvider {
  private sheets: sheets_v4.Sheets | null = null;
  private isInitialized = false;

  private async initialize() {
    if (this.isInitialized) return;

    try {
      const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
      const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

      if (!clientEmail || !privateKey || clientEmail.includes('placeholder')) {
        console.warn('Google Sheets not properly configured in .env. Skipping initialization.');
        return;
      }

      const auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: clientEmail,
          private_key: privateKey,
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      this.sheets = google.sheets({ version: 'v4', auth });
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Google Sheets Auth:', error);
    }
  }



  public async testConnection(sheetId: string): Promise<{ success: boolean; error?: string }> {
    await this.initialize();
    if (!this.sheets) {
      return { success: false, error: 'Google Sheets Auth is not configured properly in .env' };
    }

    try {
      const spreadsheet = await this.sheets.spreadsheets.get({ spreadsheetId: sheetId });
      const sheets = spreadsheet.data.sheets || [];
      if (sheets.length === 0 || !sheets[0].properties?.title) {
        return { success: false, error: 'No worksheets found in the spreadsheet' };
      }
      
      const firstSheetName = sheets[0].properties.title;

      const appendRes = await this.sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: `${firstSheetName}!A:A`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [['__jobfinder_test_row__']] },
      });

      const updatedRange = appendRes.data.updates?.updatedRange;
      if (updatedRange) {
        await this.sheets.spreadsheets.values.clear({
          spreadsheetId: sheetId,
          range: updatedRange,
        });
      }

      return { success: true };
    } catch (error: any) {
      console.error('Google Sheets Test Error:', error.message);
      if (error.code === 403) return { success: false, error: 'Service account does not have Editor permission' };
      if (error.code === 404) return { success: false, error: 'Invalid Sheet ID or Sheet is inaccessible' };
      return { success: false, error: error.message || 'Failed to verify connection' };
    }
  }



  public async appendCompaniesToSheet(
    companies: ICompany[],
    branchName: string
  ): Promise<{ success: boolean }> {
    await this.initialize();
    if (!this.sheets) throw new Error('Google Sheets Auth not configured');

    const settings = await Settings.findOne();
    if (!settings) throw new Error('Settings not configured in DB');

    const now = new Date();
    const currentYear = now.getFullYear();
    let currentAcademicYear = '';
    if (now.getMonth() < 5) { // Jan-May
      currentAcademicYear = `${currentYear - 1}-${currentYear}`;
    } else { // Jun-Dec
      currentAcademicYear = `${currentYear}-${currentYear + 1}`;
    }

    const currentCompanies: ICompany[] = [];
    const pastCompanies: ICompany[] = [];

    for (const company of companies) {
      if (!company.academic_year || company.academic_year === currentAcademicYear) {
        currentCompanies.push(company);
      } else {
        pastCompanies.push(company);
      }
    }

    const syncBatch = async (batch: ICompany[], sheetId: string) => {
      if (batch.length === 0) return;
      if (!sheetId) throw new Error(`Target Google Sheet ID is missing.`);

      // 1. Fetch existing rows to map locations
      const existingRows = await this.fetchInboundData(sheetId, branchName);
      const companyRowMap = new Map<string, number>();
      const duplicateRowIndices: { rowIndex: number, companyId: string }[] = [];
      
      for (let i = 0; i < existingRows.length; i++) {
        const row = existingRows[i];
        if (i === 0 && row[0]?.toLowerCase().includes('company')) continue;
        
        const companyName = row[0]?.trim();
        const hiddenId = row[7]?.trim();
        let matchKey = hiddenId;
        if (!matchKey) matchKey = companyName?.toLowerCase().replace(/[^a-z0-9]/g, '');
        
        if (!matchKey) continue;
        
        if (companyRowMap.has(matchKey)) {
          duplicateRowIndices.push({ rowIndex: i, companyId: matchKey });
        } else {
          companyRowMap.set(matchKey, i);
        }
      }

      const valuesToAppend: string[][] = [];
      const updates: { range: string, values: string[][] }[] = [];

      // 2. Prepare Updates and Appends for the synced batch
      for (const company of batch) {
        const hrContact = await HrContact.findOne({ company_id: company._id });
        const lastLog = await ContactLog.findOne({ company_id: company._id }).sort({ contact_date: -1 });

        let statusText = '';
        if (company.contact_outcome === 'rejected') statusText = 'REJECTED';
        else if (company.contact_outcome === 'accepted' || company.confirmation_status === 'confirmed') statusText = 'ACCEPTED';
        else if (company.contact_outcome === 'call_again') statusText = 'CALL AGAIN';

        let nextCallText = '';
        if (company.nextFollowupDate) {
          const d = company.nextFollowupDate;
          nextCallText = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
        }
        
        const rowData = [
          company.companyName,
          hrContact?.name || '',
          hrContact?.mobile || '',
          hrContact?.email || '',
          statusText,
          nextCallText,
          lastLog?.notes || company.notes || '',
          company._id.toString()
        ];

        const hiddenIdStr = company._id.toString();
        const normalizedName = company.companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
        
        const existingRowIndex = companyRowMap.has(hiddenIdStr) 
          ? companyRowMap.get(hiddenIdStr) 
          : companyRowMap.get(normalizedName);

        if (existingRowIndex !== undefined) {
          // Update the first occurrence (1-based index in sheets)
          updates.push({
            range: `${branchName}!A${existingRowIndex + 1}:H${existingRowIndex + 1}`,
            values: [rowData]
          });
        } else {
          // Append entirely new company
          valuesToAppend.push(rowData);
        }
      }

      // 3. Mark duplicate rows in the sheet with a red warning
      for (const dup of duplicateRowIndices) {
         const existingDescription = existingRows[dup.rowIndex][6] || '';
         if (!existingDescription.includes('🔴 DUPLICATE')) {
           updates.push({
             range: `${branchName}!G${dup.rowIndex + 1}`,
             values: [[`🔴 DUPLICATE PLEASE DELETE - ${existingDescription}`]]
           });
         }
      }

      // 4. Execute updates using batchUpdate
      if (updates.length > 0) {
        await this.sheets!.spreadsheets.values.batchUpdate({
          spreadsheetId: sheetId,
          requestBody: {
            valueInputOption: 'USER_ENTERED',
            data: updates
          }
        });
      }

      // 5. Execute appends
      if (valuesToAppend.length > 0) {
        await this.sheets!.spreadsheets.values.append({
          spreadsheetId: sheetId,
          range: `${branchName}!A:H`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: valuesToAppend },
        });
      }
    };

    try {
      await syncBatch(currentCompanies, settings.currentAcademicYearSheetId);
      await syncBatch(pastCompanies, settings.pastAcademicYearSheetId);

      return { success: true };
    } catch (error) {
      console.error('Failed to append companies to sheet:', error);
      throw error;
    }
  }

  public async fetchInboundData(spreadsheetId: string, sheetTab: string): Promise<string[][]> {
    await this.initialize();
    if (!this.sheets) throw new Error('Google Sheets Auth not configured');
    if (!spreadsheetId) throw new Error('Spreadsheet ID is required');

    try {
      const res = await this.sheets.spreadsheets.values.get({
        spreadsheetId: spreadsheetId,
        range: `${sheetTab}!A:H`,
      });
      return res.data.values || [];
    } catch (error) {
      console.error(`Failed to fetch inbound data for tab ${sheetTab}:`, error);
      return [];
    }
  }

  public async deleteRows(spreadsheetId: string, sheetTab: string, rowRefs: string[]): Promise<boolean> {
    await this.initialize();
    if (!this.sheets) throw new Error('Google Sheets Auth not configured');

    try {
      const spreadsheet = await this.sheets.spreadsheets.get({ spreadsheetId });
      const sheet = spreadsheet.data.sheets?.find(s => s.properties?.title === sheetTab);
      
      if (!sheet || sheet.properties?.sheetId === undefined) {
        throw new Error(`Sheet tab ${sheetTab} not found`);
      }

      const sheetId = sheet.properties.sheetId;

      const sortedRows = rowRefs.map(r => parseInt(r, 10)).filter(r => !isNaN(r)).sort((a, b) => b - a);
      if (sortedRows.length === 0) return true;

      const requests: sheets_v4.Schema$Request[] = sortedRows.map(rowIdx => ({
        deleteDimension: {
          range: {
            sheetId,
            dimension: 'ROWS',
            startIndex: rowIdx - 1, // 0-indexed in API
            endIndex: rowIdx
          }
        }
      }));

      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: { requests }
      });

      return true;
    } catch (error) {
      console.error(`Failed to delete rows in tab ${sheetTab}:`, error);
      throw error;
    }
  }
}

export const googleSheetService = new GoogleSheetProvider();
