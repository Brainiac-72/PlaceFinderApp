import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, StatusBar, Platform } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSavedStore } from '../../store/useSavedStore';
import { DUMMY_PROPERTIES } from '../../data/dummyProperties';
import PropertyCard from '../../components/PropertyCard';
import { PropertyCardSkeleton } from '../../components/Skeleton';
import { useThemeColor } from '../../hooks/useThemeColor';
import { supabase } from '../../utils/supabase';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function SavedScreen() {
  const savedIds = useSavedStore(state => state.savedIds);
  const router = useRouter();
  const { colors, isDark } = useThemeColor();
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
    
    // 1. Get Matching Dummy Properties
    const matchingDummies = DUMMY_PROPERTIES.filter(p => savedIds.includes(p.id));

    // 2. Fetch Matching Supabase Properties
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .in('id', savedIds);

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

    // 3. Merge and set
    setSavedProperties([...matchingDummies, ...supabaseProps]);
    setLoading(false);
  }, [savedIds]);

  useFocusEffect(
    useCallback(() => {
      fetchSavedProperties();
    }, [fetchSavedProperties])
  );

  // No change here, just placeholder for alignment

  if (savedProperties.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.iconCircle, { backgroundColor: colors.card }]}>
          <Ionicons name="heart-dislike-outline" size={48} color={colors.textSecondary} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>No Saved Spaces</Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          You haven't bookmarked any properties yet. Explore our listings and tap the heart icon to save them here.
        </Text>
        <TouchableOpacity style={[styles.exploreBtn, { backgroundColor: colors.primary, shadowColor: colors.primary }]} onPress={() => router.push('/(tabs)')}>
          <Text style={styles.exploreBtnText}>Go Explore</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : insets.top }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Saved Spaces</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>{savedIds.length} properties bookmarked</Text>
      </View>

      <FlatList
        data={loading ? [1, 2, 3] : savedProperties}
        keyExtractor={(item, index) => loading ? `skele-${index}` : item.id}
        renderItem={({ item, index }) => 
          loading ? (
            <View style={{ paddingHorizontal: 16 }}>
              <PropertyCardSkeleton />
            </View>
          ) : (
            <Animated.View entering={FadeInDown.delay(index * 100).duration(400)}>
              <PropertyCard 
                property={item} 
                onPress={() => router.push(`/property/${item.id}`)} 
              />
            </Animated.View>
          )
        }
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#FAFAFA',
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  exploreBtn: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  exploreBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
