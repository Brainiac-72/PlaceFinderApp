import React, { memo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MapPin, Bed, Bath, Star, Heart } from 'lucide-react-native';
import { Property, formatPricePeriod } from '../utils/propertyUtils';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useSavedStore } from '../store/useSavedStore';
import { useThemeColor } from '../hooks/useThemeColor';
import { Badge } from './ui/Badge';

type Props = {
  property: Property;
  onPress?: () => void;
  compact?: boolean;
  gridMode?: boolean;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * A highly compact, modern horizontal card design used for 'Recently Added'
 * and lists where vertical space needs to be optimized while remaining beautiful.
 */
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
    scale.value = withSpring(0.97);
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
        <View style={styles.favoriteContainer}>
          <Pressable 
            style={styles.favoriteButton}
            hitSlop={10}
            onPress={(e) => {
              e.stopPropagation();
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              toggleSaved(property.id);
            }}
          >
            <Heart size={16} color={isSaved ? '#EF4444' : '#000'} fill={isSaved ? '#EF4444' : 'transparent'} />
          </Pressable>
        </View>
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {property.title}
          </Text>
        </View>

        <View style={styles.locationRow}>
          <MapPin size={14} color="#0066FF" />
          <Text style={[styles.locationText, { color: colors.textSecondary }]} numberOfLines={1}>
            {property.location}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Bed size={14} color={colors.textSecondary} />
            <Text style={[styles.statText, { color: colors.textSecondary }]}>{property.bedrooms}</Text>
          </View>
          <View style={styles.statDot} />
          <View style={styles.statItem}>
            <Bath size={14} color={colors.textSecondary} />
            <Text style={[styles.statText, { color: colors.textSecondary }]}>{property.bathrooms}</Text>
          </View>
          <View style={styles.statDot} />
          <View style={styles.statItem}>
            <Star size={14} color="#FF6B00" fill="#FF6B00" />
            <Text style={[styles.statText, { color: colors.textSecondary }]}>4.9</Text>
          </View>
        </View>

        <View style={styles.footerRow}>
          <Text style={[styles.priceText, { color: colors.text }]}>
            {property.currency}{property.price.toLocaleString()}
            <Text style={styles.priceSub}>{formatPricePeriod(property.pricePeriod)}</Text>
          </Text>
          
          <Badge 
            label={property.status} 
            variant={
              property.status.toLowerCase() === 'available' ? 'success' : 
              property.status.toLowerCase() === 'negotiations' ? 'warning' : 'error'
            }
          />
        </View>
      </View>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
    alignItems: 'center',
    height: 140,
  },
  imageContainer: {
    width: 110,
    height: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  favoriteContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  favoriteButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  detailsContainer: {
    flex: 1,
    marginLeft: 16,
    height: '100%',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 17,
    fontFamily: 'Outfit_700Bold',
    fontWeight: '700',
    flex: 1,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    fontFamily: 'Outfit_600SemiBold',
  },
  statDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#9CA3AF',
    marginHorizontal: 8,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  priceText: {
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
    fontWeight: '700',
  },
  priceSub: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    fontWeight: '400',
    color: '#6B7280',
  },
});

export default memo(PropertyCard);
