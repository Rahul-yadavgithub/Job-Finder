import { Response } from 'express';
import { supabase } from '../../../config/supabase';
import { AuthRequest } from '../../../types/auth.types';

export const getNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('admin_notifications')
      .select('*')
      .eq('recipient_id', req.user!.userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    const { count: unreadCount, error: countError } = await supabase
      .from('admin_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', req.user!.userId)
      .eq('is_read', false);

    if (countError) throw countError;

    res.status(200).json({ 
      success: true, 
      data: {
        notifications: data,
        unreadCount: unreadCount || 0
      }
    });
  } catch (error) {
    console.error('getNotifications Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { notificationIds } = req.body;

    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      res.status(400).json({ success: false, message: 'notificationIds array is required' });
      return;
    }

    const { error } = await supabase
      .from('admin_notifications')
      .update({ is_read: true })
      .in('id', notificationIds)
      .eq('recipient_id', req.user!.userId);

    if (error) throw error;

    res.status(200).json({ success: true, message: 'Notifications marked as read' });
  } catch (error) {
    console.error('markAsRead Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const markAllAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { error } = await supabase
      .from('admin_notifications')
      .update({ is_read: true })
      .eq('recipient_id', req.user!.userId)
      .eq('is_read', false);

    if (error) throw error;

    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('markAllAsRead Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getUnreadCount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { count, error } = await supabase
      .from('admin_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', req.user!.userId)
      .eq('is_read', false);

    if (error) throw error;

    res.status(200).json({ success: true, count: count || 0 });
  } catch (error) {
    console.error('getUnreadCount Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
