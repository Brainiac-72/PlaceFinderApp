import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useThemeColor } from '../../hooks/useThemeColor';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const { colors, isDark } = useThemeColor();

  const sections = [
    {
      title: "Data Collection",
      content: "SpaceFinder Ghana collects essential information to provide our services, including your name, email address, phone number, and profile role (Landlord or Seeker).",
      icon: "finger-print",
      color: "#007AFF"
    },
    {
      title: "How We Use Data",
      content: "Your data is used to facilitate connections between property owners and seekers. We use your phone number to allow direct contact via WhatsApp or voice calls.",
      icon: "magnet",
      color: "#34C759"
    },
    {
      title: "Data Security",
      content: "We utilize Supabase's secure infrastructure to encrypt and protect your sensitive information. Your password is never stored in plain text.",
      icon: "key",
      color: "#5856D6"
    },
    {
      title: "Third-Party Sharing",
      content: "We do not sell your personal data. We only share your contact information with other users when you explicitly initiate a contact request.",
      icon: "share-social",
      color: "#FF9500"
    },
    {
      title: "Your Rights",
      content: "You have the right to access, correct, or delete your personal information at any time through the profile settings.",
      icon: "checkmark-shield",
      color: "#FF3B30"
    }
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Privacy Center</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(600)}>
          <Text style={[styles.mainTitle, { color: colors.text }]}>Your data. Protected.</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Last updated April 14, 2026 • 4 min read
          </Text>
        </Animated.View>
        
        <Animated.View 
          entering={FadeInDown.delay(200).duration(600)} 
          style={[styles.heroCard, { backgroundColor: colors.primary }]}
        >
          <View style={styles.heroContent}>
            <View style={styles.heroIconBox}>
              <Ionicons name="shield-checkmark" size={32} color="#fff" />
            </View>
            <View style={styles.heroTextBox}>
              <Text style={styles.heroTitle}>Privacy first, always.</Text>
              <Text style={styles.heroSub}>We encrypt every piece of data to ensure your safety in the real estate market.</Text>
            </View>
          </View>
        </Animated.View>

        {sections.map((section, index) => (
          <Animated.View 
            key={index} 
            entering={FadeInDown.delay(300 + (index * 100)).duration(600)}
            style={[styles.sectionCard, { backgroundColor: colors.card }]}
          >
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconBox, { backgroundColor: section.color + '15' }]}>
                <Ionicons name={section.icon as any} size={20} color={section.color} />
              </View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
            </View>
            <Text style={[styles.sectionContent, { color: colors.textSecondary }]}>{section.content}</Text>
          </Animated.View>
        ))}

        <View style={styles.footer}>
          <Ionicons name="lock-closed" size={16} color={colors.textSecondary} />
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            End-to-end encrypted storage provided by Supabase
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -1,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 24,
  },
  heroCard: {
    borderRadius: 28,
    padding: 24,
    marginBottom: 32,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  heroIconBox: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTextBox: {
    flex: 1,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  heroSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  sectionCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  sectionIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  sectionContent: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
    paddingLeft: 50,
  },
  footer: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    opacity: 0.6,
  },
  footerText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  }
});
