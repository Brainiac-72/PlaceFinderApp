import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, StatusBar, Platform, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../providers/AuthProvider';
import { notificationService, Notification } from '../services/notificationService';
import { useThemeColor } from '../hooks/useThemeColor';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeOutRight } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

export default function NotificationsScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const { colors, isDark } = useThemeColor();
  const insets = useSafeAreaInsets();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async (showLoading = true) => {
    if (!session?.user) return;
    if (showLoading) setLoading(true);
    try {
      const data = await notificationService.getNotifications(session.user.id);
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [fetchNotifications])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications(false);
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    if (!session?.user) return;
    try {
      await notificationService.markAllAsRead(session.user.id);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getIconName = (type: string): any => {
    switch (type) {
      case 'success': return 'checkmark-circle';
      case 'warning': return 'warning';
      case 'error': return 'alert-circle';
      case 'booking': return 'calendar';
      default: return 'notifications';
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'success': return '#34C759';
      case 'warning': return '#FF9500';
      case 'error': return '#FF3B30';
      case 'booking': return colors.primary;
      default: return colors.textSecondary;
    }
  };

  const renderItem = ({ item, index }: { item: Notification, index: number }) => (
    <Animated.View 
      entering={FadeInDown.delay(index * 50).duration(400)}
      exiting={FadeOutRight}
    >
      <TouchableOpacity 
        style={[
          styles.notificationItem, 
          { backgroundColor: colors.card, borderBottomColor: colors.border },
          !item.is_read && { borderLeftWidth: 4, borderLeftColor: colors.primary }
        ]}
        onPress={() => {
          if (!item.is_read) handleMarkAsRead(item.id);
          if (item.data?.property_id) {
            router.push(`/property/${item.data.property_id}`);
          }
        }}
      >
        <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
          <Ionicons name={getIconName(item.type)} size={24} color={getIconColor(item.type)} />
        </View>
        
        <View style={styles.contentContainer}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.text, fontWeight: item.is_read ? '600' : '800' }]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={[styles.time, { color: colors.textSecondary }]}>
              {new Date(item.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
            </Text>
          </View>
          <Text style={[styles.body, { color: colors.textSecondary }]} numberOfLines={2}>
            {item.body}
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.deleteBtn}
          onPress={() => handleDelete(item.id)}
        >
          <Ionicons name="close" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );

  if (!loading && notifications.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.iconCircle, { backgroundColor: colors.card }]}>
          <Ionicons name="notifications-off-outline" size={48} color={colors.textSecondary} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>No Notifications</Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          You're all caught up! We'll notify you when something important happens.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : insets.top }]}>
      <View style={styles.header}>
        <View>
          <TouchableOpacity 
            style={styles.backBtn} 
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text, marginTop: 8 }]}>Alerts</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Stay updated on your activity</Text>
        </View>
        
        {notifications.some(n => !n.is_read) && (
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={[styles.markAllText, { color: colors.primary }]}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    fontWeight: '500',
    marginTop: 2,
  },
  markAllText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contentContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    flex: 1,
    marginRight: 8,
  },
  time: {
    fontSize: 12,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
  deleteBtn: {
    padding: 8,
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
});
