import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '../hooks/useThemeColor';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Property } from '../utils/propertyUtils';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.82;

interface SpotlightCardProps {
  property: Property;
  onPress: () => void;
}

const SpotlightCard = ({ property, onPress }: SpotlightCardProps) => {
  const { colors } = useThemeColor();

  return (
    <TouchableOpacity 
      activeOpacity={0.9} 
      onPress={onPress}
      style={[styles.container, { backgroundColor: colors.card }]}
    >
      <Image 
        source={{ uri: property.imageUrl }} 
        style={styles.image} 
        contentFit="cover"
        transition={300}
      />
      
      {/* Premium Badge */}
      <View style={[styles.badge, { backgroundColor: colors.primary }]}>
        <Ionicons name="sparkles" size={12} color="#fff" style={{ marginRight: 4 }} />
        <Text style={styles.badgeText}>FEATURED</Text>
      </View>

      {/* Info Overlay */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.gradient}
      >
        <View style={styles.infoContainer}>
          <Text style={styles.title} numberOfLines={1}>{property.title}</Text>
          
          <View style={styles.bottomRow}>
            <View style={styles.locationRow}>
              <Ionicons name="location-sharp" size={14} color="#EBEBF5" />
              <Text style={styles.locationText} numberOfLines={1}>{property.location}</Text>
            </View>
            <View style={styles.priceContainer}>
                <Text style={styles.priceText}>
                    {property.currency} {property.price.toLocaleString()}
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
    height: 220,
    borderRadius: 24,
    marginRight: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    top: 16,
    left: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    justifyContent: 'flex-end',
    padding: 20,
  },
  infoContainer: {
    gap: 4,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
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
    gap: 4,
    flex: 1,
  },
  locationText: {
    color: '#EBEBF5',
    fontSize: 13,
    fontWeight: '500',
  },
  priceContainer: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  priceText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default memo(SpotlightCard);
