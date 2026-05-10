import { Slot, useRouter, useSegments } from 'expo-router';
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

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

function RootLayoutNav() {
  const { session, loading: authLoading } = useAuth();
  const { hasFinishedOnboarding, hasHydrated } = useSettingsStore();
  const segments = useSegments();
  const router = useRouter();
  const [appIsReady, setAppIsReady] = useState(false);

  // 1. Initial Readiness Check
  useEffect(() => {
    if (!authLoading && hasHydrated) {
      setAppIsReady(true);
    }
  }, [authLoading, hasHydrated]);

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
      style={{ borderLeftColor: '#007AFF', backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: 16, shadowOpacity: 0.1, elevation: 6 }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 16,
        fontWeight: '700',
        color: '#1C1C1E'
      }}
      text2Style={{
        fontSize: 14,
        color: '#8E8E93'
      }}
    />
  ),
  error: (props: any) => (
    <ErrorToast
      {...props}
      style={{ borderLeftColor: '#FF3B30', backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: 16, shadowOpacity: 0.1, elevation: 6 }}
      contentContainerStyle={{ paddingHorizontal: 15 }}
      text1Style={{
        fontSize: 16,
        fontWeight: '700',
        color: '#1C1C1E'
      }}
      text2Style={{
        fontSize: 14,
        color: '#FF3B30'
      }}
    />
  ),
};

export default function RootLayout() {
  const { isDark, colors } = useThemeColor();

  const customDarkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
    }
  };

  const customLightTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={isDark ? customDarkTheme : customLightTheme}>
        <AuthProvider>
          <AlertProvider>
            <RootLayoutNav />
            <Toast config={toastConfig} />
          </AlertProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
