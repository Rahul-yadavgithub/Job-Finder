import { supabase } from '../config/supabase';

export async function createNotification(
  userId: string,
  type: 'contact_reminder' | 'new_interested' | 'company_rejected' | string,
  title: string,
  message: string,
  meta?: Record<string, unknown>
): Promise<void> {
  try {
    const { error } = await supabase.from('notifications').insert({
      user_id: userId,
      type,
      title,
      message,
      meta: meta || {}
    });

    if (error) {
      console.error(`[Notification] Failed to create notification for user ${userId}:`, error.message);
    }
  } catch (error: any) {
    console.error(`[Notification] Exception creating notification for user ${userId}:`, error.message || error);
  }
}
