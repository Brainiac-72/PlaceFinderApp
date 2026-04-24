import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Switch, Linking } from 'react-native';
import { useAuth } from '../../providers/AuthProvider';
import { supabase } from '../../utils/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useThemeColor } from '../../hooks/useThemeColor';
import Toast from 'react-native-toast-message';
import { useCustomAlert } from '../../providers/AlertProvider';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const { user, profile: authProfile } = useAuth();
  const { theme, setTheme } = useSettingsStore();
  const { colors, isDark } = useThemeColor();
  const { showAlert } = useCustomAlert();
  const router = useRouter();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleAvatarPress = () => {
    Toast.show({ type: 'success', text1: 'Coming Soon', text2: 'Image picker implementation required for Avatar uploads.' });
  };

  const handleSupportPress = () => {
    Linking.openURL('mailto:support@spacefinder.gh').catch(err => {
      console.error("Failed to open email:", err);
      Toast.show({ type: 'error', text1: 'Error', text2: 'Could not open email client.' });
    });
  };

  const handleLogout = () => {
    showAlert(
      "Secure Sign Out",
      "Are you sure you want to log out of your SpaceFinder account?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Log Out", 
          style: "destructive", 
          onPress: () => supabase.auth.signOut() 
        }
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      {/* Header Profile Section */}
      <View style={styles.header}>
        <TouchableOpacity style={[styles.avatarPlaceholder, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={handleAvatarPress}>
          <Ionicons name="person" size={40} color={colors.textSecondary} />
          <View style={[styles.editAvatarIcon, { borderColor: colors.background }]}>
            <Ionicons name="camera" size={14} color="#fff" />
          </View>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>{authProfile?.full_name || user?.email}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {authProfile?.role === 'owner' ? 'Landlord Account' : 'Seeker Account'}
        </Text>
      </View>

      {/* Main Settings Group */}
      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Account Management</Text>
        <View style={[styles.cardGroup, { backgroundColor: colors.card }]}>
          <TouchableOpacity 
            style={styles.linkRow} 
            onPress={() => router.push('/profile/edit')}
            activeOpacity={0.7}
          >
            <View style={styles.settingRowLeft}>
              <View style={[styles.iconBox, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="person-outline" size={20} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.settingText, { color: colors.text }]}>Personal Details</Text>
                <Text style={[styles.settingSubtext, { color: colors.textSecondary }]}>Name, Phone & Security</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.border} />
          </TouchableOpacity>
        </View>
      </View>

      {/* App Settings Group */}
      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>App Preferences</Text>
        <View style={[styles.cardGroup, { backgroundColor: colors.card }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingRowLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#FF950015' }]}>
                <Ionicons name="notifications-outline" size={20} color="#FF9500" />
              </View>
              <Text style={[styles.settingText, { color: colors.text }]}>Push Notifications</Text>
            </View>
            <Switch 
              value={notificationsEnabled} 
              onValueChange={setNotificationsEnabled} 
              trackColor={{ false: colors.border, true: colors.success }}
            />
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          
          <View style={styles.themeSection}>
            <View style={[styles.settingRowLeft, { padding: 16, paddingBottom: 12 }]}>
              <View style={[styles.iconBox, { backgroundColor: '#5856D615' }]}>
                <Ionicons name="color-palette-outline" size={20} color="#5856D6" />
              </View>
              <Text style={[styles.settingText, { color: colors.text }]}>Appearance</Text>
            </View>
            
            <View style={styles.themeSelector}>
              {(['light', 'dark', 'system'] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.themeOption,
                    theme === t && { backgroundColor: colors.primary, borderColor: colors.primary }
                  ]}
                  onPress={() => setTheme(t)}
                >
                  <Ionicons 
                    name={t === 'light' ? 'sunny' : t === 'dark' ? 'moon' : 'contrast'} 
                    size={16} 
                    color={theme === t ? '#fff' : colors.textSecondary} 
                  />
                  <Text style={[
                    styles.themeOptionText, 
                    { color: theme === t ? '#fff' : colors.textSecondary }
                  ]}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>

      {/* Support Group */}
      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Support</Text>
        <View style={[styles.cardGroup, { backgroundColor: colors.card }]}>
          <TouchableOpacity style={styles.linkRow} onPress={() => router.push('/profile/support')}>
            <View style={styles.settingRowLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#34C75915' }]}>
                <Ionicons name="help-buoy-outline" size={20} color="#34C759" />
              </View>
              <Text style={[styles.settingText, { color: colors.text }]}>Contact Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.border} />
          </TouchableOpacity>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <TouchableOpacity style={styles.linkRow} onPress={() => router.push('/profile/privacy')}>
            <View style={styles.settingRowLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#5AC8FA15' }]}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#5AC8FA" />
              </View>
              <Text style={[styles.settingText, { color: colors.text }]}>Privacy Policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.border} />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: colors.card }]} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={colors.error} />
        <Text style={[styles.logoutText, { color: colors.error }]}>Log Out Securely</Text>
      </TouchableOpacity>
      
      <Text style={[styles.versionText, { color: colors.textSecondary }]}>SpaceFinder Ghana v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 10,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    position: 'relative',
  },
  editAvatarIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#007AFF',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  sectionContainer: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingLeft: 4,
  },
  cardGroup: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  settingRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  settingText: {
    fontSize: 16,
    fontWeight: '600',
  },
  settingSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginLeft: 68,
    opacity: 0.5,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 20,
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
  },
  versionText: {
    textAlign: 'center',
    marginTop: 32,
    fontSize: 12,
    fontWeight: '500',
  },
  themeSection: {
    paddingBottom: 16,
  },
  themeSelector: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  themeOptionText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
