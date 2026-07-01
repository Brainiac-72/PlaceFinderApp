import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useThemeColor } from '../../hooks/useThemeColor';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { PremiumButton } from '../../components/premium/PremiumButton';
import { useCustomAlert } from '../../providers/AlertProvider';

/**
 * The Subscription Management Screen.
 * Displays current premium plan benefits and allows users to manage billing or upgrade/cancel plans.
 */
export default function SubscriptionScreen() {
  const router = useRouter();
  const { colors } = useThemeColor();
  const { showAlert } = useCustomAlert();

  const handleUpgrade = () => {
    showAlert("Upgrade Plan", "This feature is currently in development. You will be notified when premium upgrades are available.");
  };

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background, paddingTop: insets.top + (Platform.OS === 'android' ? 15 : 0) }]}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.navigate('/profile')} 
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Subscription</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(600)}>
          <Text style={[styles.mainTitle, { color: colors.text }]}>Your Plan</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Manage your premium membership and billing
          </Text>
        </Animated.View>
        
        <Animated.View 
          entering={FadeInDown.delay(200).duration(600)} 
          style={[styles.heroCard, { backgroundColor: colors.primary }]}
        >
          <View style={styles.heroContent}>
            <View style={styles.heroIconBox}>
              <Ionicons name="star" size={32} color="#fff" />
            </View>
            <View style={styles.heroTextBox}>
              <Text style={styles.heroTitle}>Gold Member</Text>
              <Text style={styles.heroSub}>Active until Dec 31, 2026</Text>
            </View>
          </View>
        </Animated.View>

        <Animated.View 
          entering={FadeInDown.delay(300).duration(600)}
          style={[styles.sectionCard, { backgroundColor: colors.card }]}
        >
            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 16 }]}>Current Benefits</Text>
            
            {[
                "Unlimited Property Listings",
                "Priority Support (24/7)",
                "Advanced Analytics",
                "Featured Placement"
            ].map((benefit, idx) => (
                <View key={idx} style={styles.benefitRow}>
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                    <Text style={[styles.benefitText, { color: colors.textSecondary }]}>{benefit}</Text>
                </View>
            ))}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(400).duration(600)} style={{ marginTop: 24 }}>
            <PremiumButton title="Upgrade Plan" onPress={handleUpgrade} style={{ width: '100%' }} />
            <TouchableOpacity style={styles.cancelBtn} onPress={() => showAlert("Cancel Subscription", "Are you sure you want to cancel your subscription?", [{ text: "No", style: "cancel" }, { text: "Yes", style: "destructive" }])}>
                <Text style={styles.cancelBtnText}>Cancel Subscription</Text>
            </TouchableOpacity>
        </Animated.View>

      </ScrollView>
    </View>
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
  heroCard: { borderRadius: 28, padding: 24, marginBottom: 32, shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 8 },
  heroContent: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  heroIconBox: { width: 60, height: 60, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  heroTextBox: { flex: 1 },
  heroTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 4 },
  heroSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13, lineHeight: 18, fontWeight: '500' },
  sectionCard: { borderRadius: 24, padding: 20, borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)' },
  sectionTitle: { fontSize: 17, fontWeight: '700' },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  benefitText: { fontSize: 15, fontWeight: '500' },
  cancelBtn: { marginTop: 16, paddingVertical: 16, alignItems: 'center' },
  cancelBtnText: { color: '#EF4444', fontSize: 15, fontWeight: '700' }
});
