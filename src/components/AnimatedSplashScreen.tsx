import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming
} from "react-native-reanimated";

interface AnimatedSplashScreenProps {
  isAppReady: boolean;
}

/**
 * A custom splash screen component that replaces the native splash screen smoothly.
 * It animates an infinite pulsing logo until the app finishes loading (`isAppReady`),
 * and then plays an exit animation before unmounting.
 */
export function AnimatedSplashScreen({
  isAppReady,
}: AnimatedSplashScreenProps) {
  const [isAnimationComplete, setIsAnimationComplete] = useState(false);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  // Hide the native splash screen immediately when this component mounts
  // so we can seamlessly transition to our JS-based animated screen.
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {
      // Ignore if already hidden
    });
  }, []);

  useEffect(() => {
    if (!isAppReady) {
      // Start an infinite pulsing/breathing animation immediately while the app loads
      scale.value = withRepeat(
        withTiming(1.05, { duration: 500, easing: Easing.inOut(Easing.ease) }),
        -1, // infinite
        true, // reverse back and forth
      );
    } else {
      // Instantly finish animation, no delay
      runOnJS(setIsAnimationComplete)(true);
    }
  }, [isAppReady]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
    };
  });

  const containerStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  if (isAnimationComplete) {
    return null;
  }

  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, styles.container, containerStyle]}
    >
      <Animated.Image
        source={require("../../assets/images/space.png")}
        style={[styles.logo, animatedStyle]}
        resizeMode="contain"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 99999, // Ensure it's on top of all other elements
    elevation: 999,
  },
  logo: {
    width: 300,
    height: 300,
  },
});
