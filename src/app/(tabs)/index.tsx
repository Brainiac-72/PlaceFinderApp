import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, RefreshControl, Platform, ActivityIndicator, StatusBar, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import PropertyCard from '../../components/PropertyCard';
import SpotlightCard from '../../components/SpotlightCard';
import { PropertyCardSkeleton } from '../../components/Skeleton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColor } from '../../hooks/useThemeColor';
import { useAuth } from '../../providers/AuthProvider';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';
import { propertyService } from '../../services/propertyService';
import { notificationService } from '../../services/notificationService';
import { combineWithDummyData } from '../../utils/propertyUtils';
import { FlashList } from '@shopify/flash-list';

const CATEGORIES = ['All', 'Residential', 'Shop', 'Office', 'Event'];
const { width } = Dimensions.get('window');

export default function HomeDashboard() {
  const { user, profile } = useAuth();
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors, isDark } = useThemeColor();

  // 1. Fetch ALL properties
  const { 
    data: allProperties = [], 
    isLoading: isLoadingAll, 
    refetch: refetchAll,
    isRefetching
  } = useQuery({
    queryKey: ['properties'],
    queryFn: propertyService.getAllProperties,
    select: combineWithDummyData
  });

  // 2. Fetch MY properties (if landlord)
  const { 
    data: myProperties = [], 
    isLoading: isLoadingMy, 
    refetch: refetchMy 
  } = useQuery({
    queryKey: ['my-properties', user?.id],
    queryFn: () => propertyService.getMyProperties(user!.id),
    enabled: !!user && profile?.role === 'owner',
  });

  // 3. Fetch Unread Notifications Count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications-count', user?.id],
    queryFn: () => notificationService.getUnreadCount(user!.id),
    enabled: !!user,
    refetchInterval: 1000 * 60 * 2, // Refetch every 2 minutes
  });

  const loading = isLoadingAll || (profile?.role === 'owner' && isLoadingMy && myProperties.length === 0);

  const onRefresh = useCallback(async () => {
    await Promise.all([refetchAll(), refetchMy()]);
  }, [refetchAll, refetchMy]);

  const filteredProperties = useMemo(() => {
    return allProperties.filter((p: any) => {
      const title = p.title?.toLowerCase() || '';
      const location = p.location?.toLowerCase() || '';
      const query = searchQuery.toLowerCase();
      
      const matchesCategory = activeCategory === 'All' || p.type === activeCategory;
      const matchesSearch = title.includes(query) || location.includes(query);
      
      return matchesCategory && matchesSearch;
    });
  }, [allProperties, activeCategory, searchQuery]);

  const spotlightData = useMemo(() => {
    return allProperties.slice(0, 5);
  }, [allProperties]);

  const renderHeader = useCallback(() => (
    <View style={styles.headerContainer}>
      {/* Top Welcome Bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>
            {user ? `Hello, ${profile?.full_name?.split(' ')[0] || 'User'} 👋` : 'Welcome to'}
          </Text>
          <View style={styles.locationSelector}>
            <Text style={[styles.cityText, { color: colors.text }]}>SpaceFinder Ghana</Text>
            {profile?.role === 'owner' && (
              <View style={[styles.roleBadge, { backgroundColor: colors.primary + '15' }]}>
                <Text style={[styles.roleBadgeText, { color: colors.primary }]}>Landlord Mode</Text>
              </View>
            )}
          </View>
        </View>
        <TouchableOpacity 
          style={[styles.notificationBtn, { backgroundColor: colors.card, shadowColor: isDark ? '#fff' : '#000' }]}
          onPress={() => router.push('/notifications')}
        >
          <Ionicons name="notifications-outline" size={22} color={colors.text} />
          {unreadCount > 0 && (
            <View style={[styles.notificationDot, { backgroundColor: colors.error }]}>
              <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search Section */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBox, { backgroundColor: colors.card, shadowColor: isDark ? '#fff' : '#000' }]}>
          <Ionicons name="search-outline" size={22} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput 
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search for space, location..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.textSecondary}
          />
        </View>
      </View>

      {/* Categories Scroller */}
      <View style={styles.categoriesWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
          {CATEGORIES.map(category => {
            const isActive = activeCategory === category;
            return (
              <TouchableOpacity 
                key={category}
                style={[
                  styles.categoryPill, 
                  { backgroundColor: isActive ? colors.primary : colors.card, borderColor: isActive ? colors.primary : 'rgba(0,0,0,0.05)' }
                ]}
                onPress={() => setActiveCategory(category)}
              >
                <Text style={[
                  styles.categoryText, 
                  { color: isActive ? '#fff' : colors.textSecondary }
                ]}>
                  {category}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      {/* LANDLORD SPECIFIC SECTION: "My Spaces" Tray */}
      {profile?.role === 'owner' && myProperties.length > 0 && searchQuery === '' && activeCategory === 'All' && (
        <View style={styles.ownerSection}>
          <View style={styles.sectionTitleRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>My Listed Spaces ({myProperties.length})</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16, paddingHorizontal: 16 }}>
             {myProperties.map((p, idx) => (
               <View key={p.id} style={{ width: 280, marginRight: 16 }}>
                 <PropertyCard 
                   property={p} 
                   onPress={() => router.push(`/property/${p.id}`)}
                   compact={true} 
                 />
               </View>
             ))}
          </ScrollView>
          <View style={[styles.divider, { backgroundColor: colors.border, marginVertical: 24 }]} />
        </View>
      )}

      {/* GLOBAL FEED: Featured Spaces */}
      {!searchQuery && activeCategory === 'All' && spotlightData.length > 0 && (
        <View style={styles.spotlightSection}>
          <View style={styles.sectionTitleRow}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Featured Spaces</Text>
            <TouchableOpacity>
              <Text style={{ color: colors.primary, fontWeight: '700' }}>See all</Text>
            </TouchableOpacity>
          </View>
          <FlashList<any>
            data={spotlightData}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={width * 0.82 + 16}
            decelerationRate="fast"
            keyExtractor={(item: any) => `spot-${item.id}`}
            renderItem={({ item }: { item: any }) => (
              <SpotlightCard 
                property={item} 
                onPress={() => router.push(`/property/${item.id}`)} 
              />
            )}
            contentContainerStyle={{ paddingBottom: 10 }}
          />
          <View style={[styles.divider, { backgroundColor: colors.border, marginVertical: 24, opacity: 0.5 }]} />
        </View>
      )}

      <View style={styles.sectionTitleRow}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {searchQuery ? 'Search Results' : 'Discover Spaces'}
        </Text>
        <Text style={[styles.resultsCount, { color: colors.textSecondary }]}>{filteredProperties.length} found</Text>
      </View>
    </View>
  ), [colors, user, profile, myProperties, searchQuery, activeCategory, spotlightData, filteredProperties, router, isDark]);

  const renderItem = useCallback(({ item, index }: { item: any; index: number }) => (
    loading ? (
      <View style={{ paddingHorizontal: 20 }}>
        <PropertyCardSkeleton />
      </View>
    ) : (
      <Animated.View entering={FadeInDown.delay(index * 50).duration(400)}>
        <PropertyCard 
          property={item} 
          onPress={() => router.push(`/property/${item.id}`)} 
        />
      </Animated.View>
    )
  ), [loading, router]);

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : insets.top, backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <FlashList<any>
        data={loading ? ([1, 2, 3] as any[]) : filteredProperties}
        keyExtractor={(item: any, index: number) => loading ? `skele-${index}` : item.id}
        renderItem={renderItem}
        contentContainerStyle={{
          ...styles.listContent,
          paddingBottom: insets.bottom + 20
        }}
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={isRefetching} 
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={!loading ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="business-outline" size={64} color={colors.border} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No spaces match your search.</Text>
          </View>
        ) : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  cityText: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  notificationBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  notificationDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '800',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: 20,
    paddingHorizontal: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    height: '100%',
  },
  categoriesWrapper: {
    marginHorizontal: -16,
    marginBottom: 24,
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  categoryPill: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 15,
    fontWeight: '600',
  },
  ownerSection: {
    marginBottom: 8,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  resultsCount: {
    fontSize: 14,
    fontWeight: '600',
  },
  spotlightSection: {
    marginBottom: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingBottom: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    width: '100%',
  }
});
