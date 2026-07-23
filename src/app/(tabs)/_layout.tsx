import { Tabs, useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';

import { Platform, StyleSheet, View, Text } from 'react-native';
import { Home, Heart, CalendarDays, MessageCircle, User, PlusCircle } from 'lucide-react-native';
import { useThemeColor } from '../../hooks/useThemeColor';
import { useAuth } from '../../providers/AuthProvider';
import { chatService } from '../../services/chatService';
import { supabase } from '../../utils/supabase';
import Toast from 'react-native-toast-message';
import { useCustomAlert } from '../../providers/AlertProvider';
import { notificationService } from '../../services/notificationService';

/**
 * The bottom tab navigator layout for the main application screens.
 * Contains the custom styled tab bar with blur effects and floating action buttons.
 */
export default function TabLayout() {
  const { colors, isDark } = useThemeColor();
  const { profile } = useAuth();
  const isLandlord = profile?.role === 'landlord';
  const router = useRouter();
  const { showAlert } = useCustomAlert();
  
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!profile?.id) return;
    const fetchUnread = async () => {
      const count = await chatService.getUnreadMessagesCount(profile.id);
      setUnreadCount(count);
    };
    fetchUnread();
    
    // Fetch unread notifications on app load/reload to auto-pop the alert modal
    const fetchUnreadNotifications = async () => {
      try {
        const notifications = await notificationService.getNotifications(profile.id);
        const unread = notifications.filter(n => !n.is_read);
        if (unread.length > 0) {
          const latest = unread[0];
          showAlert(
            latest.title,
            latest.body,
            [
              {
                text: 'View All Alerts',
                onPress: () => {
                  router.push('/notifications');
                  notificationService.markAsRead(latest.id);
                }
              },
              {
                text: 'Dismiss',
                style: 'cancel',
                onPress: () => {
                  notificationService.markAsRead(latest.id);
                }
              }
            ]
          );
        }
      } catch (error) {
        console.warn('Failed to load notifications on app mount:', error);
      }
    };
    fetchUnreadNotifications();
    
    const channel = supabase.channel('unread_msgs_layout')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, fetchUnread)
      .subscribe();
      
    // Real-time subscription to notifications for in-app alert toasts and modals
    const notificationsChannel = supabase.channel('realtime_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${profile.id}`
        },
        (payload) => {
          const newNotification = payload.new as any;
          if (newNotification) {
            // Trigger the custom interactive alert dialog in the center of the screen
            showAlert(
              newNotification.title,
              newNotification.body,
              [
                {
                  text: 'View All Alerts',
                  onPress: () => {
                    router.push('/notifications');
                    notificationService.markAsRead(newNotification.id);
                  }
                },
                {
                  text: 'Dismiss',
                  style: 'cancel',
                  onPress: () => {
                    notificationService.markAsRead(newNotification.id);
                  }
                }
              ]
            );

            // Also show a brief banner toast at the top of the screen
            Toast.show({
              type: 'success',
              text1: newNotification.title,
              text2: newNotification.body,
              onPress: () => {
                router.push('/notifications');
                Toast.hide();
              }
            });
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(notificationsChannel);
    };
  }, [profile?.id]);
  
  return (
    <Tabs 
      screenOptions={{ 
        headerShown: false,
        tabBarActiveTintColor: '#006A4E',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarShowLabel: false,
        tabBarBackground: () => (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? '#111827' : '#FFFFFF', borderTopWidth: 1, borderTopColor: isDark ? '#374151' : '#F3F4F6' }]} />
        ),
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          elevation: 20,
          backgroundColor: 'transparent',
          height: Platform.OS === 'ios' ? 90 : 70,
          borderRadius: 0,
          borderTopWidth: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
        },
        tabBarItemStyle: {
          height: 70,
          justifyContent: 'center',
          alignItems: 'center',
        },
      }}
    >
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && { backgroundColor: isDark ? 'rgba(0, 168, 107, 0.2)' : '#E8F7F2' }]}>
              <Home size={24} color={color} strokeWidth={2} fill={focused ? color : 'transparent'} />
            </View>
          )
        }} 
      />
      <Tabs.Screen 
        name="saved" 
        options={{ 
          title: 'Saved',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && { backgroundColor: isDark ? 'rgba(0, 168, 107, 0.2)' : '#E8F7F2' }]}>
              <Heart size={24} color={color} strokeWidth={2} fill={focused ? color : 'transparent'} />
            </View>
          )
        }} 
      />
      <Tabs.Screen 
        name="post" 
        options={{ 
          title: 'Post',
          href: isLandlord ? '/post' : null,
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && { backgroundColor: isDark ? 'rgba(0, 168, 107, 0.2)' : '#E8F7F2' }]}>
              <PlusCircle size={24} color={color} strokeWidth={2} />
            </View>
          )
        }} 
      />
      <Tabs.Screen 
        name="inbox" 
        options={{ 
          title: 'Inbox',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && { backgroundColor: isDark ? 'rgba(0, 168, 107, 0.2)' : '#E8F7F2' }]}>
              <MessageCircle size={24} color={color} strokeWidth={2} />
              {unreadCount > 0 && (
                <View style={[styles.notificationBadge, { borderColor: isDark ? '#111827' : '#FFFFFF' }]}>
                  <Text style={styles.notificationText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              )}
            </View>
          )
        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && { backgroundColor: isDark ? 'rgba(0, 168, 107, 0.2)' : '#E8F7F2' }]}>
              <User size={24} color={color} strokeWidth={2} />
            </View>
          )
        }} 
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationText: {
    color: '#FFF',
    fontSize: 9,
    fontFamily: 'Outfit_700Bold',
  }
});

