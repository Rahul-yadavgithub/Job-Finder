import mongoose from 'mongoose';
import { supabase } from '../config/supabase';
import BranchNotification from '../models/BranchNotification';
import { getIO } from '../config/socket';

/**
 * Send a notification to a specific Base TPR branch in MongoDB
 */
export const notifyBranch = async (
  branchId: string, 
  title: string, 
  message: string, 
  type: 'info' | 'warning' | 'error' = 'info',
  metadata?: any
) => {
  try {
    const notification = new BranchNotification({
      branchId,
      type,
      message: `${title}: ${message}`,
      metadata
    });
    await notification.save();

    try {
      getIO().to(`branch:${branchId}`).emit('new_notification', {
        id: notification._id,
        title,
        message,
        type,
        created_at: notification.createdAt
      });
    } catch (e) {
      console.error('Socket emit failed:', e);
    }

    return true;
  } catch (error) {
    console.error('Failed to send branch notification:', error);
    return false;
  }
};

/**
 * Send a notification to all users with a specific role via Supabase
 */
export const notifyRole = async (
  role: 'communication_tpr' | 'head' | 'staff' | 'admin',
  title: string,
  message: string,
  actionUrl?: string,
  category: 'company' | 'worker' | 'request' | 'system' = 'system'
) => {
  try {
    // 1. Get all users with the role
    const { data: users, error: userError } = await supabase
      .from('admin_users')
      .select('id')
      .eq('role', role);

    if (userError || !users || users.length === 0) {
      console.log(`No users found for role ${role} to notify`);
      return false;
    }

    // 2. Prepare notifications array
    const notifications = users.map(user => ({
      recipient_id: user.id,
      title,
      message,
      action_url: actionUrl,
      notification_category: category,
      type: 'info',
      is_read: false
    }));

    // 3. Bulk insert
    const { error: insertError } = await supabase
      .from('admin_notifications')
      .insert(notifications);

    if (insertError) throw insertError;

    try {
      getIO().to(`role:${role}`).emit('new_notification', {
        title,
        message,
        type: 'info',
        action_url: actionUrl,
        notification_category: category,
        created_at: new Date().toISOString()
      });
    } catch (e) {
      console.error('Socket emit failed:', e);
    }

    return true;
  } catch (error) {
    console.error('Failed to notify role:', error);
    return false;
  }
};

/**
 * Send a notification to a specific admin/staff user via Supabase
 */
export const notifyUser = async (
  userId: string,
  title: string,
  message: string,
  actionUrl?: string,
  category: 'company' | 'worker' | 'request' | 'system' = 'system'
) => {
  try {
    const { error } = await supabase
      .from('admin_notifications')
      .insert({
        recipient_id: userId,
        title,
        message,
        action_url: actionUrl,
        notification_category: category,
        type: 'info',
        is_read: false
      });

    if (error) throw error;

    try {
      getIO().to(`user:${userId}`).emit('new_notification', {
        title,
        message,
        type: 'info',
        action_url: actionUrl,
        notification_category: category,
        created_at: new Date().toISOString()
      });
    } catch (e) {
      console.error('Socket emit failed:', e);
    }

    return true;
  } catch (error) {
    console.error('Failed to notify user:', error);
    return false;
  }
};
