import { z } from 'zod';

export const importRowSchema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  hrName: z.string().optional(),
  hrEmail: z.string().email("Invalid email format").optional().or(z.literal('')),
  hrPhone: z.string().optional(),
  description: z.string().optional()
});

export const confirmImportSchema = z.object({
  fileName: z.string(),
  rows: z.array(importRowSchema)
});

export const sheetImportSchema = z.object({
  sheetId: z.string().min(5, "Invalid Google Sheet ID"),
  tabName: z.string().optional()
});
