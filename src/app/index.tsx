import { Redirect } from 'expo-router';
import React from 'react';

/**
 * The root index route. Immediately redirects to the main `(tabs)` navigator.
 * Actual routing guards (checking auth/onboarding) are handled upstream in `_layout.tsx`.
 */
export default function Index() {
  // In Expo Router, the root index is the entry point.
  // Our (tabs) folder contains the actual Home screen.
  // The _layout.tsx handles the redirection logic based on Auth and Onboarding.
  // We'll just redirect to the tabs by default if this component is reached.
  return <Redirect href="/(tabs)" />;
}
