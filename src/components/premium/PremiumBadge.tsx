import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useThemeColor } from '../../hooks/useThemeColor';

interface PremiumBadgeProps {
  label: string;
  variant?: 'primary' | 'success' | 'error' | 'warning' | 'surface';
  style?: ViewStyle;
}

export const PremiumBadge: React.FC<PremiumBadgeProps> = ({
  label,
  variant = 'surface',
  style,
}) => {
  const { colors } = useThemeColor();

  const getVariantStyle = () => {
    switch (variant) {
      case 'primary': return { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: colors.primary };
      case 'success': return { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: colors.success };
      case 'error': return { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: colors.error };
      case 'warning': return { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: colors.warning };
      default: return { backgroundColor: colors.surface, borderColor: colors.border };
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'primary': return { color: colors.primary };
      case 'success': return { color: colors.success };
      case 'error': return { color: colors.error };
      case 'warning': return { color: colors.warning };
      default: return { color: colors.textSecondary };
    }
  };

  return (
    <View style={[styles.badge, getVariantStyle(), style]}>
      <Text style={[styles.text, getTextStyle()]}>{label.toUpperCase()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    fontWeight: '700',
    letterSpacing: 1,
  },
});
