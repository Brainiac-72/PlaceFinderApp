import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat, 
  withTiming, 
  withSequence,
  interpolateColor
} from 'react-native-reanimated';
import { useThemeColor } from '../hooks/useThemeColor';
import { DimensionValue } from 'react-native';

interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton = ({ width, height, borderRadius = 8, style }: SkeletonProps) => {
  const { isDark } = useThemeColor();
  const shimmerValue = useSharedValue(0);

  useEffect(() => {
    shimmerValue.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      shimmerValue.value,
      [0, 1],
      [
        isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
        isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)'
      ]
    );

    return { backgroundColor };
  });

  return (
    <Animated.View 
      style={[
        { width, height, borderRadius }, 
        animatedStyle,
        style
      ]} 
    />
  );
};

export const PropertyCardSkeleton = () => {
  const { colors } = useThemeColor();
  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <Skeleton width="100%" height={240} borderRadius={24} style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }} />
      <View style={styles.content}>
        <View style={styles.headerRow}>
           <Skeleton width="40%" height={28} borderRadius={4} />
           <Skeleton width="25%" height={24} borderRadius={12} />
        </View>
        <Skeleton width="85%" height={22} borderRadius={4} style={{ marginBottom: 12 }} />
        <Skeleton width="60%" height={18} borderRadius={4} style={{ marginBottom: 20 }} />
        <View style={styles.divider} />
        <View style={styles.row}>
          <Skeleton width="25%" height={18} borderRadius={4} />
          <Skeleton width="25%" height={18} borderRadius={4} />
          <Skeleton width="25%" height={18} borderRadius={4} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 24,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
  },
  content: {
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginBottom: 16,
  }
});
