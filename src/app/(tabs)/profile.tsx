import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Platform } from 'react-native';
import { useAuth } from '../../providers/AuthProvider';
import { supabase } from '../../utils/supabase';
import { User, Shield, CreditCard, HelpCircle, LogOut, Settings, Star, ChevronRight, Moon, Sun } from 'lucide-react-native';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useThemeColor } from '../../hooks/useThemeColor';
import Toast from 'react-native-toast-message';
import { useCustomAlert } from '../../providers/AlertProvider';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useSavedStore } from '../../store/useSavedStore';
import { chatService } from '../../services/chatService';
import { SectionHeader } from '../../components/premium/SectionHeader';
import { PremiumAvatar } from '../../components/premium/PremiumAvatar';
import { PremiumCard } from '../../components/premium/PremiumCard';

/**
 * The user's Profile & Settings dashboard.
 * Displays quick stats and navigation links to nested settings like Appearance, Security, and Edit Profile.
 */
export default function ProfileScreen() {
  const { user, profile: authProfile } = useAuth();
  const { colors, isDark } = useThemeColor();
  const { theme, setTheme } = useSettingsStore();
  const { savedIds } = useSavedStore();
  const { showAlert } = useCustomAlert();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [chatsCount, setChatsCount] = useState(0);
  const [listingsCount, setListingsCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const fetchStats = async () => {
        if (!user?.id) return;
        
        const chats = await chatService.getUserChats(user.id);
        if (isMounted) setChatsCount(chats.length);

        if (authProfile?.role === 'landlord') {
          const { count } = await supabase.from('properties').select('id', { count: 'exact' }).eq('landlord_id', user.id);
          if (isMounted) setListingsCount(count || 0);
        }
      };

      fetchStats();

      if (!user?.id) return;

      const channel = supabase.channel('profile_stats')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'chats' }, () => {
          fetchStats();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'properties', filter: `landlord_id=eq.${user.id}` }, () => {
          fetchStats();
        })
        .subscribe();

      return () => {
        isMounted = false;
        supabase.removeChannel(channel);
      };
    }, [user?.id, authProfile?.role])
  );

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    showAlert(
      "Sign Out",
      "Are you sure you want to exit your premium session?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Sign Out", style: "destructive", onPress: () => supabase.auth.signOut() }
      ]
    );
  };

  const MenuButton = ({ icon: Icon, title, subtitle, onPress, destructive = false }: any) => (
    <TouchableOpacity 
        onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onPress?.();
        }}
        activeOpacity={0.7}
        style={[styles.menuItem, { borderBottomColor: colors.border }]}
    >
        <View style={[styles.menuIcon, { backgroundColor: destructive ? 'rgba(239, 68, 68, 0.1)' : colors.surface }]}>
            <Icon size={20} color={destructive ? '#EF4444' : colors.primary} />
        </View>
        <View style={styles.menuText}>
            <Text style={[styles.menuTitle, { color: destructive ? '#EF4444' : colors.text }]}>{title}</Text>
            {subtitle && <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
        </View>
        {!destructive && <ChevronRight size={20} color={colors.textMuted} />}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + (Platform.OS === 'android' ? 15 : 0) }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        
        {/* Header Section */}
        <View style={styles.header}>
            <SectionHeader title="Account" subtitle="Luxury discovery preferences" />
            
            <View style={styles.profileHero}>
                <PremiumAvatar size={100} online={true} uri={authProfile?.avatar_url} name={authProfile?.full_name} />
                <View style={styles.profileDetails}>
                    <Text style={[styles.userName, { color: colors.text }]}>{authProfile?.full_name || 'Premium Member'}</Text>
                    <View style={styles.badgeRow}>
                        <View style={[styles.premiumBadge, { backgroundColor: colors.primary }]}>
                            <Star size={12} color={colors.badgeText} fill={colors.badgeText} />
                            <Text style={[styles.premiumText, { color: colors.badgeText }]}>
                              {authProfile?.role === 'landlord' ? 'VERIFIED LANDLORD' : 'GOLD MEMBER'}
                            </Text>
                        </View>
                        <Text style={[styles.locationText, { color: colors.textMuted }]}>Accra, Ghana</Text>
                    </View>
                </View>
            </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
            <PremiumCard elevated style={styles.statCard}>
                <Text style={[styles.statVal, { color: colors.text }]}>
                  {authProfile?.role === 'landlord' ? listingsCount : savedIds.length}
                </Text>
                <Text style={[styles.statLab, { color: colors.textMuted }]}>
                  {authProfile?.role === 'landlord' ? 'LISTINGS' : 'SAVED'}
                </Text>
            </PremiumCard>
            <PremiumCard elevated style={styles.statCard}>
                <Text style={[styles.statVal, { color: colors.text }]}>{chatsCount}</Text>
                <Text style={[styles.statLab, { color: colors.textMuted }]}>CHATS</Text>
            </PremiumCard>
            <PremiumCard elevated style={styles.statCard}>
                <Text style={[styles.statVal, { color: colors.text }]}>0</Text>
                <Text style={[styles.statLab, { color: colors.textMuted }]}>OFFERS</Text>
            </PremiumCard>
        </View>

        {/* Menu Sections */}
        <View style={styles.menuSection}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>PREFERENCES</Text>
            <PremiumCard style={styles.menuContainer}>
                <MenuButton 
                    icon={User} 
                    title="Edit Profile" 
                    subtitle="Update your personal & contact details" 
                    onPress={() => router.push('/profile/edit')}
                />
                <MenuButton 
                    icon={Shield} 
                    title="Security & Privacy" 
                    subtitle="2FA and data management" 
                    onPress={() => router.push('/profile/privacy')}
                />
                <MenuButton 
                    icon={CreditCard} 
                    title="Subscription" 
                    subtitle="Manage your premium membership" 
                    onPress={() => router.push('/profile/subscription')}
                />
            </PremiumCard>
        </View>

        <View style={styles.menuSection}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>SUPPORT</Text>
            <PremiumCard style={styles.menuContainer}>
                <MenuButton 
                    icon={HelpCircle} 
                    title="Help Center" 
                    subtitle="Access our 24/7 concierge support" 
                    onPress={() => router.push('/profile/support')}
                />
                <MenuButton 
                    icon={isDark ? Moon : Sun} 
                    title="Appearance" 
                    subtitle={theme === 'system' ? 'Current Theme: System' : `Current Theme: ${theme.charAt(0).toUpperCase() + theme.slice(1)}`} 
                    onPress={() => {
                        showAlert(
                            "Select Appearance",
                            "Choose your preferred theme",
                            [
                                { text: "Light", onPress: () => setTheme('light') },
                                { text: "Dark", onPress: () => setTheme('dark') },
                                { text: "Match System", onPress: () => setTheme('system') },
                                { text: "Cancel", style: "cancel" }
                            ]
                        );
                    }}
                />
                <MenuButton 
                    icon={Settings} 
                    title="App Settings" 
                    subtitle="Notifications, language, and theme" 
                    onPress={() => router.push('/profile/settings')}
                />
                <MenuButton 
                    icon={LogOut} 
                    title="Sign Out" 
                    destructive 
                    onPress={handleLogout}
                />
            </PremiumCard>
        </View>

        <Text style={[styles.versionText, { color: colors.textMuted }]}>SPACEFINDER GHANA V1.4.2</Text>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 20 },
  profileHero: { flexDirection: 'row', alignItems: 'center', marginTop: 32, gap: 24 },
  profileDetails: { flex: 1 },
  userName: { fontSize: 24, fontFamily: 'PlayfairDisplay_700Bold', marginBottom: 8 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  premiumBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, gap: 6 },
  premiumText: { fontSize: 9, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  locationText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 24, marginTop: 40, gap: 12 },
  statCard: { flex: 1, paddingVertical: 20, alignItems: 'center', justifyContent: 'center' },
  statVal: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  statLab: { fontSize: 10, fontFamily: 'Inter_600SemiBold', marginTop: 4, letterSpacing: 1 },
  menuSection: { marginTop: 40, paddingHorizontal: 24 },
  sectionLabel: { fontSize: 12, fontFamily: 'Inter_700Bold', letterSpacing: 1.5, marginBottom: 16, marginLeft: 4 },
  menuContainer: { overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  menuIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  menuText: { flex: 1, marginLeft: 16 },
  menuTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  menuSubtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
  versionText: { textAlign: 'center', marginTop: 60, fontSize: 12, fontFamily: 'Inter_700Bold', letterSpacing: 2 },
});
