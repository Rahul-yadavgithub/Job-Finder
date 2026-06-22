import { Response } from 'express';
import { supabase } from '../config/supabase';
import { AdminRequest } from '../types/admin.types';

export const getNotifications = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', req.admin!.userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    // Map new notifications format to what the frontend expects
    const formattedData = data?.map(n => ({
      ...n,
      action_url: n.meta?.actionUrl || null,
      notification_category: n.meta?.category || 'system'
    }));

    const { count: unreadCount, error: countError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.admin!.userId)
      .eq('is_read', false);

    if (countError) throw countError;

    res.status(200).json({ 
      success: true, 
      data: {
        notifications: formattedData,
        unreadCount: unreadCount || 0
      }
    });
  } catch (error) {
    console.error('getNotifications Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const markAsRead = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { notificationIds } = req.body;

    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      res.status(400).json({ success: false, message: 'notificationIds array is required' });
      return;
    }

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .in('id', notificationIds)
      .eq('user_id', req.admin!.userId);

    if (error) throw error;

    res.status(200).json({ success: true, message: 'Notifications marked as read' });
  } catch (error) {
    console.error('markAsRead Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const markAllAsRead = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', req.admin!.userId)
      .eq('is_read', false);

    if (error) throw error;

    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('markAllAsRead Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getUnreadCount = async (req: AdminRequest, res: Response): Promise<void> => {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.admin!.userId)
      .eq('is_read', false);

    if (error) throw error;

    res.status(200).json({ success: true, count: count || 0 });
  } catch (error) {
    console.error('getUnreadCount Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
