import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, TextInput, Linking, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useThemeColor } from '../../hooks/useThemeColor';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQS = [
  {
    question: "How do I list my property?",
    answer: "Go to your Profile, tap on 'Switch to Landlord Mode', and you'll see a new 'Upload' tab. Fill in the details and list your space instantly!"
  },
  {
    question: "Is my personal data safe?",
    answer: "Absolutely. We use enterprise-grade encryption via Supabase. Your contact info is only shared with verified seekers you choose to interact with."
  },
  {
    question: "How do I contact a landlord?",
    answer: "Simply click on any property you like, and tap the 'Contact' button. You can then choose to chat on WhatsApp or make a direct call."
  },
  {
    question: "Are there any hidden fees?",
    answer: "SpaceFinder Ghana is currently free for seekers. Owners may have premium listing options in the future, but we are committed to transparency."
  }
];

export default function SupportScreen() {
  const router = useRouter();
  const { colors, isDark } = useThemeColor();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleExpand = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const contactOptions = [
    { icon: "mail", label: "Email Us", sub: "support@spacefinder.gh", action: () => Linking.openURL('mailto:support@spacefinder.gh'), color: '#007AFF' },
    { icon: "logo-whatsapp", label: "WhatsApp", sub: "Instant support chat", action: () => Linking.openURL('https://wa.me/233000000000'), color: '#34C759' },
    { icon: "call", label: "Call Center", sub: "+233 00 000 0000", action: () => Linking.openURL('tel:+233000000000'), color: '#FF9500' },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Help Center</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(600)}>
          <Text style={[styles.title, { color: colors.text }]}>How can we help today?</Text>
          <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="search" size={20} color={colors.textSecondary} />
            <TextInput 
              placeholder="Search help articles..." 
              placeholderTextColor={colors.textSecondary}
              style={[styles.searchInput, { color: colors.text }]}
              editable={false}
            />
          </View>
        </Animated.View>

        {/* Contact Grid */}
        <View style={styles.contactGrid}>
          {contactOptions.map((opt, idx) => (
            <Animated.View key={idx} entering={FadeInDown.delay(100 * idx).duration(600)}>
              <TouchableOpacity style={[styles.contactCard, { backgroundColor: colors.card }]} onPress={opt.action}>
                <View style={[styles.iconCircle, { backgroundColor: opt.color + '15' }]}>
                  <Ionicons name={opt.icon as any} size={22} color={opt.color} />
                </View>
                <Text style={[styles.contactLabel, { color: colors.text }]}>{opt.label}</Text>
                <Text style={[styles.contactSub, { color: colors.textSecondary }]}>{opt.sub}</Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        {/* FAQs */}
        <View style={styles.faqSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Frequently Asked Questions</Text>
          {FAQS.map((faq, idx) => (
            <Animated.View key={idx} entering={FadeInUp.delay(200 + (idx * 50)).duration(600)}>
              <TouchableOpacity 
                style={[styles.faqCard, { backgroundColor: colors.card, borderColor: colors.border }]} 
                onPress={() => toggleExpand(idx)}
                activeOpacity={0.7}
              >
                <View style={styles.faqHeader}>
                  <Text style={[styles.faqQuestion, { color: colors.text }]}>{faq.question}</Text>
                  <Ionicons 
                    name={expandedIndex === idx ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={colors.textSecondary} 
                  />
                </View>
                {expandedIndex === idx && (
                  <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>{faq.answer}</Text>
                )}
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        <TouchableOpacity style={[styles.reportBtn, { borderColor: colors.error }]}>
          <Ionicons name="alert-circle-outline" size={20} color={colors.error} />
          <Text style={[styles.reportText, { color: colors.error }]}>Report a Technical Problem</Text>
        </TouchableOpacity>
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
    fontSize: 18,
    fontWeight: '700',
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  contactGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 32,
  },
  contactCard: {
    width: (Dimensions.get('window').width - 52) / 2,
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactLabel: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  contactSub: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  faqSection: {
    marginTop: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 20,
    letterSpacing: -0.3,
  },
  faqCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    paddingRight: 10,
  },
  faqAnswer: {
    fontSize: 14,
    lineHeight: 22,
    marginTop: 12,
    fontWeight: '500',
  },
  reportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: 32,
    gap: 10,
  },
  reportText: {
    fontSize: 14,
    fontWeight: '700',
  }
});

import { Dimensions } from 'react-native';
