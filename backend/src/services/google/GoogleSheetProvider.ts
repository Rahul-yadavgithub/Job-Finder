import { google, sheets_v4 } from 'googleapis';
import Settings from '../../models/Settings';
import { ICompany } from '../../models/Company';
import HrContact from '../../models/HrContact';

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




  public async fetchInboundData(spreadsheetId: string, sheetTab: string): Promise<string[][]> {
    await this.initialize();
    if (!this.sheets) throw new Error('Google Sheets Auth not configured');
    if (!spreadsheetId) throw new Error('Spreadsheet ID is required');

    try {
      const res = await this.sheets.spreadsheets.values.get({
        spreadsheetId: spreadsheetId,
        range: `${sheetTab}!A:Z`,
      });
      return res.data.values || [];
    } catch (error) {
      console.error(`Failed to fetch inbound data for tab ${sheetTab}:`, error);
      return [];
    }
  }

  public async fetchFirstSheetData(spreadsheetId: string): Promise<string[][]> {
    await this.initialize();
    if (!this.sheets) throw new Error('Google Sheets Auth not configured');
    if (!spreadsheetId) throw new Error('Spreadsheet ID is required');

    try {
      const spreadsheet = await this.sheets.spreadsheets.get({ spreadsheetId });
      const sheets = spreadsheet.data.sheets || [];
      if (sheets.length === 0 || !sheets[0].properties?.title) {
        return [];
      }
      const firstSheetName = sheets[0].properties.title;

      const res = await this.sheets.spreadsheets.values.get({
        spreadsheetId: spreadsheetId,
        range: `${firstSheetName}!A:Z`,
      });
      return res.data.values || [];
    } catch (error) {
      console.error(`Failed to fetch first sheet data for ID ${spreadsheetId}:`, error);
      return [];
    }
  }

  public async appendDataToSheet(spreadsheetId: string, sheetTab: string, rows: any[][]): Promise<boolean> {
    await this.initialize();
    if (!this.sheets) throw new Error('Google Sheets Auth not configured');
    if (!spreadsheetId) throw new Error('Spreadsheet ID is required');

    try {
      await this.sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${sheetTab}!A:Z`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values: rows },
      });
      return true;
    } catch (error) {
      console.error(`Failed to append data to tab ${sheetTab}:`, error);
      return false;
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
