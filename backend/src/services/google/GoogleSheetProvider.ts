import { google, sheets_v4 } from 'googleapis';
import Settings from '../../models/Settings';
import { ICompany } from '../../models/Company';

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

  public async appendCompany(company: ICompany): Promise<boolean> {
    try {
      await this.syncAllCompanies([company]);
      return true;
    } catch (error) {
      console.error('Error appending company to Google Sheet:', error);
      return false;
    }
  }

  public async testConnection(sheetId: string, worksheetName: string): Promise<{ success: boolean; error?: string }> {
    await this.initialize();
    if (!this.sheets) {
      return { success: false, error: 'Google Sheets Auth is not configured properly in .env' };
    }

    try {
      const spreadsheet = await this.sheets.spreadsheets.get({ spreadsheetId: sheetId });
      const sheets = spreadsheet.data.sheets || [];
      const sheetExists = sheets.some(s => s.properties?.title === worksheetName);
      
      if (!sheetExists) {
        return { success: false, error: `Worksheet "${worksheetName}" not found` };
      }

      const appendRes = await this.sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: `${worksheetName}!A:A`,
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

  public async syncAllCompanies(companies: ICompany[]): Promise<number> {
    await this.initialize();
    if (!this.sheets) throw new Error('Google Sheets Auth not configured');

    const settings = await Settings.findOne();
    if (!settings || !settings.googleSheetId) {
      throw new Error('Google Sheets not configured in Settings DB');
    }

    const sheetData = await this.sheets.spreadsheets.values.get({
      spreadsheetId: settings.googleSheetId,
      range: `${settings.targetWorksheet || 'Sheet1'}!A:Z`,
    });

    const rows = sheetData.data.values || [];
    if (rows.length === 0) {
      throw new Error('Google Sheet is empty or headers not found');
    }

    const headers = rows[0];
    const companyNameIdx = headers.findIndex((h: string) => h.trim() === 'Company Name');
    const roleIdx = headers.findIndex((h: string) => h.trim() === 'Role');

    if (companyNameIdx === -1 || roleIdx === -1) {
      throw new Error('Required headers "Company Name" and "Role" not found in the first row of the sheet');
    }

    const existingSet = new Set<string>();
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const compName = row[companyNameIdx]?.trim() || '';
      const role = row[roleIdx]?.trim() || '';
      if (compName && role) {
        existingSet.add(`${compName.toLowerCase()}:${role.toLowerCase()}`);
      }
    }

    const valuesToAppend: string[][] = [];
    const maxIdx = Math.max(companyNameIdx, roleIdx);
    let appendedCount = 0;

    for (const company of companies) {
      const companyName = company.companyName.trim();
      let rawRoles = company.hiringType || 'General Application';
      
      const roles = rawRoles.split(/[,;\n]+/).map(r => r.trim()).filter(r => r);
      if (roles.length === 0) roles.push('General Application');

      for (const role of roles) {
        const key = `${companyName.toLowerCase()}:${role.toLowerCase()}`;
        if (!existingSet.has(key)) {
          const newRow = new Array(maxIdx + 1).fill('');
          newRow[companyNameIdx] = companyName;
          newRow[roleIdx] = role;
          valuesToAppend.push(newRow);
          existingSet.add(key); 
          appendedCount++;
        }
      }
    }

    if (valuesToAppend.length > 0) {
      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const lastColLetter = alphabet[maxIdx] || 'Z';
      const range = `${settings.targetWorksheet || 'Sheet1'}!A:${lastColLetter}`;

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: settings.googleSheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: valuesToAppend },
      });
    }

    return appendedCount;
  }
}

export const googleSheetService = new GoogleSheetProvider();
