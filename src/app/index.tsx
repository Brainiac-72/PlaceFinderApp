import { Redirect } from 'expo-router';
import React from 'react';

export default function Index() {
  // In Expo Router, the root index is the entry point.
  // Our (tabs) folder contains the actual Home screen.
  // The _layout.tsx handles the redirection logic based on Auth and Onboarding.
  // We'll just redirect to the tabs by default if this component is reached.
  return <Redirect href="/(tabs)" />;
}
