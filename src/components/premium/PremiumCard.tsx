import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useThemeColor } from '../../hooks/useThemeColor';

interface PremiumCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  elevated?: boolean;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export const PremiumCard: React.FC<PremiumCardProps> = ({
  children,
  onPress,
  style,
  elevated = false,
}) => {
  const { colors } = useThemeColor();
  const translateY = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const onPressIn = () => {
    if (onPress) translateY.value = withSpring(-4);
  };

  const onPressOut = () => {
    if (onPress) translateY.value = withSpring(0);
  };

  return (
    <AnimatedTouchable
      activeOpacity={onPress ? 0.9 : 1}
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={[
        styles.card,
        { 
          backgroundColor: elevated ? colors.surface : colors.card,
          borderColor: colors.border,
        },
        animatedStyle,
        style,
      ]}
    >
      {children}
    </AnimatedTouchable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 8,
  },
});
