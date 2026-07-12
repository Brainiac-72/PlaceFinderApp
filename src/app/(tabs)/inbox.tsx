import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Platform, StatusBar } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { MessageSquare, Search, Home, User } from 'lucide-react-native';
import { useAuth } from '../../providers/AuthProvider';
import { useThemeColor } from '../../hooks/useThemeColor';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { chatService, ChatSession } from '../../services/chatService';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Avatar } from '../../components/ui/Avatar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

/**
 * The Inbox screen displaying all active conversations.
 * Lists chat sessions indicating the associated property and the other party (landlord/seeker).
 */
export default function InboxScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useThemeColor();
  const insets = useSafeAreaInsets();
  
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChats = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const data = await chatService.getUserChats(user.id);
    setChats(data);
    setLoading(false);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchChats();
    }, [fetchChats])
  );

  const handleChatPress = (chatId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/chat/${chatId}`);
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#0066FF" />
      </View>
    );
  }

  if (chats.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.emptyIconCircle, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MessageSquare size={48} color="#0066FF" fill="rgba(0, 102, 255, 0.1)" strokeWidth={1.5} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>Conversations</Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          Your luxury discoveries start with a conversation. Inquire about properties to see messages here.
        </Text>
        <Button 
          title="Explore Spaces" 
          onPress={() => router.push('/(tabs)')} 
          icon={<Home size={20} color={colors.background} />}
          style={{ width: '100%', marginTop: 12 }}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <StatusBar barStyle={colors.background === '#0A0F1E' ? "light-content" : "dark-content"} />
      <View style={styles.header}>
        <SectionHeader 
          title="Messages" 
          subtitle="Direct access to property concierge" 
        />
      </View>

      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => {
          const isLandlord = user?.id === item.landlord_id;
          const otherProfile = isLandlord ? item.seeker : item.landlord;
          const propertyTitle = item.property?.title || 'General Inquiry';
          
          let lastMsgContent = 'Tap to start conversation...';
          let timeText = 'Just now';
          let hasUnread = false; // We can base this on is_read if needed
          
          if (item.last_message) {
            const d = new Date(item.last_message.created_at);
            timeText = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            if (item.last_message.attached_property_id) {
               lastMsgContent = item.last_message.content ? `📎 ${item.last_message.content}` : `📎 Shared a Property`;
            } else {
               lastMsgContent = item.last_message.content || 'Message sent';
            }
            
            if (!item.last_message.is_read && item.last_message.sender_id !== user?.id) {
               hasUnread = true;
            }
          }

          return (
            <Animated.View entering={FadeInDown.delay(index * 100).duration(400)} style={{ paddingHorizontal: 24, marginBottom: 12 }}>
              <Card onPress={() => handleChatPress(item.id)} style={styles.chatCard}>
                <Avatar size={60} online={true} />
                <View style={styles.chatInfo}>
                  <View style={styles.chatHeaderRow}>
                    <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
                      {otherProfile?.full_name || 'Premium Client'}
                    </Text>
                    <Text style={[styles.timeText, { color: colors.textMuted }]}>{timeText}</Text>
                  </View>
                  <Text style={styles.propertyRef} numberOfLines={1}>
                    RE: {propertyTitle.toUpperCase()}
                  </Text>
                  <Text style={[styles.lastMessage, { color: hasUnread ? colors.text : colors.textSecondary, fontFamily: hasUnread ? 'Outfit_700Bold' : 'Outfit_400Regular' }]} numberOfLines={1}>
                    {lastMsgContent}
                  </Text>
                </View>
                {hasUnread && <View style={styles.unreadDot} />}
              </Card>
            </Animated.View>
          );
        }}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 20 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIconCircle: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 32, borderWidth: 1 },
  emptyTitle: { fontSize: 24, fontFamily: 'PlayfairDisplay_700Bold', marginBottom: 16, textAlign: 'center' },
  emptySubtitle: { fontSize: 16, fontFamily: 'Outfit_400Regular', textAlign: 'center', lineHeight: 26, marginBottom: 40 },
  chatCard: { flexDirection: 'row', padding: 16, alignItems: 'center' },
  chatInfo: { flex: 1, marginLeft: 16 },
  chatHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  userName: { fontSize: 17, fontFamily: 'Outfit_700Bold' },
  timeText: { fontSize: 12, fontFamily: 'Outfit_400Regular' },
  propertyRef: { fontSize: 11, fontFamily: 'Outfit_700Bold', color: '#0066FF', letterSpacing: 1, marginBottom: 4 },
  lastMessage: { fontSize: 14, fontFamily: 'Outfit_400Regular' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#0066FF', marginLeft: 8 },
});
