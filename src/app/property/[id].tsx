import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Dimensions, Platform, ActivityIndicator, Linking, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useSavedStore } from '../../store/useSavedStore';
import { useThemeColor } from '../../hooks/useThemeColor';
import { useCustomAlert } from '../../providers/AlertProvider';
import { useAuth } from '../../providers/AuthProvider';
import { getAmenityById } from '../../constants/Amenities';
import { useQuery } from '@tanstack/react-query';
import { propertyService } from '../../services/propertyService';
import { DUMMY_PROPERTIES } from '../../data/dummyProperties';
import { Image } from 'expo-image';
import { formatPhoneForWhatsApp } from '../../utils/phoneUtils';

const { width } = Dimensions.get('window');

export default function PropertyDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useThemeColor();
  const { showAlert } = useCustomAlert();
  
  const { user } = useAuth();

  // 1. Fetch Property Data with React Query
  const { 
    data: property, 
    isLoading: loading, 
    refetch 
  } = useQuery({
    queryKey: ['property', id],
    queryFn: () => propertyService.getPropertyById(id!),
    enabled: !!id,
    initialData: () => {
        // Optimistically use dummy data if it matches
        return DUMMY_PROPERTIES.find(p => p.id === id) as any;
    }
  });

  const ownerPhone = property?.owner_phone || (property as any)?.ownerContact;
  const actionLoading = false; // Simplified for now, or move to a separate mutation state

  const isOwner = useMemo(() => {
    return user && property && user.id === property.owner_id;
  }, [user, property]);

  const isSaved = useSavedStore(state => state.isSaved(id || ''));
  const toggleSaved = useSavedStore(state => state.toggleSaved);

  // 2. Increment View Count in background
  useEffect(() => {
    if (id && user && property && user.id !== property.owner_id) {
        propertyService.incrementViewCount(id);
    }
  }, [id, user?.id, !!property]);

  const handleManageListing = () => {
    if (!property) return;

    showAlert(
      'Manage Listing',
      'What would you like to do with this property?',
      [
        { 
          text: 'Update Status', 
          onPress: () => {
            showAlert(
              'Update Status',
              'Select current occupancy status:',
              [
                { text: 'Available', onPress: () => performStatusUpdate('Available') },
                { text: 'Negotiations', onPress: () => performStatusUpdate('Negotiations') },
                { text: 'Taken', onPress: () => performStatusUpdate('Taken') },
                { text: 'Cancel', style: 'cancel' }
              ]
            );
          } 
        },
        { 
          text: 'Make Changes', 
          onPress: () => router.push(`/property/edit/${property.id}`)
        },
        { 
          text: 'Delete Listing', 
          style: 'destructive',
          onPress: () => {
            showAlert(
              'Delete Listing',
              'Are you absolutely sure? This cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: performDelete }
              ]
            );
          } 
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const performStatusUpdate = async (newStatus: string) => {
    // This should ideally be a mutation
    showAlert('Coming Soon', 'Status updates via mutations will be implemented next.');
  };

  const performDelete = async () => {
    // This should ideally be a mutation
    showAlert('Coming Soon', 'Delete via mutations will be implemented next.');
  };

  const handleShare = async () => {
    if (!property) return;
    try {
      await Share.share({
        message: `Check out this space on SpaceFinder Ghana: ${property.title} in ${property.location}. Price: ${property.currency} ${property.price.toLocaleString()}`,
        title: property.title,
      });

      // Increment share count in background
      if (user?.id !== property.owner_id) {
        propertyService.incrementShareCount(property.id);
      }
    } catch (error: any) {
      console.error('Error sharing property:', error.message);
    }
  };

  if (loading && !property) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!property) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>Property not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backBtnError, { backgroundColor: colors.primary }]}>
          <Text style={styles.backText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Header Image */}
        <View style={styles.imageHeader}>
          <Image 
            source={{ uri: property.imageUrl }} 
            style={styles.image} 
            contentFit="cover"
            transition={300}
          />
          
          <SafeAreaView style={styles.topActions}>
            <TouchableOpacity 
              style={[styles.circleButton, { marginTop: Platform.OS === 'android' ? 16 : 0, backgroundColor: colors.card }]} 
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            
            <View style={styles.rightActions}>
              <TouchableOpacity 
                style={[styles.circleButton, { marginTop: Platform.OS === 'android' ? 16 : 0, backgroundColor: colors.card }]} 
                onPress={handleShare}
              >
                <Ionicons name="share-social-outline" size={22} color={colors.text} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.circleButton, { marginTop: Platform.OS === 'android' ? 16 : 0, backgroundColor: colors.card }]} 
                onPress={() => toggleSaved(property.id)}
              >
                <Ionicons name={isSaved ? "heart" : "heart-outline"} size={22} color={isSaved ? colors.error : colors.text} />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>

        {/* Content Body */}
        <View style={[styles.body, { backgroundColor: colors.background }]}>
          
          {/* Listing Insights for Owner */}
          {isOwner && (
            <View style={[styles.insightsContainer, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}>
              <View style={styles.insightHeader}>
                <View style={[styles.insightDot, { backgroundColor: colors.primary }]} />
                <Text style={[styles.insightTitle, { color: colors.primary }]}>Listing Performance</Text>
              </View>
              <View style={styles.insightStats}>
                <View style={styles.statItem}>
                  <Ionicons name="eye-outline" size={20} color={colors.text} />
                  <View>
                    <Text style={[styles.statValue, { color: colors.text }]}>{property.viewCount || 0}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Views</Text>
                  </View>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                <View style={styles.statItem}>
                  <Ionicons name="share-social-outline" size={20} color={colors.text} />
                  <View>
                    <Text style={[styles.statValue, { color: colors.text }]}>{property.shareCount || 0}</Text>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total Shares</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          <View style={styles.badgeContainer}>
            <View style={[styles.typeBadge, { backgroundColor: colors.card }]}>
              <Text style={[styles.typeText, { color: colors.primary }]}>{property.type}</Text>
            </View>
            <View style={[
              styles.statusBadge, 
              { 
                backgroundColor: 
                  property.status.toLowerCase() === 'available' ? colors.success : 
                  property.status.toLowerCase() === 'negotiations' ? colors.warning : 
                  colors.error 
              }
            ]}>
              <Text style={styles.statusText}>{property.status}</Text>
            </View>
          </View>

          <Text style={[styles.title, { color: colors.text }]}>{property.title}</Text>
          
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={18} color={colors.primary} />
            <Text style={[styles.locationText, { color: colors.textSecondary }]}>{property.location}</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Overview */}
          {property.description && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Overview</Text>
              <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>{property.description}</Text>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
            </>
          )}

          {/* Features Row */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Main Features</Text>
          <View style={styles.featuresRow}>
            {property.bedrooms !== undefined && property.bedrooms !== null && (
              <View style={[styles.featureBox, { backgroundColor: colors.card, shadowColor: isDark ? '#FFF' : '#000' }]}>
                <Ionicons name="bed-outline" size={28} color={colors.text} />
                <Text style={[styles.featureLabel, { color: colors.text }]}>{property.bedrooms} Bed</Text>
              </View>
            )}
            {property.bathrooms !== undefined && property.bathrooms !== null && (
              <View style={[styles.featureBox, { backgroundColor: colors.card, shadowColor: isDark ? '#FFF' : '#000' }]}>
                <Ionicons name="water-outline" size={28} color={colors.text} />
                <Text style={[styles.featureLabel, { color: colors.text }]}>{property.bathrooms} Bath</Text>
              </View>
            )}
            {property.areaSize !== undefined && property.areaSize !== null && (
              <View style={[styles.featureBox, { backgroundColor: colors.card, shadowColor: isDark ? '#FFF' : '#000' }]}>
                <Ionicons name="map-outline" size={28} color={colors.text} />
                <Text style={[styles.featureLabel, { color: colors.text }]}>{property.areaSize} sqm</Text>
              </View>
            )}
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* New Dynamic Amenities Section */}
          {property.amenities && property.amenities.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Space Amenities</Text>
              <View style={styles.amenitiesGrid}>
                {property.amenities.map((amenityId: string, idx: number) => {
                  const amenity = getAmenityById(amenityId);
                  if (!amenity) return null;
                  return (
                    <View key={idx} style={[styles.amenityCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <View style={[styles.amenityIconContainer, { backgroundColor: colors.primary + '10' }]}>
                        <Ionicons name={amenity.icon as any} size={20} color={colors.primary} />
                      </View>
                      <Text style={[styles.amenityLabel, { color: colors.textSecondary }]}>{amenity.label}</Text>
                    </View>
                  );
                })}
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
            </>
          )}

          {/* Dummy Map Placeholder */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Map Location</Text>
          <View style={[styles.mapPlaceholder, { backgroundColor: colors.card }]}>
            <Ionicons name="map" size={48} color={colors.border} />
            <Text style={[styles.mapText, { color: colors.textSecondary }]}>Google Maps Integration Pending</Text>
          </View>
        </View>
      </ScrollView>

      {/* Floating Bottom Action */}
      <View style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.priceContainer}>
          <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Price</Text>
          <Text style={[styles.priceValue, { color: colors.primary }]}>
            {property.currency} {property.price.toLocaleString()}
            {property.type === 'Residential' ? '/mo' : ''}
          </Text>
        </View>
        {isOwner ? (
          <TouchableOpacity 
            style={[styles.manageBtn, { backgroundColor: '#1C1C1E' }]}
            onPress={handleManageListing}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="settings-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.manageBtnText}>Manage Listing</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={[styles.contactBtn, { backgroundColor: colors.primary }]}
            onPress={() => {
              if (!ownerPhone) {
                showAlert('Owner unavailable', 'This owner has not provided a valid phone number.');
                return;
              }

              const formattedPhone = formatPhoneForWhatsApp(ownerPhone);
              const message = `Hello! I saw your property "${property.title}" in ${property.location} on SpaceFinder. Is it still available?`;
              
              showAlert(
                'Contact Options',
                'Would you like to send a direct message, or physically attach the image?',
                [
                  {
                    text: 'Direct Text Message',
                    onPress: () => {
                      const url = `whatsapp://send?phone=${formattedPhone}&text=${encodeURIComponent(message + `\n\nReference Link: ${property.imageUrl}`)}`;
                      Linking.canOpenURL(url).then(supported => {
                        if (supported) {
                          Linking.openURL(url);
                        } else {
                          Linking.openURL(`tel:${formattedPhone}`);
                        }
                      });
                    }
                  },
                  {
                    text: 'Attach Image (Share)',
                    onPress: async () => {
                      try {
                        const destination = new File(Paths.cache, 'property-reference.jpg');
                        const file = await File.downloadFileAsync(
                          property.imageUrl,
                          destination
                        );
                        const uri = file.uri;
                        await Sharing.shareAsync(uri, {
                          dialogTitle: message,
                          mimeType: 'image/jpeg',
                          UTI: 'public.jpeg'
                        });
                      } catch (e) {
                        showAlert('Error', 'Failed to attach image');
                        console.error(e);
                      }
                    }
                  },
                  { text: 'Cancel', style: 'cancel' }
                ]
              );
            }}
          >
            <Text style={styles.contactBtnText}>Contact Owner</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    marginBottom: 16,
  },
  backBtnError: {
    padding: 12,
    borderRadius: 8,
  },
  backText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  imageHeader: {
    width: '100%',
    height: 350,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  topActions: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  rightActions: {
    flexDirection: 'row',
    gap: 12,
  },
  circleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    padding: 24,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  typeText: {
    fontWeight: '600',
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationText: {
    fontSize: 16,
  },
  divider: {
    height: 1,
    marginVertical: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 24,
  },
  featuresRow: {
    flexDirection: 'row',
    gap: 16,
  },
  featureBox: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  featureLabel: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  mapPlaceholder: {
    height: 200,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapText: {
    marginTop: 12,
    fontWeight: '500',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 10,
    borderTopWidth: 1,
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  contactBtn: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  manageBtn: {
    flex: 2,
    height: 54,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  manageBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  amenityCard: {
    width: (width - 72) / 3,
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  amenityIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  amenityLabel: {
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  insightsContainer: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  insightDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  insightTitle: {
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  insightStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statDivider: {
    width: 1,
    height: 30,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
});
