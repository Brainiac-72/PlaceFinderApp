import React, { memo } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Property } from '../utils/propertyUtils';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Image } from 'expo-image';

import { useSavedStore } from '../store/useSavedStore';
import { useThemeColor } from '../hooks/useThemeColor';

type Props = {
  property: Property;
  onPress?: () => void;
  compact?: boolean;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const PropertyCard = ({ property, onPress, compact }: Props) => {
  const isSaved = useSavedStore(state => state.isSaved(property.id));
  const toggleSaved = useSavedStore(state => state.toggleSaved);
  const { colors, isDark } = useThemeColor();

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 200 });
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 });
  };

  return (
    <AnimatedPressable 
      style={[
        styles.card, 
        { backgroundColor: colors.card, shadowColor: isDark ? '#FFF' : '#000' },
        compact && styles.cardCompact,
        animatedStyle
      ]} 
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <View style={[styles.imageContainer, compact && styles.imageContainerCompact]}>
        <Image 
          source={{ uri: property.imageUrl }} 
          style={styles.image} 
          contentFit="cover"
          transition={300}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)']}
          style={styles.gradientOverlay}
        />
        
        {/* Top Badges */}
        <View style={styles.badgeContainer}>
          <View style={[
            styles.badge, 
            { 
              backgroundColor: 
                property.status.toLowerCase() === 'available' ? colors.success : 
                property.status.toLowerCase() === 'negotiations' ? colors.warning : 
                colors.error 
            }
          ]}>
            <Text style={styles.badgeText}>{property.status}</Text>
          </View>
        </View>

        {/* Favorite Button */}
        <Pressable 
          style={[styles.favoriteButton, { backgroundColor: colors.card }]} 
          onPress={(e) => {
            e.stopPropagation();
            toggleSaved(property.id);
          }}
        >
          <Ionicons name={isSaved ? "heart" : "heart-outline"} size={20} color={isSaved ? colors.error : colors.text} />
        </Pressable>
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.headerRow}>
          <Text style={[styles.price, { color: colors.primary }, compact && styles.priceCompact]}>
            {property.currency} {property.price.toLocaleString()}
            {property.type === 'Residential' ? '/mo' : ''}
          </Text>
          <View style={[styles.typeBadge, { backgroundColor: colors.background }]}>
            <Text style={[styles.typeText, { color: colors.textSecondary }]}>{property.type}</Text>
          </View>
        </View>

        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{property.title}</Text>

        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
          <Text style={[styles.locationText, { color: colors.textSecondary }]} numberOfLines={1}>{property.location}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.amenitiesRow}>
          {property.bedrooms !== undefined && property.bedrooms !== null && (
            <View style={styles.amenity}>
              <Ionicons name="bed-outline" size={18} color={colors.textSecondary} />
              <Text style={[styles.amenityText, { color: colors.textSecondary }]}>{property.bedrooms} Beds</Text>
            </View>
          )}
          {property.bathrooms !== undefined && property.bathrooms !== null && (
            <View style={styles.amenity}>
              <Ionicons name="water-outline" size={18} color={colors.textSecondary} />
              <Text style={[styles.amenityText, { color: colors.textSecondary }]}>{property.bathrooms} Baths</Text>
            </View>
          )}
          {property.areaSize !== undefined && property.areaSize !== null && (
            <View style={styles.amenity}>
              <Ionicons name="scan-outline" size={18} color={colors.textSecondary} />
              <Text style={[styles.amenityText, { color: colors.textSecondary }]}>{property.areaSize} sqm</Text>
            </View>
          )}
        </View>
      </View>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    marginBottom: 24,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  imageContainer: {
    height: 240,
    width: '100%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  badgeContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
  },
  badge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  favoriteButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    borderRadius: 20,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  detailsContainer: {
    padding: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  price: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationText: {
    fontSize: 15,
    marginLeft: 6,
    fontWeight: '400',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginBottom: 16,
  },
  amenitiesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  amenity: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amenityText: {
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '500',
  },
  cardCompact: {
    marginHorizontal: 0,
    marginBottom: 0,
    borderRadius: 20,
  },
  imageContainerCompact: {
    height: 160,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  priceCompact: {
    fontSize: 18,
  },
});

export default memo(PropertyCard);
