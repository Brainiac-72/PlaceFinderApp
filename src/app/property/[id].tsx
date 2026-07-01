import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Dimensions, Platform, ActivityIndicator, Share, Alert } from 'react-native';
import { ChevronLeft, Share2, Heart, MapPin, Bed, Bath, Maximize, MessageSquare, Trash2, CheckCircle2, Clock, XCircle, Star } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSavedStore } from '../../store/useSavedStore';
import { useThemeColor } from '../../hooks/useThemeColor';
import { useCustomAlert } from '../../providers/AlertProvider';
import { useAuth } from '../../providers/AuthProvider';
import { getAmenityById } from '../../constants/Amenities';
import { useQuery } from '@tanstack/react-query';
import { propertyService } from '../../services/propertyService';
import { chatService } from '../../services/chatService';
import { DUMMY_PROPERTIES } from '../../data/dummyProperties';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { PremiumButton } from '../../components/premium/PremiumButton';
import { PremiumBadge } from '../../components/premium/PremiumBadge';
import { SectionHeader } from '../../components/premium/SectionHeader';
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
      <View style={[styles.center, { backgroundColor: '#0A0F1E' }]}>
        <ActivityIndicator size="large" color="#F59E0B" />
      </View>
    );
  }

  if (!property) return null;

  return (
    <View style={[styles.container, { backgroundColor: '#0A0F1E' }]}>
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 160 }}>
        {/* Cinematic Header */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: property.imageUrl }} style={styles.heroImage} contentFit="cover" transition={400} />
          <LinearGradient colors={['rgba(10,15,30,0.4)', 'transparent', 'rgba(10,15,30,0.8)']} style={StyleSheet.absoluteFill} />
          
          <SafeAreaView style={styles.navBar}>
            <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
              <BlurView intensity={60} tint="dark" style={styles.blurCircle}>
                <ChevronLeft size={24} color="#FFF" />
              </BlurView>
            </TouchableOpacity>
            
            <View style={styles.navRight}>
              <TouchableOpacity onPress={handleShare} style={styles.iconButton}>
                <BlurView intensity={60} tint="dark" style={styles.blurCircle}>
                  <Share2 size={20} color="#FFF" />
                </BlurView>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => toggleSaved(property.id)} style={styles.iconButton}>
                <BlurView intensity={60} tint="dark" style={styles.blurCircle}>
                  <Heart size={20} color={isSaved ? '#F59E0B' : '#FFF'} fill={isSaved ? '#F59E0B' : 'transparent'} />
                </BlurView>
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          <View style={styles.heroBadgeRow}>
             <PremiumBadge label={property.status} variant={property.status.toLowerCase() === 'available' ? 'success' : 'warning'} />
             <View style={styles.featuredTag}>
                <Star size={12} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.featuredText}>PREMIUM LISTING</Text>
             </View>
          </View>
        </View>

        {/* Content Body */}
        <Animated.View entering={FadeInDown.duration(600)} style={styles.content}>
          <Text style={styles.title}>{property.title}</Text>
          
          <View style={styles.locationContainer}>
            <MapPin size={18} color="#F59E0B" />
            <Text style={styles.locationText}>{property.location}</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
                <Bed size={24} color="#F59E0B" />
                <Text style={styles.statValue}>{property.bedrooms}</Text>
                <Text style={styles.statLabel}>Beds</Text>
            </View>
            <View style={styles.statBox}>
                <Bath size={24} color="#F59E0B" />
                <Text style={styles.statValue}>{property.bathrooms}</Text>
                <Text style={styles.statLabel}>Baths</Text>
            </View>
            <View style={styles.statBox}>
                <Maximize size={24} color="#F59E0B" />
                <Text style={styles.statValue}>{property.areaSize}</Text>
                <Text style={styles.statLabel}>sqm</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <SectionHeader title="The Space" subtitle="A detailed look at this property" light />
          <Text style={styles.description}>{property.description}</Text>

          <View style={styles.divider} />

          <SectionHeader title="Amenities" subtitle="What this place offers" light />
          <View style={styles.amenitiesGrid}>
            {property.amenities?.map((id: string) => {
              const amenity = getAmenityById(id);
              return amenity ? (
                <View key={id} style={styles.amenityItem}>
                  <View style={styles.amenityIcon}>
                    <Text style={{ fontSize: 16 }}>{amenity.icon === 'wifi-outline' ? '📶' : amenity.icon === 'car-outline' ? '🚗' : '✨'}</Text>
                  </View>
                  <Text style={styles.amenityLabel}>{amenity.label}</Text>
                </View>
              ) : null;
            })}
          </View>
        </Animated.View>
      </ScrollView>

      {/* Premium Floating Footer */}
      <BlurView intensity={100} tint="dark" style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <View style={styles.footerPrice}>
          <Text style={styles.footerLabel}>MONTHLY RENT</Text>
          <Text style={styles.footerValue}>{property.currency}{property.price.toLocaleString()}</Text>
        </View>
        <PremiumButton 
          title={isLandlord ? 'Manage Space' : 'Contact Landlord'} 
          onPress={handlePresentModalPress} 
          style={{ flex: 1.2 }}
        />
      </BlurView>

      <BottomSheetModal
        ref={bottomSheetModalRef}
        snapPoints={snapPoints}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: '#111827', borderRadius: 32 }}
        handleIndicatorStyle={{ backgroundColor: '#374151', width: 40 }}
      >
        <BottomSheetView style={styles.sheetBody}>
          <Text style={styles.sheetTitle}>{isLandlord ? 'Manage Your Listing' : 'Get in Touch'}</Text>
          <View style={{ gap: 12, marginTop: 24 }}>
            {isLandlord ? (
              <>
                <PremiumButton title="Mark as Available" variant="secondary" onPress={() => handleUpdateStatus('Available')} icon={<CheckCircle2 size={20} color="#10B981" />} />
                <PremiumButton title="Mark as Taken" variant="secondary" onPress={() => handleUpdateStatus('Taken')} icon={<XCircle size={20} color="#EF4444" />} />
                <PremiumButton title="Delete Listing" variant="ghost" onPress={handleDeleteProperty} icon={<Trash2 size={20} color="#EF4444" />} textStyle={{ color: '#EF4444' }} />
              </>
            ) : (
              <>
                <PremiumButton title="Message in App" onPress={handleInAppMessage} icon={<MessageSquare size={20} color="#0A0F1E" />} />
                <PremiumButton title="Call Property Manager" variant="secondary" onPress={() => Linking.openURL(`tel:${property.landlord_phone || '0000000000'}`)} />
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
  heroContainer: { height: Dimensions.get('window').height * 0.55, width: '100%' },
  heroImage: { width: '100%', height: '100%' },
  iconButton: {},
  navBar: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20 },
  navRight: { flexDirection: 'row', gap: 12 },
  blurCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  heroBadgeRow: { position: 'absolute', bottom: 40, left: 24, right: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  featuredTag: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(10,15,30,0.8)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)' },
  featuredText: { color: '#F59E0B', fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
  content: { padding: 24, borderTopLeftRadius: 32, borderTopRightRadius: 32, marginTop: -32, backgroundColor: '#0A0F1E' },
  title: { fontSize: 32, fontFamily: 'PlayfairDisplay_700Bold', color: '#F9FAFB', marginBottom: 12 },
  locationContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 32 },
  locationText: { fontSize: 16, fontFamily: 'Inter_400Regular', color: '#9CA3AF' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 32 },
  statBox: { flex: 1, backgroundColor: '#111827', padding: 20, borderRadius: 20, alignItems: 'center', borderWidth: 1, borderColor: '#1F2937' },
  statValue: { fontSize: 20, fontFamily: 'Inter_700Bold', color: '#F9FAFB', marginTop: 8 },
  statLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: '#6B7280', textTransform: 'uppercase', marginTop: 2 },
  description: { fontSize: 16, fontFamily: 'Inter_400Regular', color: '#9CA3AF', lineHeight: 26 },
  divider: { height: 1, backgroundColor: '#1F2937', marginVertical: 32 },
  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  amenityItem: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#111827', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, borderWidth: 1, borderColor: '#1F2937' },
  amenityIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#1F2937', justifyContent: 'center', alignItems: 'center' },
  amenityLabel: { color: '#F9FAFB', fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingTop: 20, flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  footerPrice: { flex: 1 },
  footerLabel: { fontSize: 10, fontFamily: 'Inter_700Bold', color: '#6B7280', letterSpacing: 1 },
  footerValue: { fontSize: 24, fontFamily: 'Inter_700Bold', color: '#F59E0B', marginTop: 2 },
  sheetBody: { padding: 24 },
  sheetTitle: { fontSize: 24, fontFamily: 'PlayfairDisplay_700Bold', color: '#F9FAFB', textAlign: 'center' },
});
