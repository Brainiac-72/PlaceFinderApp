import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useThemeColor } from '../../hooks/useThemeColor';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function SettingsScreen() {
  const router = useRouter();
  const { colors } = useThemeColor();

  const [notifications, setNotifications] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(true);
  const [locationServices, setLocationServices] = useState(false);

  const SettingRow = ({ title, description, value, onValueChange, icon }: any) => (
      <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
          <View style={[styles.iconBox, { backgroundColor: colors.surface }]}>
              <Ionicons name={icon} size={20} color={colors.primary} />
          </View>
          <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
              {description && <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>{description}</Text>}
          </View>
          <Switch 
            value={value} 
            onValueChange={onValueChange} 
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={'#fff'}
          />
      </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(600)}>
          <Text style={[styles.mainTitle, { color: colors.text }]}>App Settings</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Configure your app preferences
          </Text>
        </Animated.View>
        
        <Animated.View 
          entering={FadeInDown.delay(200).duration(600)}
          style={[styles.sectionCard, { backgroundColor: colors.card }]}
        >
            <SettingRow 
                icon="notifications"
                title="Push Notifications" 
                description="Receive alerts for messages and offers" 
                value={notifications} 
                onValueChange={setNotifications} 
            />
            <SettingRow 
                icon="mail"
                title="Email Updates" 
                description="Get weekly market insights" 
                value={emailUpdates} 
                onValueChange={setEmailUpdates} 
            />
            <SettingRow 
                icon="location"
                title="Location Services" 
                description="Show nearby properties automatically" 
                value={locationServices} 
                onValueChange={setLocationServices} 
            />
        </Animated.View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 16, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  container: { padding: 20, paddingBottom: 40 },
  mainTitle: { fontSize: 32, fontWeight: '800', letterSpacing: -1, marginBottom: 6 },
  subtitle: { fontSize: 14, fontWeight: '600', marginBottom: 24 },
  sectionCard: { borderRadius: 24, padding: 20, borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)' },
  settingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  settingTextContainer: { flex: 1, paddingRight: 16 },
  settingTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  settingDesc: { fontSize: 13, fontWeight: '500' }
});
