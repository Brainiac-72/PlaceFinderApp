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
        'rgba(245, 158, 11, 0.05)', // Shimmer with Gold hint
        'rgba(245, 158, 11, 0.15)'
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

export const PropertyCardSkeleton = ({ gridMode }: { gridMode?: boolean }) => {
  const { colors } = useThemeColor();
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, gridMode && styles.cardGrid]}>
      <Skeleton width="100%" height={220} borderRadius={16} style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }} />
      <View style={styles.content}>
        <View style={styles.headerRow}>
           <Skeleton width="70%" height={24} borderRadius={4} />
        </View>
        <Skeleton width="40%" height={16} borderRadius={4} style={{ marginBottom: 12 }} />
        <View style={styles.divider} />
        <View style={styles.row}>
          <Skeleton width="25%" height={16} borderRadius={4} />
          <Skeleton width="25%" height={16} borderRadius={4} />
          <Skeleton width="25%" height={16} borderRadius={4} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
  cardGrid: {
    marginBottom: 0,
  },
  content: {
    padding: 16,
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
    backgroundColor: '#1F2937',
    marginBottom: 16,
  }
});
