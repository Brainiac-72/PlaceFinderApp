import { Stack } from 'expo-router';
import React from 'react';

/**
 * The layout for the authentication flow.
 * Disables the default native header since custom UI is used.
 */
export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
