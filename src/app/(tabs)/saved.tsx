import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Heart, Home, Search } from 'lucide-react-native';
import { useSavedStore } from '../../store/useSavedStore';
import { DUMMY_PROPERTIES } from '../../data/dummyProperties';
import PropertyCard from '../../components/PropertyCard';
import { PropertyCardSkeleton } from '../../components/Skeleton';
import { useThemeColor } from '../../hooks/useThemeColor';
import { supabase } from '../../utils/supabase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { FlashList } from '@shopify/flash-list';
import * as Haptics from 'expo-haptics';
import { SectionHeader } from '../../components/premium/SectionHeader';
import { PremiumButton } from '../../components/premium/PremiumButton';

/**
 * The Saved Properties (Favorites) screen.
 * Fetches and displays a list of properties that the user has marked as 'saved' via the global store.
 */
export default function SavedScreen() {
  const savedIds = useSavedStore(state => state.savedIds);
  const router = useRouter();
  const { colors } = useThemeColor();
  const insets = useSafeAreaInsets();
  const [savedProperties, setSavedProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSavedProperties = useCallback(async () => {
    if (savedIds.length === 0) {
      setSavedProperties([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const matchingDummies = DUMMY_PROPERTIES.filter(p => savedIds.includes(p.id));
    const { data, error } = await supabase.from('properties').select('*').in('id', savedIds);

    let supabaseProps: any[] = [];
    if (!error && data) {
      supabaseProps = data.map(p => ({
        id: p.id,
        title: p.title,
        type: p.type,
        price: p.price,
        location: p.location,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        areaSize: p.area_size,
        description: p.description,
        status: p.status,
        currency: 'GHS',
        imageUrl: p.image_url || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1073&q=80'
      }));
    }

    setSavedProperties([...matchingDummies, ...supabaseProps]);
    setLoading(false);
  }, [savedIds]);

  useFocusEffect(
    useCallback(() => {
      fetchSavedProperties();
    }, [fetchSavedProperties])
  );

  if (savedProperties.length === 0 && !loading) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: '#0A0F1E' }]}>
        <View style={styles.emptyIconCircle}>
          <Heart size={48} color="#F59E0B" fill="rgba(245, 158, 11, 0.1)" strokeWidth={1.5} />
        </View>
        <Text style={styles.emptyTitle}>Curate Your Collection</Text>
        <Text style={styles.emptySubtitle}>
          Save properties you love to compare them later or share them with friends.
        </Text>
        <PremiumButton 
          title="Explore Spaces" 
          onPress={() => router.push('/(tabs)')} 
          icon={<Home size={20} color="#0A0F1E" />}
          style={{ width: '100%', marginTop: 12 }}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#0A0F1E', paddingTop: insets.top + (Platform.OS === 'android' ? 15 : 0) }]}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <SectionHeader 
          title="Saved Collection" 
          subtitle={`${savedIds.length} properties in your luxury collection`} 
        />
      </View>

      <FlashList
        data={loading ? [1, 2, 3, 4] : savedProperties}
        keyExtractor={(item, index) => typeof item === 'number' ? `skele-${index}` : item.id}
        renderItem={({ item, index }) => 
          typeof item === 'number' ? (
            <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
              <PropertyCardSkeleton />
            </View>
          ) : (
            <Animated.View entering={FadeInDown.delay(index * 100).duration(400)} style={{ paddingHorizontal: 24 }}>
              <PropertyCard 
                property={item} 
                onPress={() => router.push(`/property/${item.id}`)} 
              />
            </Animated.View>
          )
        }
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
  emptyIconCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center', marginBottom: 32, borderWidth: 1, borderColor: '#1F2937' },
  emptyTitle: { fontSize: 24, fontFamily: 'PlayfairDisplay_700Bold', color: '#F9FAFB', marginBottom: 16, textAlign: 'center' },
  emptySubtitle: { fontSize: 16, fontFamily: 'Inter_400Regular', color: '#9CA3AF', textAlign: 'center', lineHeight: 26, marginBottom: 40 },
});
