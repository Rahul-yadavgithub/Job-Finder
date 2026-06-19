import { Request, Response } from 'express';
import { companyImportService } from './companyImport.service';
import { confirmImportSchema, sheetImportSchema } from './companyImport.validator';

export class CompanyImportController {
  
  public async uploadFile(req: Request, res: Response) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const rows = companyImportService.parseFileBuffer(req.file.buffer, req.file.originalname);
      const report = companyImportService.validateRows(rows);

      return res.status(200).json({
        success: true,
        data: {
          report,
          fileName: req.file.originalname
        }
      });
    } catch (error: any) {
      console.error('File Upload Error:', error);
      return res.status(500).json({ error: 'Failed to process file: ' + error.message });
    }
  }

  public async importFromSheet(req: Request, res: Response) {
    try {
      const parsed = sheetImportSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid Google Sheet ID' });
      }

      const { sheetId, tabName } = parsed.data;
      const rows = await companyImportService.parseGoogleSheet(sheetId, tabName);
      const report = companyImportService.validateRows(rows);

      return res.status(200).json({
        success: true,
        data: {
          report,
          fileName: `Google Sheet: ${sheetId}`
        }
      });
    } catch (error: any) {
      console.error('Google Sheet Import Error:', error);
      return res.status(500).json({ error: 'Failed to process Google Sheet: ' + error.message });
    }
  }

  public async confirmImport(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      if (!user || !user.branchId) {
        return res.status(401).json({ error: 'Unauthorized: Branch ID not found' });
      }

      const parsed = confirmImportSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'Invalid payload data' });
      }

      const { fileName, rows } = parsed.data;

      // Only import valid rows
      const validRows = rows.filter(r => r.companyName) as any[];

      const result = await companyImportService.confirmImport(
        user.userId, 
        user.branchId, 
        fileName, 
        validRows
      );

      return res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      console.error('Confirm Import Error:', error);
      return res.status(500).json({ error: 'Failed to confirm import: ' + error.message });
    }
  }

  public async getHistory(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      if (!user || !user.branchId) {
        return res.status(401).json({ error: 'Unauthorized: Branch ID not found' });
      }

      const history = await companyImportService.getImportHistory(user.branchId);
      return res.status(200).json({ success: true, data: history });
    } catch (error: any) {
      console.error('Import History Error:', error);
      return res.status(500).json({ error: 'Failed to fetch history: ' + error.message });
    }
  }
}

export const companyImportController = new CompanyImportController();
