import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useThemeColor } from '../../hooks/useThemeColor';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  style?: ViewStyle;
  light?: boolean;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  style,
  light = false,
}) => {
  const { colors } = useThemeColor();

  return (
    <View style={[styles.container, style]}>
      <Text 
        style={[
          styles.title, 
          { color: colors.text, fontFamily: light ? 'Inter_600SemiBold' : 'PlayfairDisplay_700Bold' }
        ]}
      >
        {title}
      </Text>
      {subtitle && (
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {subtitle}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
  },
});
