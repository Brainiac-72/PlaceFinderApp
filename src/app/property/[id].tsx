import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useEffect, useRef, useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Dimensions, Platform, ActivityIndicator, Share, Alert } from 'react-native';
import { ChevronLeft, Share2, Heart, MapPin, Bed, Bath, Maximize, MessageSquare, Trash2, CheckCircle2, Clock, XCircle, Star, ShieldCheck, Camera, Edit3 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSavedStore } from '../../store/useSavedStore';
import { useThemeColor } from '../../hooks/useThemeColor';
import { useCustomAlert } from '../../providers/AlertProvider';
import { useAuth } from '../../providers/AuthProvider';
import { getAmenityById } from '../../constants/Amenities';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { propertyService } from '../../services/propertyService';
import { chatService } from '../../services/chatService';
import { DUMMY_PROPERTIES } from '../../data/dummyProperties';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';

import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Linking } from 'react-native';

const { width } = Dimensions.get('window');

/**
 * The Property Details Screen.
 * Displays comprehensive information about a specific property listing.
 * Includes actions to save/favorite, share, contact landlord (chat/call), or manage (if landlord).
 */
export default function PropertyDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useThemeColor();
  const { showAlert } = useCustomAlert();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: property, isLoading: loading } = useQuery({
    queryKey: ['property', id],
    queryFn: () => propertyService.getPropertyById(id!),
    enabled: !!id,
    initialData: () => DUMMY_PROPERTIES.find(p => p.id === id) as any
  });

  const isLandlord = useMemo(() => user && property && user.id === property.landlord_id, [user, property]);
  const isSaved = useSavedStore(state => state.isSaved(id || ''));
  const toggleSaved = useSavedStore(state => state.toggleSaved);
  
  const snapPoints = useMemo(() => isLandlord ? ['50%'] : ['35%'], [isLandlord]);

  useEffect(() => {
    if (id && user && property && user.id !== property.landlord_id) {
        propertyService.incrementViewCount(id);
    }
  }, [id, user?.id, !!property]);

  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const HERO_WIDTH = width - 32;

  const galleryImages = useMemo(() => {
    if (!property) return [];
    return [
      property.imageUrl,
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=2000&auto=format&fit=crop', // living room
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2000&auto=format&fit=crop', // bathroom
      'https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=2000&auto=format&fit=crop', // kitchen
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?q=80&w=2000&auto=format&fit=crop', // bedroom
    ].filter(Boolean);
  }, [property]);

  const handleScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    setActiveImageIndex(Math.round(index));
  };

  const handlePresentModalPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    bottomSheetModalRef.current?.present();
  }, []);

  const renderBackdrop = useCallback(
    (props: any) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.7} />,
    []
  );

  const handleInAppMessage = async () => {
    if (!property || !user) {
      showAlert('Error', 'You must be logged in to send a message.');
      return;
    }
    try {
      bottomSheetModalRef.current?.dismiss();
      const chatId = await chatService.getOrCreateChat(property.id, user.id, property.landlord_id);
      if (chatId) router.push(`/chat/${chatId}`);
      else showAlert('Error', 'Could not start conversation.');
    } catch (e) {
      showAlert('Error', 'Failed to start chat.');
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!property) return;
    bottomSheetModalRef.current?.dismiss();
    const success = await propertyService.updatePropertyStatus(property.id, status);
    if (success) {
      queryClient.invalidateQueries({ queryKey: ['property', property.id] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showAlert('Success', `Property marked as ${status}.`);
      router.replace(`/property/${property.id}`);
    } else {
      showAlert('Error', 'Failed to update status.');
    }
  };

  const handleDeleteProperty = () => {
    bottomSheetModalRef.current?.dismiss();
    Alert.alert('Delete Listing', 'Are you sure you want to permanently delete this listing?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
          if (!property) return;
          const success = await propertyService.deleteProperty(property.id);
          if (success) router.replace('/(tabs)');
          else showAlert('Error', 'Failed to delete listing.');
      }}
    ]);
  };

  const handleShare = async () => {
    if (!property) return;
    try {
      await Share.share({
        message: `Check out this space on SpaceFinder: ${property.title} in ${property.location}.`,
        title: property.title,
      });
      if (user?.id !== property.landlord_id) propertyService.incrementShareCount(property.id);
    } catch (error) {}
  };

  if (loading && !property) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#0066FF" />
      </View>
    );
  }

  if (!property) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={colors.background === '#000000' || colors.background === '#0A0F1E' ? "light" : "dark"} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 160 }}>
        {/* Cinematic Header */}
        <View style={[styles.heroContainer, { marginTop: Math.max(insets.top, 16) + 8 }]}>
          <ScrollView 
            horizontal 
            pagingEnabled 
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            style={StyleSheet.absoluteFill}
          >
            {galleryImages.map((img, idx) => (
               <Image key={idx} source={{ uri: img }} style={{ width: HERO_WIDTH, height: 400 }} contentFit="cover" transition={400} />
            ))}
          </ScrollView>
          <LinearGradient colors={['rgba(10,15,30,0.2)', 'transparent', 'rgba(10,15,30,0.8)']} style={StyleSheet.absoluteFill} pointerEvents="none" />
          
          <View style={styles.navBar}>
            <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
              <View style={[styles.blurCircle, { backgroundColor: 'rgba(0,0,0,0.3)' }]}>
                <ChevronLeft size={24} color="#FFF" />
              </View>
            </TouchableOpacity>
            
            <View style={styles.navRight}>
              <TouchableOpacity onPress={handleShare} style={styles.iconButton}>
                <View style={[styles.blurCircle, { backgroundColor: 'rgba(0,0,0,0.3)' }]}>
                  <Share2 size={20} color="#FFF" />
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => toggleSaved(property.id)} style={styles.iconButton}>
                <View style={[styles.blurCircle, { backgroundColor: 'rgba(0,0,0,0.3)' }]}>
                  <Heart size={20} color={isSaved ? '#EF4444' : '#FFF'} fill={isSaved ? '#EF4444' : 'transparent'} />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.heroBadgeRow}>
             <Badge 
               label={property.status.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())} 
               variant={property.status === 'available' ? 'success' : property.status === 'taken' ? 'surface' : 'warning'} 
             />
             <View style={styles.featuredTag}>
                <Star size={12} color="#FFFFFF" fill="#FFFFFF" />
                <Text style={styles.featuredText}>PREMIUM LISTING</Text>
             </View>
          </View>
          <View style={styles.imageCountBadge}>
             <Camera size={14} color="#FFF" style={{ marginRight: 6 }} />
             <Text style={styles.imageCountText}>{activeImageIndex + 1} / {galleryImages.length}</Text>
          </View>
        </View>

        {/* Content Body */}
        <Animated.View entering={FadeInDown.duration(600)} style={styles.content}>
          <Text style={[styles.title, { color: colors.text }]}>{property.title}</Text>
          
          <View style={styles.locationBadgeRow}>
            <View style={styles.locationBadge}>
              <MapPin size={16} color="#0066FF" />
              <Text style={styles.locationText}>{property.location}</Text>
            </View>
            <View style={[styles.locationBadge, { backgroundColor: 'rgba(16, 185, 129, 0.08)' }]}>
              <ShieldCheck size={16} color="#10B981" />
              <Text style={[styles.locationText, { color: '#10B981' }]}>VERIFIED</Text>
            </View>
          </View>

          <View style={[styles.unifiedStatsContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.unifiedStatItem}>
                <View style={styles.statIconWrapper}>
                  <Bed size={22} color="#0066FF" />
                </View>
                <Text style={[styles.unifiedStatValue, { color: colors.text }]}>{property.bedrooms}</Text>
                <Text style={styles.unifiedStatLabel}>BEDS</Text>
            </View>
            <View style={[styles.unifiedStatDivider, { backgroundColor: colors.border }]} />
            <View style={styles.unifiedStatItem}>
                <View style={styles.statIconWrapper}>
                  <Bath size={22} color="#0066FF" />
                </View>
                <Text style={[styles.unifiedStatValue, { color: colors.text }]}>{property.bathrooms}</Text>
                <Text style={styles.unifiedStatLabel}>BATHS</Text>
            </View>
            <View style={[styles.unifiedStatDivider, { backgroundColor: colors.border }]} />
            <View style={styles.unifiedStatItem}>
                <View style={styles.statIconWrapper}>
                  <Maximize size={22} color="#0066FF" />
                </View>
                <Text style={[styles.unifiedStatValue, { color: colors.text }]}>{property.areaSize}</Text>
                <Text style={styles.unifiedStatLabel}>SQM</Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <SectionHeader title="The Space" subtitle="A detailed look at this property" light />
          <Text style={[styles.description, { color: colors.textSecondary }]}>{property.description}</Text>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <SectionHeader title="Amenities" subtitle="What this place offers" light />
          <View style={styles.amenitiesGrid}>
            {property.amenities?.map((id: string) => {
              const amenity = getAmenityById(id);
              return amenity ? (
                <View key={id} style={[styles.amenityPill, { backgroundColor: colors.surface }]}>
                  <View style={[styles.amenityIconCircle, { backgroundColor: colors.card }]}>
                    <Text style={{ fontSize: 14 }}>{amenity.icon === 'wifi-outline' ? '📶' : amenity.icon === 'car-outline' ? '🚗' : '✨'}</Text>
                  </View>
                  <Text style={[styles.amenityPillLabel, { color: colors.text }]}>{amenity.label}</Text>
                </View>
              ) : null;
            })}
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <SectionHeader title="Location" subtitle="Neighborhood overview" light />
          <View style={[styles.mapPlaceholder, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.mapIconCircle}>
              <MapPin size={24} color="#0066FF" />
            </View>
            <View style={styles.mapInfo}>
              <Text style={[styles.mapTitle, { color: colors.text }]}>{property.location}</Text>
              <Text style={styles.mapSubtitle}>Exact location provided after booking.</Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <Text style={[styles.sectionTitle, { color: colors.text }]}>Property Manager</Text>
          <View style={[styles.agentCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.agentAvatarContainer}>
              <Text style={styles.agentAvatarText}>P</Text>
              <View style={[styles.agentOnlineBadge, { borderColor: colors.card }]} />
            </View>
            <View style={styles.agentInfo}>
              <Text style={[styles.agentName, { color: colors.text }]}>Premium Host</Text>
              <Text style={styles.agentRole}>Verified Manager</Text>
            </View>
            <TouchableOpacity style={styles.agentContactBtn} onPress={handlePresentModalPress}>
              <MessageSquare size={20} color="#0066FF" />
            </TouchableOpacity>
          </View>
          
          <View style={{ height: 40 }} />
        </Animated.View>
      </ScrollView>

      {/* Premium Floating Footer */}
      <View style={[styles.footer, { backgroundColor: colors.background === '#000000' || colors.background === '#0A0F1E' ? 'rgba(10,15,30,0.95)' : 'rgba(255,255,255,0.95)', paddingBottom: Math.max(insets.bottom, 24), borderTopColor: colors.border }]}>
        <View style={styles.footerPrice}>
          <Text style={styles.footerLabel}>
            {property.pricePeriod === 'year' ? 'YEARLY RENT' : property.pricePeriod === 'full' ? 'FULL PRICE' : 'MONTHLY RENT'}
          </Text>
          <Text style={styles.footerValue}>{property.currency}{property.price.toLocaleString()}</Text>
        </View>
        <Button 
          title={isLandlord ? 'Manage Space' : 'Contact Landlord'} 
          onPress={handlePresentModalPress} 
          style={{ flex: 1.2 }}
        />
      </View>

      <BottomSheetModal
        ref={bottomSheetModalRef}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: colors.card, borderRadius: 32 }}
        handleIndicatorStyle={{ backgroundColor: colors.border, width: 40 }}
      >
        <BottomSheetView style={styles.sheetBody}>
          <Text style={[styles.sheetTitle, { color: colors.text }]}>{isLandlord ? 'Manage Your Listing' : 'Get in Touch'}</Text>
          <View style={{ gap: 12, marginTop: 24 }}>
            {isLandlord ? (
              <>
                <Button title="Edit Listing Details" variant="secondary" onPress={() => { bottomSheetModalRef.current?.dismiss(); router.push(`/property/edit/${property.id}`); }} icon={<Edit3 size={20} color="#0066FF" />} />
                <Button title="Mark as Available" variant="secondary" onPress={() => handleUpdateStatus('available')} icon={<CheckCircle2 size={20} color="#10B981" />} />
                <Button title="Mark as In Negotiations" variant="secondary" onPress={() => handleUpdateStatus('in_negotiations')} icon={<Clock size={20} color="#F59E0B" />} />
                <Button title="Mark as Taken" variant="secondary" onPress={() => handleUpdateStatus('taken')} icon={<XCircle size={20} color="#EF4444" />} />
                <Button title="Delete Listing" variant="ghost" onPress={handleDeleteProperty} icon={<Trash2 size={20} color="#EF4444" />} textStyle={{ color: '#EF4444' }} />
              </>
            ) : (
              <>
                <Button title="Message in App" onPress={handleInAppMessage} icon={<MessageSquare size={20} color={colors.background} />} />
                <Button title="Call Property Manager" variant="secondary" onPress={() => Linking.openURL(`tel:${property.landlord_phone || '0000000000'}`)} />
              </>
            )}
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  heroContainer: { height: Dimensions.get('window').height * 0.45, marginHorizontal: 16, borderRadius: 32, overflow: 'hidden', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.15, shadowRadius: 24 },
  heroImage: { width: '100%', height: '100%' },
  iconButton: {},
  navBar: { position: 'absolute', top: 16, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16 },
  navRight: { flexDirection: 'row', gap: 12 },
  blurCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  heroBadgeRow: { position: 'absolute', bottom: 20, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  featuredTag: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(10,15,30,0.8)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)' },
  featuredText: { color: '#FFFFFF', fontSize: 10, fontFamily: 'Outfit_700Bold', letterSpacing: 1 },
  content: { paddingHorizontal: 24, paddingTop: 32 },
  title: { fontSize: 34, fontFamily: 'PlayfairDisplay_700Bold', marginBottom: 16, lineHeight: 40, letterSpacing: -0.5 },
  locationBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 32 },
  locationBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,102,255,0.08)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, alignSelf: 'flex-start' },
  locationText: { fontSize: 13, fontFamily: 'Outfit_700Bold', color: '#0066FF', letterSpacing: 0.5, textTransform: 'uppercase' },
  unifiedStatsContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 28, paddingVertical: 24, marginBottom: 32, elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.08, shadowRadius: 24, borderWidth: 1 },
  unifiedStatItem: { flex: 1, alignItems: 'center', gap: 4 },
  statIconWrapper: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,102,255,0.08)', justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  unifiedStatDivider: { width: 1, height: '60%' },
  unifiedStatValue: { fontSize: 22, fontFamily: 'Outfit_700Bold' },
  unifiedStatLabel: { fontSize: 11, fontFamily: 'Outfit_600SemiBold', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 },
  description: { fontSize: 16, fontFamily: 'Outfit_400Regular', lineHeight: 28, letterSpacing: 0.2 },
  divider: { height: 1, marginVertical: 32 },
  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  amenityPill: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 100 },
  amenityIconCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4 },
  amenityPillLabel: { fontSize: 14, fontFamily: 'Outfit_600SemiBold', paddingRight: 8 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingTop: 20, flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  footerPrice: { flex: 1 },
  footerLabel: { fontSize: 10, fontFamily: 'Outfit_700Bold', color: '#6B7280', letterSpacing: 1 },
  footerValue: { fontSize: 24, fontFamily: 'Outfit_700Bold', color: '#0066FF', marginTop: 2 },
  sheetBody: { padding: 24 },
  sheetTitle: { fontSize: 24, fontFamily: 'PlayfairDisplay_700Bold', color: '#F9FAFB', textAlign: 'center' },
  mapPlaceholder: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, borderWidth: 1, gap: 16 },
  mapIconCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(0,102,255,0.08)', justifyContent: 'center', alignItems: 'center' },
  mapInfo: { flex: 1 },
  mapTitle: { fontSize: 16, fontFamily: 'Outfit_700Bold', marginBottom: 4 },
  mapSubtitle: { fontSize: 13, fontFamily: 'Outfit_400Regular', color: '#6B7280' },
  sectionTitle: { fontSize: 22, fontFamily: 'PlayfairDisplay_700Bold', marginBottom: 16 },
  agentCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 24, borderWidth: 1, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 8 },
  agentAvatarContainer: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#0066FF', justifyContent: 'center', alignItems: 'center' },
  agentAvatarText: { fontSize: 24, fontFamily: 'PlayfairDisplay_700Bold', color: '#FFF' },
  agentOnlineBadge: { position: 'absolute', bottom: 2, right: 2, width: 14, height: 14, borderRadius: 7, backgroundColor: '#10B981', borderWidth: 2 },
  agentInfo: { flex: 1, marginLeft: 16 },
  agentName: { fontSize: 16, fontFamily: 'Outfit_700Bold', marginBottom: 2 },
  agentRole: { fontSize: 13, fontFamily: 'Outfit_500Medium', color: '#6B7280' },
  agentContactBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,102,255,0.08)', justifyContent: 'center', alignItems: 'center' },
  imageCountBadge: { position: 'absolute', bottom: 20, right: 16, backgroundColor: 'rgba(10,15,30,0.7)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, flexDirection: 'row', alignItems: 'center' },
  imageCountText: { color: '#FFF', fontSize: 12, fontFamily: 'Outfit_600SemiBold', letterSpacing: 1 },
});
