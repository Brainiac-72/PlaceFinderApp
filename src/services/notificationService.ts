import { supabase } from '../utils/supabase';

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: 'info' | 'success' | 'warning' | 'error';
  data: any;
  is_read: boolean;
  created_at: string;
};

/**
 * Service object for handling user notifications.
 * Connects to the 'notifications' table to fetch, update, and manage read states.
 */

let DUMMY_NOTIFICATIONS: Notification[] = [
  {
    id: 'dummy_1',
    user_id: '',
    title: 'Welcome to Premium',
    body: 'Your concierge service is now active. Explore exclusive properties today.',
    type: 'success',
    data: {},
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString()
  },
  {
    id: 'dummy_2',
    user_id: '',
    title: 'New Message',
    body: 'You have a new message from the landlord regarding your inquiry.',
    type: 'info',
    data: {},
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
  },
  {
    id: 'dummy_3',
    user_id: '',
    title: 'Booking Confirmed',
    body: 'Your viewing appointment is confirmed for tomorrow at 10 AM.',
    type: 'success',
    data: {},
    is_read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
  }
];

export const notificationService = {
  async getNotifications(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Notifications table missing or error, using dummy data:', error.message);
      return DUMMY_NOTIFICATIONS.map(n => ({ ...n, user_id: userId }));
    }
    
    return data || [];
  },

  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) {
      DUMMY_NOTIFICATIONS = DUMMY_NOTIFICATIONS.map(n => n.id === notificationId ? { ...n, is_read: true } : n);
      return;
    }
  },

  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      DUMMY_NOTIFICATIONS = DUMMY_NOTIFICATIONS.map(n => ({ ...n, is_read: true }));
      return;
    }
  },

  async deleteNotification(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      DUMMY_NOTIFICATIONS = DUMMY_NOTIFICATIONS.filter(n => n.id !== notificationId);
      return;
    }
  },

  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      return DUMMY_NOTIFICATIONS.filter(n => !n.is_read).length;
    }
    
    return count || 0;
  }
};
