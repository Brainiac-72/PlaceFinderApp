import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, RefreshControl, Platform, StatusBar, Dimensions } from 'react-native';
import { Search, SlidersHorizontal, Bell, MapPin } from 'lucide-react-native';
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
import * as Haptics from 'expo-haptics';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import { SectionHeader } from '../../components/premium/SectionHeader';
import { PremiumButton } from '../../components/premium/PremiumButton';

const CATEGORIES = ['All', 'Residential', 'Commercial', 'Shop', 'Office'];
const { width } = Dimensions.get('window');

export default function HomeDashboard() {
  const { user, profile } = useAuth();
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter State
  const [filterMinPrice, setFilterMinPrice] = useState('');
  const [filterMaxPrice, setFilterMaxPrice] = useState('');
  const [filterBeds, setFilterBeds] = useState(0);
  const [filterBaths, setFilterBaths] = useState(0);
  
  const bottomSheetModalRef = React.useRef<BottomSheetModal>(null);
  const snapPoints = useMemo(() => ['70%'], []);
  
  const handleOpenFilters = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    bottomSheetModalRef.current?.present();
  }, []);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.6} />
    ),
    []
  );
  
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { colors } = useThemeColor();

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
    refetchInterval: 1000 * 60 * 2,
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
      
      const price = Number(p.price);
      const matchesMinPrice = filterMinPrice ? price >= Number(filterMinPrice) : true;
      const matchesMaxPrice = filterMaxPrice ? price <= Number(filterMaxPrice) : true;
      const matchesBeds = filterBeds > 0 ? p.bedrooms >= filterBeds : true;
      const matchesBaths = filterBaths > 0 ? p.bathrooms >= filterBaths : true;
      
      return matchesCategory && matchesSearch && matchesMinPrice && matchesMaxPrice && matchesBeds && matchesBaths;
    });
  }, [allProperties, activeCategory, searchQuery, filterMinPrice, filterMaxPrice, filterBeds, filterBaths]);

  const spotlightData = useMemo(() => {
    return allProperties.slice(0, 5);
  }, [allProperties]);

  const renderHeader = useCallback(() => (
    <View style={styles.headerContainer}>
      
      {/* Premium Header Bar */}
      <View style={styles.topZenBar}>
        <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Search size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput 
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search premium spaces..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.textMuted}
          />
          <TouchableOpacity 
            style={[styles.filterBtn, { backgroundColor: colors.surface }]} 
            activeOpacity={0.7}
            onPress={handleOpenFilters}
          >
            <SlidersHorizontal size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.notificationBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => router.push('/notifications')}
          activeOpacity={0.7}
        >
          <Bell size={22} color={colors.text} />
          {unreadCount > 0 && (
            <View style={[styles.notificationDot, { backgroundColor: colors.primary }]} />
          )}
        </TouchableOpacity>
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
                  { 
                    backgroundColor: isActive ? colors.primary : colors.card, 
                    borderColor: isActive ? colors.primary : colors.border,
                    borderWidth: 1
                  }
                ]}
                onPress={() => {
                  if (activeCategory !== category) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setActiveCategory(category);
                  }
                }}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.categoryText, 
                  { color: isActive ? colors.background : colors.textSecondary }
                ]}>
                  {category}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      {/* SPOTLIGHT SECTION */}
      {!searchQuery && activeCategory === 'All' && spotlightData.length > 0 && (
        <View style={styles.spotlightSection}>
          <SectionHeader 
            title="Spotlight" 
            subtitle="Exceptional spaces curated for you" 
            style={{ paddingHorizontal: 24 }}
          />
          <FlashList<any>
            data={spotlightData}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={width * 0.85 + 16}
            decelerationRate="fast"
            keyExtractor={(item: any) => `spot-${item.id}`}
            renderItem={({ item }: { item: any }) => (
              <SpotlightCard 
                property={item} 
                onPress={() => router.push(`/property/${item.id}`)} 
              />
            )}
            contentContainerStyle={{ paddingLeft: 24, paddingRight: 8, paddingBottom: 16 }}
          />
        </View>
      )}

      {/* MAIN FEED HEADER */}
      <View style={{ paddingHorizontal: 24, marginTop: 12 }}>
        <SectionHeader 
          title={searchQuery ? 'Results' : 'Discover'} 
          subtitle={searchQuery ? `Found ${filteredProperties.length} spaces matching "${searchQuery}"` : "Find your perfect space in Ghana"}
        />
      </View>

    </View>
  ), [colors, user, profile, myProperties, searchQuery, activeCategory, spotlightData, filteredProperties, router, unreadCount]);

  const renderItem = useCallback(({ item, index }: { item: any; index: number }) => (
    typeof item === 'number' ? (
      <View style={{ paddingHorizontal: 24, paddingBottom: 32 }}>
        <PropertyCardSkeleton />
      </View>
    ) : (
      <Animated.View entering={FadeInDown.delay(((index || 0) % 4) * 100).duration(500)} style={{ paddingHorizontal: 24 }}>
        <PropertyCard 
          property={item} 
          onPress={() => router.push(`/property/${item.id}`)} 
        />
      </Animated.View>
    )
  ), [router]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <FlashList<any>
        data={loading ? ([1, 2, 3] as any[]) : filteredProperties}
        keyExtractor={(item: any, index: number) => typeof item === 'number' ? `skele-${index}` : item.id}
        renderItem={renderItem}
        contentContainerStyle={{
          ...styles.listContent,
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 120
        }}
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={isRefetching} 
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={!loading ? (
          <View style={styles.emptyContainer}>
            <Search size={64} color={colors.textMuted} strokeWidth={1} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No spaces found</Text>
            <Text style={[styles.emptySub, { color: colors.textSecondary }]}>Try adjusting your filters or search query.</Text>
          </View>
        ) : null}
      />

      {/* FILTER BOTTOM SHEET */}
      <BottomSheetModal
        ref={bottomSheetModalRef}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: colors.card, borderRadius: 24 }}
        handleIndicatorStyle={{ backgroundColor: colors.border, width: 40 }}
      >
        <BottomSheetView style={[styles.bottomSheetContent, { backgroundColor: colors.card }]}>
          <Text style={[styles.sheetTitle, { color: colors.text }]}>Filters</Text>
          
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            {/* Price Range */}
            <Text style={[styles.filterSectionTitle, { color: colors.textSecondary }]}>PRICE RANGE</Text>
            <View style={styles.priceInputsRow}>
              <View style={[styles.priceInputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_600SemiBold' }}>$</Text>
                <TextInput
                  style={[styles.priceInput, { color: colors.text }]}
                  placeholder="Min"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={filterMinPrice}
                  onChangeText={setFilterMinPrice}
                />
              </View>
              <Text style={{ color: colors.textSecondary }}>—</Text>
              <View style={[styles.priceInputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_600SemiBold' }}>$</Text>
                <TextInput
                  style={[styles.priceInput, { color: colors.text }]}
                  placeholder="Max"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={filterMaxPrice}
                  onChangeText={setFilterMaxPrice}
                />
              </View>
            </View>

            {/* Bedrooms */}
            <Text style={[styles.filterSectionTitle, { color: colors.textSecondary, marginTop: 32 }]}>BEDROOMS</Text>
            <View style={styles.filterPillsRow}>
              {[0, 1, 2, 3, 4].map(num => (
                <TouchableOpacity
                  key={`bed-${num}`}
                  style={[
                    styles.filterPill,
                    { 
                        backgroundColor: filterBeds === num ? colors.primary : colors.surface, 
                        borderColor: filterBeds === num ? colors.primary : colors.border 
                    }
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setFilterBeds(num);
                  }}
                >
                  <Text style={[styles.filterPillText, { color: filterBeds === num ? colors.background : colors.text }]}>
                    {num === 0 ? 'Any' : `${num}+`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Bathrooms */}
            <Text style={[styles.filterSectionTitle, { color: colors.textSecondary, marginTop: 32 }]}>BATHROOMS</Text>
            <View style={styles.filterPillsRow}>
              {[0, 1, 2, 3, 4].map(num => (
                <TouchableOpacity
                  key={`bath-${num}`}
                  style={[
                    styles.filterPill,
                    { 
                        backgroundColor: filterBaths === num ? colors.primary : colors.surface, 
                        borderColor: filterBaths === num ? colors.primary : colors.border 
                    }
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setFilterBaths(num);
                  }}
                >
                  <Text style={[styles.filterPillText, { color: filterBaths === num ? colors.background : colors.text }]}>
                    {num === 0 ? 'Any' : `${num}+`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View style={[styles.sheetFooter, { borderTopColor: colors.border }]}>
            <TouchableOpacity 
              style={styles.clearBtn}
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setFilterMinPrice('');
                setFilterMaxPrice('');
                setFilterBeds(0);
                setFilterBaths(0);
              }}
            >
              <Text style={[styles.clearBtnText, { color: colors.textSecondary }]}>Reset All</Text>
            </TouchableOpacity>
            
            <PremiumButton 
                title="Show Results" 
                onPress={() => bottomSheetModalRef.current?.dismiss()}
                style={{ flex: 1, marginLeft: 24 }}
            />
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingTop: 8,
  },
  topZenBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 24,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    borderRadius: 16,
    paddingLeft: 20,
    paddingRight: 8,
    borderWidth: 1.5,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    height: '100%',
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBtn: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  notificationDot: {
    position: 'absolute',
    top: 18,
    right: 18,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#0A0F1E',
  },
  categoriesWrapper: {
    marginBottom: 32,
  },
  categoriesScroll: {
    paddingHorizontal: 24,
    gap: 12,
  },
  categoryPill: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
  },
  categoryText: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  listContent: {
    paddingTop: 0,
  },
  spotlightSection: {
    marginBottom: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    marginTop: 24,
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
  },
  emptySub: {
    marginTop: 8,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 22,
  },
  bottomSheetContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  sheetTitle: {
    fontSize: 28,
    fontFamily: 'PlayfairDisplay_700Bold',
    marginBottom: 32,
  },
  filterSectionTitle: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    marginBottom: 16,
    letterSpacing: 1.5,
  },
  priceInputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  priceInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1.5,
  },
  priceInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  filterPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  filterPill: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  filterPillText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  sheetFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 24,
    borderTopWidth: 1,
  },
  clearBtn: {
    paddingVertical: 12,
  },
  clearBtnText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
  },
});
