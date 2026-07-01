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
import { SectionHeader } from '../../components/premium/SectionHeader';
import { PremiumAvatar } from '../../components/premium/PremiumAvatar';
import { PremiumCard } from '../../components/premium/PremiumCard';
import { PremiumButton } from '../../components/premium/PremiumButton';

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
        <ActivityIndicator size="large" color="#F59E0B" />
      </View>
    );
  }

  if (chats.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.emptyIconCircle, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <MessageSquare size={48} color="#F59E0B" fill="rgba(245, 158, 11, 0.1)" strokeWidth={1.5} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>Conversations</Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          Your luxury discoveries start with a conversation. Inquire about properties to see messages here.
        </Text>
        <PremiumButton 
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
          const propertyTitle = item.property?.title || 'Unknown Property';

          return (
            <Animated.View entering={FadeInDown.delay(index * 100).duration(400)} style={{ paddingHorizontal: 24, marginBottom: 12 }}>
              <PremiumCard onPress={() => handleChatPress(item.id)} style={styles.chatCard}>
                <PremiumAvatar size={60} online={true} />
                <View style={styles.chatInfo}>
                  <View style={styles.chatHeaderRow}>
                    <Text style={[styles.userName, { color: colors.text }]} numberOfLines={1}>
                      {otherProfile?.full_name || 'Premium Client'}
                    </Text>
                    <Text style={[styles.timeText, { color: colors.textMuted }]}>Just now</Text>
                  </View>
                  <Text style={styles.propertyRef} numberOfLines={1}>
                    RE: {propertyTitle.toUpperCase()}
                  </Text>
                  <Text style={[styles.lastMessage, { color: colors.textSecondary }]} numberOfLines={1}>
                    Tap to resume conversation...
                  </Text>
                </View>
                <View style={styles.unreadDot} />
              </PremiumCard>
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
  emptySubtitle: { fontSize: 16, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 26, marginBottom: 40 },
  chatCard: { flexDirection: 'row', padding: 16, alignItems: 'center' },
  chatInfo: { flex: 1, marginLeft: 16 },
  chatHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  userName: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  timeText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  propertyRef: { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#F59E0B', letterSpacing: 1, marginBottom: 4 },
  lastMessage: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#F59E0B', marginLeft: 8 },
});
