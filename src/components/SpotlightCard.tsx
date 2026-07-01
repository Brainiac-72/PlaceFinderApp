import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { MapPin, Star } from 'lucide-react-native';
import { useThemeColor } from '../hooks/useThemeColor';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { Property } from '../utils/propertyUtils';
import { PremiumBadge } from './premium/PremiumBadge';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 48;

interface SpotlightCardProps {
  property: Property;
  onPress: () => void;
}

/**
 * A large, visually prominent card used for featured or 'Spotlight' properties.
 * Designed to be swiped through in a horizontal carousel at the top of the Home feed.
 */
const SpotlightCard = ({ property, onPress }: SpotlightCardProps) => {
  const { colors } = useThemeColor();

  return (
    <TouchableOpacity 
      activeOpacity={0.9} 
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
      }}
      style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <Image 
        source={{ uri: property.imageUrl }} 
        style={styles.image} 
        contentFit="cover"
        transition={300}
      />
      
      <View style={styles.badgeContainer}>
        <View style={styles.premiumBadge}>
          <Star size={12} color="#F59E0B" fill="#F59E0B" />
          <Text style={styles.premiumText}>SPOTLIGHT</Text>
        </View>
      </View>

      <LinearGradient
        colors={['transparent', 'rgba(10,15,30,0.95)']}
        style={styles.gradient}
      >
        <View style={styles.infoContainer}>
          <Text style={styles.title} numberOfLines={1}>{property.title}</Text>
          
          <View style={styles.bottomRow}>
            <View style={styles.locationRow}>
              <MapPin size={16} color="#F59E0B" />
              <Text style={styles.locationText} numberOfLines={1}>{property.location}</Text>
            </View>
            <View style={[styles.priceTag, { backgroundColor: '#F59E0B' }]}>
                <Text style={styles.priceText}>
                    {property.currency}{property.price.toLocaleString()}
                </Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: 380,
    borderRadius: 24,
    marginRight: 16,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 10,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badgeContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 2,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10,15,30,0.8)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
    gap: 6,
  },
  premiumText: {
    color: '#F59E0B',
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    justifyContent: 'flex-end',
    padding: 24,
  },
  infoContainer: {
    gap: 12,
  },
  title: {
    color: '#F9FAFB',
    fontSize: 28,
    fontFamily: 'PlayfairDisplay_700Bold',
    letterSpacing: -0.5,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  locationText: {
    color: '#9CA3AF',
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  priceTag: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  priceText: {
    color: '#0A0F1E',
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
  },
});

export default memo(SpotlightCard);
