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

/**
 * A primitive loading placeholder component that continuously shimmers/pulses.
 * Used to indicate that content is currently being fetched.
 */
export const Skeleton = ({ width, height, borderRadius = 8, style }: SkeletonProps) => {
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
        'rgba(0, 102, 255, 0.05)', // Shimmer with Blue hint
        'rgba(0, 102, 255, 0.15)'
      ]
    );

    return { backgroundColor };
  });

  return (
    <Animated.View 
      style={[
        { width, height, borderRadius, backgroundColor: '#111827' }, 
        animatedStyle,
        style
      ]} 
    />
  );
};

/**
 * A pre-composed skeleton layout that mimics the exact shape of a `PropertyCard`.
 * Ideal for displaying while property feeds are loading.
 */
export const PropertyCardSkeleton = ({ gridMode }: { gridMode?: boolean }) => {
  const { colors } = useThemeColor();
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, gridMode && styles.cardGrid]}>
      <Skeleton width={110} height="100%" borderRadius={16} />
      <View style={styles.content}>
        <View style={styles.headerRow}>
           <Skeleton width="80%" height={20} borderRadius={4} />
        </View>
        <Skeleton width="50%" height={14} borderRadius={4} style={{ marginBottom: 12 }} />
        <View style={styles.row}>
          <Skeleton width="20%" height={14} borderRadius={4} />
          <Skeleton width="20%" height={14} borderRadius={4} />
          <Skeleton width="20%" height={14} borderRadius={4} />
        </View>
        <View style={[styles.row, { marginTop: 'auto', justifyContent: 'space-between' }]}>
          <Skeleton width="40%" height={24} borderRadius={6} />
          <Skeleton width="25%" height={24} borderRadius={12} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    height: 140,
    marginBottom: 16,
    padding: 12,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    alignItems: 'center',
  },
  cardGrid: {
    marginBottom: 0,
  },
  content: {
    flex: 1,
    marginLeft: 16,
    height: '100%',
    paddingVertical: 2,
  },
  headerRow: {
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  divider: {
    display: 'none',
  }
});
