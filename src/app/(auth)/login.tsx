import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, Alert, ActivityIndicator, Dimensions, ImageBackground, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import { supabase } from '../../utils/supabase';
import { useThemeColor } from '../../hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import { GoogleAuthButton } from '../../components/GoogleAuthButton';

const { width, height } = Dimensions.get('window');

// Premium modern interior photo for the background
const BG_IMAGE = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { colors, isDark } = useThemeColor();

  async function signInWithEmail() {
    if (!email || !password) {
      Toast.show({ type: 'error', text1: 'Required', text2: 'Please enter both email and password.' });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      Toast.show({ type: 'error', text1: 'Authentication Failed', text2: error.message });
    }
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ImageBackground source={{ uri: BG_IMAGE }} style={styles.backgroundImage} resizeMode="cover">
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)']}
          style={styles.gradientOverlay}
        >
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <View style={styles.contentWrapper}>
              
              {/* Premium Header */}
              <View style={styles.headerContainer}>
                <View style={styles.iconWrapper}>
                  <Ionicons name="location" size={42} color="#fff" />
                </View>
                <Text style={styles.appName}>SpaceFinder</Text>
                <Text style={styles.tagline}>Unlock premium properties seamlessly.</Text>
              </View>

              {/* Glassmorphic Login Card */}
              <BlurView intensity={90} tint={isDark ? 'dark' : 'light'} style={styles.glassCard}>
                <Text style={[styles.loginTitle, { color: isDark ? '#fff' : '#1C1C1E' }]}>Welcome Back</Text>
                
                <View style={styles.inputContainer}>
                  <View style={[styles.inputWrapper, { backgroundColor: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.7)' }]}>
                    <Ionicons name="mail-outline" size={20} color={isDark ? '#A0A0A0' : '#666'} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: isDark ? '#fff' : '#000' }]}
                      placeholder="Email Address"
                      placeholderTextColor={isDark ? '#A0A0A0' : '#888'}
                      value={email}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      onChangeText={setEmail}
                    />
                  </View>

                  <View style={[styles.inputWrapper, { backgroundColor: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.7)' }]}>
                    <Ionicons name="lock-closed-outline" size={20} color={isDark ? '#A0A0A0' : '#666'} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: isDark ? '#fff' : '#000' }]}
                      placeholder="Password"
                      placeholderTextColor={isDark ? '#A0A0A0' : '#888'}
                      value={password}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      onChangeText={setPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                      <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={isDark ? '#A0A0A0' : '#666'} />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity 
                  style={[styles.loginButton, { shadowColor: colors.primary }]}
                  onPress={signInWithEmail}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#007AFF', '#0056b3']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientButton}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Text style={styles.loginButtonText}>Sign In</Text>
                        <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <View style={styles.footerRow}>
                  <Text style={[styles.footerText, { color: isDark ? '#A0A0A0' : '#666' }]}>New to SpaceFinder? </Text>
                  <Link href="/(auth)/register" asChild>
                    <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <Text style={[styles.registerLink, { color: colors.primary }]}>Create an account</Text>
                    </TouchableOpacity>
                  </Link>
                </View>

                <View style={styles.dividerContainer}>
                  <View style={[styles.dividerLine, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} />
                  <Text style={[styles.dividerText, { color: isDark ? '#666' : '#999' }]}>OR</Text>
                  <View style={[styles.dividerLine, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} />
                </View>

                <GoogleAuthButton />
                
              </BlurView>
            </View>
          </KeyboardAvoidingView>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    width: width,
    height: height,
  },
  gradientOverlay: {
    flex: 1,
    justifyContent: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  glassCard: {
    borderRadius: 24,
    padding: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    gap: 16,
    marginBottom: 32,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    height: '100%',
  },
  eyeIcon: {
    padding: 8,
  },
  loginButton: {
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  gradientButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 15,
  },
  registerLink: {
    fontSize: 15,
    fontWeight: '700',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1,
  },
});
