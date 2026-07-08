import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Heart, Star } from 'lucide-react-native';
import { useThemeColor } from '../hooks/useThemeColor';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { Property } from '../utils/propertyUtils';
import { useSavedStore } from '../store/useSavedStore';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.7; // As per the image ratio

interface SpotlightCardProps {
  property: Property;
  onPress: () => void;
}

const SpotlightCard = ({ property, onPress }: SpotlightCardProps) => {
  const { colors } = useThemeColor();
  const isSaved = useSavedStore(state => state.isSaved(property.id));
  const toggleSaved = useSavedStore(state => state.toggleSaved);

  return (
    <TouchableOpacity 
      activeOpacity={0.9} 
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
      }}
      style={styles.container}
    >
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: property.imageUrl }} 
          style={styles.image} 
          contentFit="cover"
          transition={300}
        />
        <TouchableOpacity 
          style={styles.heartCircle}
          activeOpacity={0.7}
          onPress={(e) => {
            e.stopPropagation();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            toggleSaved(property.id);
          }}
        >
          <Heart 
            size={18} 
            color={isSaved ? '#EF4444' : '#000'} 
            fill={isSaved ? '#EF4444' : 'transparent'} 
          />
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.ratingRow}>
          <Star size={14} color="#FF6B00" fill="#FF6B00" />
          <Text style={[styles.ratingText, { color: colors.text }]}>4.9</Text>
          <Text style={styles.reviewsText}>(12)</Text>
        </View>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {property.title}
        </Text>
        <Text style={[styles.price, { color: colors.text }]}>
          {property.currency}{property.price} <Text style={styles.perDay}>/ day</Text>
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    marginRight: 16,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1.3,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 12,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  heartCircle: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoContainer: {
    gap: 4,
    paddingHorizontal: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  ratingText: {
    fontSize: 14,
    fontFamily: 'Outfit_700Bold',
    fontWeight: '700',
  },
  reviewsText: {
    fontSize: 14,
    fontFamily: 'Outfit_400Regular',
    color: '#6B7280',
  },
  title: {
    fontSize: 16,
    fontFamily: 'Outfit_700Bold',
    fontWeight: '700',
  },
  price: {
    fontSize: 16,
    fontFamily: 'Outfit_700Bold',
    fontWeight: '700',
    marginTop: 2,
  },
  perDay: {
    fontFamily: 'Outfit_400Regular',
    color: '#6B7280',
    fontWeight: '400',
  },
});

export default memo(SpotlightCard);
