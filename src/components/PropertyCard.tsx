import React, { memo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MapPin, Bed, Bath, Maximize, Heart } from 'lucide-react-native';
import { Property } from '../utils/propertyUtils';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useSavedStore } from '../store/useSavedStore';
import { useThemeColor } from '../hooks/useThemeColor';
import { PremiumBadge } from './premium/PremiumBadge';

type Props = {
  property: Property;
  onPress?: () => void;
  compact?: boolean;
  gridMode?: boolean;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const PropertyCard = ({ property, onPress, compact, gridMode }: Props) => {
  const isSaved = useSavedStore(state => state.isSaved(property.id));
  const toggleSaved = useSavedStore(state => state.toggleSaved);
  const { colors } = useThemeColor();

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSpring(0.98);
  };
  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <AnimatedPressable 
      style={[
        styles.card, 
        { backgroundColor: colors.card, borderColor: colors.border },
        animatedStyle
      ]} 
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: property.imageUrl }} 
          style={styles.image} 
          contentFit="cover"
          transition={300}
        />
        <LinearGradient
          colors={['transparent', 'rgba(10,15,30,0.8)']}
          style={styles.gradientOverlay}
        />
        
        <View style={styles.topActions}>
          <PremiumBadge 
            label={property.status} 
            variant={
              property.status.toLowerCase() === 'available' ? 'success' : 
              property.status.toLowerCase() === 'negotiations' ? 'warning' : 'error'
            }
          />
          <Pressable 
            style={[styles.favoriteButton, { backgroundColor: 'rgba(10,15,30,0.6)' }]} 
            onPress={(e) => {
              e.stopPropagation();
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              toggleSaved(property.id);
            }}
          >
            <Heart size={20} color={isSaved ? '#F59E0B' : '#F9FAFB'} fill={isSaved ? '#F59E0B' : 'transparent'} />
          </Pressable>
        </View>

        <View style={styles.priceOverlay}>
          <Text style={[styles.priceText, { color: '#F9FAFB' }]}>
            {property.currency}{property.price.toLocaleString()}
            <Text style={styles.priceSub}> /mo</Text>
          </Text>
        </View>
      </View>

      <View style={styles.detailsContainer}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {property.title}
        </Text>

        <View style={styles.locationRow}>
          <MapPin size={14} color={colors.primary} />
          <Text style={[styles.locationText, { color: colors.textSecondary }]} numberOfLines={1}>
            {property.location}
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        
        <View style={styles.amenitiesRow}>
          <View style={styles.amenity}>
            <Bed size={16} color={colors.textSecondary} />
            <Text style={[styles.amenityText, { color: colors.textSecondary }]}>{property.bedrooms}</Text>
          </View>
          <View style={styles.amenity}>
            <Bath size={16} color={colors.textSecondary} />
            <Text style={[styles.amenityText, { color: colors.textSecondary }]}>{property.bathrooms}</Text>
          </View>
          <View style={styles.amenity}>
            <Maximize size={16} color={colors.textSecondary} />
            <Text style={[styles.amenityText, { color: colors.textSecondary }]}>{property.areaSize}m²</Text>
          </View>
        </View>
      </View>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 8,
  },
  imageContainer: {
    height: 220,
    width: '100%',
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
  topActions: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  favoriteButton: {
    borderRadius: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  priceOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 16,
  },
  priceText: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
  },
  priceSub: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    opacity: 0.8,
  },
  detailsContainer: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    fontWeight: '600',
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 4,
  },
  locationText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  divider: {
    height: 1,
    marginBottom: 12,
  },
  amenitiesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  amenity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  amenityText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
});

export default memo(PropertyCard);
