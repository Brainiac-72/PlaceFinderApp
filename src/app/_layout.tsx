import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider, useAuth } from '../providers/AuthProvider';
import { useSettingsStore } from '../store/useSettingsStore';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useThemeColor } from '../hooks/useThemeColor';
import { AlertProvider } from '../providers/AlertProvider';
import { AnimatedSplashScreen } from '../components/AnimatedSplashScreen';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { propertyService } from '../services/propertyService';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold, Outfit_800ExtraBold } from '@expo-google-fonts/outfit';

import { PlayfairDisplay_700Bold, PlayfairDisplay_900Black, PlayfairDisplay_400Regular } from '@expo-google-fonts/playfair-display';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

/**
 * The inner layout component responsible for initializing fonts, checking auth status,
 * handling onboarding redirection, and pre-fetching critical queries.
 */
function RootLayoutNav() {
  const { session, loading: authLoading } = useAuth();
  const { hasFinishedOnboarding, hasHydrated } = useSettingsStore();
  const segments = useSegments();
  const router = useRouter();
  const [appIsReady, setAppIsReady] = useState(false);

  // 1. Initial Readiness Check
  const [fontsLoaded, fontError] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_800ExtraBold,

    PlayfairDisplay_700Bold,
    PlayfairDisplay_900Black,
    PlayfairDisplay_400Regular,
  });

  useEffect(() => {
    if (!authLoading && hasHydrated && (fontsLoaded || fontError)) {
      setAppIsReady(true);
    }
  }, [authLoading, hasHydrated, fontsLoaded, fontError]);

  // 2. Pre-fetching & Performance
  useEffect(() => {
    if (appIsReady) {
      // Background pre-fetch the main feed so it's ready when dashboard mounts
      queryClient.prefetchQuery({
        queryKey: ['properties'],
        queryFn: propertyService.getAllProperties,
      });
      
      if (session?.user) {
        queryClient.prefetchQuery({
          queryKey: ['my-properties', session.user.id],
          queryFn: () => propertyService.getMyProperties(session.user.id),
        });
      }
    }
  }, [appIsReady, !!session]);

  // 3. Navigation Guard Logic
  useEffect(() => {
    if (!appIsReady) return;

    // Zero delay for faster transition
    const inAuthGroup = segments[0] === '(auth)';
    const onOnboarding = segments[0] === 'onboarding';

    // Force onboarding for new users
    if (!hasFinishedOnboarding && !onOnboarding) {
        router.replace('/onboarding');
        return;
    }

    // Auth redirection logic
    if (hasFinishedOnboarding) {
        if (!session && !inAuthGroup) {
            router.replace('/(auth)/login');
        } else if (session && (inAuthGroup || onOnboarding)) {
            router.replace('/(tabs)');
        }
    }
  }, [appIsReady, session, segments, hasFinishedOnboarding]);

  return (
    <>
      {appIsReady && <Slot />}
      <AnimatedSplashScreen isAppReady={appIsReady} />
    </>
  );
}

import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';

const toastConfig = {
  success: (props: any) => (
    <BaseToast
      {...props}
      style={{ borderLeftColor: '#0066FF', backgroundColor: '#111827', borderRadius: 12, shadowOpacity: 0.3, elevation: 6 }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 15,
        fontFamily: 'Outfit_700Bold',
        color: '#F9FAFB'
      }}
      text2Style={{
        fontSize: 13,
        fontFamily: 'Outfit_400Regular',
        color: '#9CA3AF'
      }}
    />
  ),
  error: (props: any) => (
    <ErrorToast
      {...props}
      style={{ borderLeftColor: '#EF4444', backgroundColor: '#111827', borderRadius: 12, shadowOpacity: 0.3, elevation: 6 }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 15,
        fontFamily: 'Outfit_700Bold',
        color: '#F9FAFB'
      }}
      text2Style={{
        fontSize: 13,
        fontFamily: 'Outfit_400Regular',
        color: '#EF4444'
      }}
    />
  ),
};

/**
 * The absolute root entry point of the Expo Router application.
 * Wraps the entire app in global providers (GestureHandler, QueryClient, Theme, Auth, Alerts, etc.)
 * and configures global toast notifications.
 */
export default function RootLayout() {
  const { isDark, colors } = useThemeColor();

  const customDarkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: '#0A0F1E',
      card: '#111827',
      text: '#F9FAFB',
      border: '#374151',
    }
  };

  const customLightTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: '#F9FAFB',
      card: '#FFFFFF',
      text: '#111827',
      border: '#E5E7EB',
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider value={isDark ? customDarkTheme : customLightTheme}>
          <SafeAreaProvider>
            <BottomSheetModalProvider>
            <AuthProvider>
              <AlertProvider>
                <RootLayoutNav />
                <Toast config={toastConfig} />
                <StatusBar style={isDark ? 'light' : 'dark'} />
              </AlertProvider>
            </AuthProvider>
            </BottomSheetModalProvider>
          </SafeAreaProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

