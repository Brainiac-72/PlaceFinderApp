import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { useThemeColor } from '../../hooks/useThemeColor';

interface PremiumAvatarProps {
  uri?: string;
  name?: string;
  size?: number;
  online?: boolean;
  style?: ViewStyle;
}

export const PremiumAvatar: React.FC<PremiumAvatarProps> = ({
  uri,
  name,
  size = 48,
  online = false,
  style,
}) => {
  const { colors } = useThemeColor();

  const fallbackUri = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=1F2937&color=F9FAFB`;

  return (
    <View style={[{ width: size, height: size }, style]}>
      <Image
        source={{ uri: uri || fallbackUri }}
        style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor: colors.border }}
        contentFit="cover"
        transition={200}
      />
      {online && (
        <View 
          style={[
            styles.indicator, 
            { 
              backgroundColor: colors.success, 
              borderColor: colors.background,
              width: size * 0.25,
              height: size * 0.25,
              borderRadius: (size * 0.25) / 2,
              bottom: 2,
              right: 2,
            }
          ]} 
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  indicator: {
    position: 'absolute',
    borderWidth: 2,
  },
});
