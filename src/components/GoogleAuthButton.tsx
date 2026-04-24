import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, ActivityIndicator, View, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from '../utils/supabase';
import { useThemeColor } from '../hooks/useThemeColor';
import Toast from 'react-native-toast-message';

// Initialize WebBrowser for OAuth
WebBrowser.maybeCompleteAuthSession();

interface GoogleAuthButtonProps {
  onSuccess?: () => void;
  onFailure?: (error: any) => void;
}

export const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({ onSuccess, onFailure }) => {
  const [loading, setLoading] = useState(false);
  const { colors, isDark } = useThemeColor();

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      
      const redirectUrl = Linking.createURL('google-auth');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) throw error;
      
      // Safety check: Ensure Supabase returned a valid URL.
      // If data.url is null, the provider is likely disabled in the Supabase Dashboard.
      if (!data?.url) {
        throw new Error('No authentication URL received. Please check if Google is enabled in your Supabase Auth Providers.');
      }

      console.log('[GoogleAuth] Opening URL:', data.url);
      const res = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

      if (res.type === 'success') {
        const { url } = res;
        const params = Linking.parse(url).queryParams;
        
        if (params?.access_token && params?.refresh_token) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: params.access_token as string,
            refresh_token: params.refresh_token as string,
          });
          
          if (sessionError) throw sessionError;
          onSuccess?.();
        } else {
          throw new Error('Authentication failed: Missing tokens in redirect URL.');
        }
      }
    } catch (error: any) {
      console.error('[GoogleAuth] Error:', error);
      Alert.alert(
        'Connection Error',
        error.message || 'An unexpected error occurred during Google sign-in.'
      );
      onFailure?.(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { 
          backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)',
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        }
      ]}
      onPress={handleGoogleSignIn}
      disabled={loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={isDark ? '#fff' : '#000'} />
      ) : (
        <View style={styles.content}>
          <Ionicons name="logo-google" size={20} color={isDark ? '#fff' : '#000'} />
          <Text style={[styles.text, { color: isDark ? '#fff' : '#000' }]}>
            Continue with Google
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
