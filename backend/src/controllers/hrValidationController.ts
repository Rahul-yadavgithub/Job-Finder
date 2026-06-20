import { Request, Response } from 'express';
import Company from '../models/Company';
import HrContact from '../models/HrContact';
import BranchApiKey from '../models/BranchApiKey';
import { supabase } from '../config/supabase';
import { ApiKeyRotatorService } from '../services/api-key-rotator.service';
import { EnrichmentService } from '../services/enrichment.service';

export const hrValidationController = {
  
  findHrContact: async (req: Request, res: Response) => {
    try {
      const { company_id } = req.params;

      const { data: company, error } = await supabase
        .from('companies')
        .select('id, company_name, branch_id')
        .eq('id', company_id)
        .single();

      if (error || !company) {
        return res.status(404).json({ success: false, message: 'Company not found' });
      }

      if (!company.branch_id) {
        return res.status(400).json({ success: false, message: 'Company is not assigned to a branch' });
      }

      const branchIdStr = company.branch_id;

      // Enforce zero keys check (Requirement #2)
      const activeKeysCount = await BranchApiKey.countDocuments({ branchId: branchIdStr, status: 'active' });
      console.log('findHrContact -> company.branch_id:', branchIdStr, 'activeKeysCount:', activeKeysCount);
      
      if (activeKeysCount === 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'No active API keys configured. Please add an Apollo, Hunter, Snov, or Lusha key before validating contacts.',
          errorType: 'NO_ACTIVE_KEYS'
        });
      }

      // Waterfall execution via Service with previewOnly: true
      const result = await EnrichmentService.executeFindHr(company.id, branchIdStr, company.company_name, true);

      if (result) {
        // Since previewOnly is true, result is the HRResult object
        return res.status(200).json({
          success: true,
          status: 'found_preview',
          contact: result
        });
      }

      // If we exit the loop with no contacts, queue it
      await ApiKeyRotatorService.queueRequest(branchIdStr, company.id, 'find_hr', {});

      return res.status(200).json({
        success: true,
        status: 'queued',
        message: 'No immediate result found. Request queued for background processing.'
      });

    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  getHrContact: async (req: Request, res: Response) => {
    try {
      const { company_id } = req.params;
      const contact = await HrContact.findOne({ company_id });
      res.status(200).json({ success: true, contact });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  commitHrContact: async (req: Request, res: Response) => {
    try {
      const { company_id } = req.params;
      const { name, email, mobile, designation, linkedin_url } = req.body;

      const { data: company, error } = await supabase
        .from('companies')
        .select('id')
        .eq('id', company_id)
        .single();

      if (error || !company) {
        return res.status(404).json({ success: false, message: 'Company not found' });
      }

      const existingContact = await HrContact.findOne({ company_id });
      let historyItem = null;

      if (existingContact && (existingContact.name || existingContact.email || existingContact.mobile || existingContact.designation)) {
        historyItem = {
          name: existingContact.name,
          email: existingContact.email,
          mobile: existingContact.mobile,
          designation: existingContact.designation,
          linkedin_url: existingContact.linkedin_url,
          replaced_at: new Date()
        };
      }

      const updateData: any = {
        name,
        email,
        mobile,
        designation,
        linkedin_url,
        is_auto_updated: true,
        auto_updated_at: new Date()
      };

      let updatedContact;
      if (existingContact) {
        if (historyItem) {
          updateData.$push = { history: historyItem };
        }
        updatedContact = await HrContact.findByIdAndUpdate(
          existingContact._id,
          updateData,
          { new: true }
        );
      } else {
        updatedContact = await HrContact.create({
          company_id: company.id,
          ...updateData
        });
      }

      // Also update Supabase companies table so the UI reflects the new contact info
      await supabase
        .from('companies')
        .update({
          hr_name: name || null,
          email: email || null,
          phone_number: mobile || null
        })
        .eq('id', company.id);

      res.status(200).json({
        success: true,
        message: 'HR Contact committed successfully',
        contact: updatedContact
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  acknowledgeHrUpdate: async (req: Request, res: Response) => {
    try {
      const { company_id } = req.params;
      const contact = await HrContact.findOne({ company_id });
      
      if (!contact) {
        return res.status(404).json({ success: false, message: 'HR Contact not found' });
      }

      contact.is_auto_updated = false;
      await contact.save();

      res.status(200).json({ success: true, message: 'Update acknowledged' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  approvePendingContact: async (req: Request, res: Response) => {
    try {
      const { company_id } = req.params;
      const existingContact = await HrContact.findOne({ company_id });
      
      if (!existingContact || !existingContact.pending_update) {
        return res.status(404).json({ success: false, message: 'No pending update found' });
      }

      let historyItem = null;
      if (existingContact.name || existingContact.email || existingContact.mobile || existingContact.designation) {
        historyItem = {
          name: existingContact.name,
          email: existingContact.email,
          mobile: existingContact.mobile,
          designation: existingContact.designation,
          linkedin_url: existingContact.linkedin_url,
          replaced_at: new Date()
        };
      }

      const pendingData = existingContact.pending_update;

      const updateData: any = {
        name: pendingData.name,
        email: pendingData.email,
        mobile: pendingData.mobile,
        designation: pendingData.designation,
        linkedin_url: pendingData.linkedin_url,
        pending_update: null,
        last_check_status: 'no_changes',
        is_auto_updated: true,
        auto_updated_at: new Date()
      };

      if (historyItem) {
        updateData.$push = { history: historyItem };
      }

      const updatedContact = await HrContact.findByIdAndUpdate(
        existingContact._id,
        updateData,
        { new: true }
      );

      res.status(200).json({ success: true, contact: updatedContact });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  discardPendingContact: async (req: Request, res: Response) => {
    try {
      const { company_id } = req.params;
      
      const updatedContact = await HrContact.findOneAndUpdate(
        { company_id },
        { 
          pending_update: null,
          last_check_status: 'no_changes' 
        },
        { new: true }
      );

      res.status(200).json({ success: true, contact: updatedContact });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

};
