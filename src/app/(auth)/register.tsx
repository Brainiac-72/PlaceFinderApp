import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View, Alert, ActivityIndicator, Dimensions, ImageBackground, KeyboardAvoidingView, Platform, StatusBar, ScrollView } from 'react-native';
import { supabase } from '../../utils/supabase';
import { useThemeColor } from '../../hooks/useThemeColor';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../providers/AuthProvider';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import { GoogleAuthButton } from '../../components/GoogleAuthButton';

const { width, height } = Dimensions.get('window');

// Same premium background to maintain consistency
const BG_IMAGE = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState<'seeker' | 'owner'>('seeker');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { colors, isDark } = useThemeColor();
  const { refreshProfile } = useAuth();

  async function signUpWithEmail() {
    if (!email || !password || !fullName || !phoneNumber) {
      Toast.show({ type: 'error', text1: 'Required', text2: 'Please fill out all fields.' });
      return;
    }
    setLoading(true);
    const {
      data: { session, user },
      error,
    } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName,
          phone_number: phoneNumber,
          role: role,
        }
      }
    });

    if (error) {
      Toast.show({ type: 'error', text1: 'Error', text2: error.message });
    } else {
      if (user) {
        // Enforce setting the profile role in case the backend DB trigger missed it
        await supabase.from('profiles').update({ role }).eq('id', user.id);
        await refreshProfile();
      }
      
      if (!session) {
        Toast.show({ type: 'success', text1: 'Success', text2: 'Please check your inbox for email verification!' });
      }
    }
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ImageBackground source={{ uri: BG_IMAGE }} style={styles.backgroundImage} resizeMode="cover">
        <LinearGradient
          colors={['rgba(0,0,0,0.5)', 'rgba(0,0,0,0.85)']}
          style={styles.gradientOverlay}
        >
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              <View style={styles.contentWrapper}>
                
                {/* Premium Header */}
                <View style={styles.headerContainer}>
                  <View style={styles.iconWrapper}>
                    <Ionicons name="person-add" size={38} color="#fff" />
                  </View>
                  <Text style={styles.appName}>Join SpaceFinder</Text>
                  <Text style={styles.tagline}>Your perfect space is waiting.</Text>
                </View>

                {/* Glassmorphic Register Card */}
                <BlurView intensity={90} tint={isDark ? 'dark' : 'light'} style={styles.glassCard}>
                  
                  {/* Custom Segmented Control for Roles */}
                  <View style={styles.roleContainer}>
                    <TouchableOpacity 
                      style={[styles.roleBtn, role === 'seeker' ? styles.roleBtnActive : styles.roleBtnInactive]}
                      onPress={() => setRole('seeker')}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="search" size={18} color={role === 'seeker' ? '#FFF' : '#A0A0A0'} />
                      <Text style={[styles.roleText, role === 'seeker' ? styles.roleTextActive : styles.roleTextInactive]}>Seeker</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.roleBtn, role === 'owner' ? styles.roleBtnActive : styles.roleBtnInactive]}
                      onPress={() => setRole('owner')}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="home" size={18} color={role === 'owner' ? '#FFF' : '#A0A0A0'} />
                      <Text style={[styles.roleText, role === 'owner' ? styles.roleTextActive : styles.roleTextInactive]}>Landlord</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.inputContainer}>
                    <View style={[styles.inputWrapper, { backgroundColor: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.7)' }]}>
                      <Ionicons name="person-outline" size={20} color={isDark ? '#A0A0A0' : '#666'} style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, { color: isDark ? '#fff' : '#000' }]}
                        placeholder="Full Name"
                        placeholderTextColor={isDark ? '#A0A0A0' : '#888'}
                        value={fullName}
                        autoCapitalize="words"
                        onChangeText={setFullName}
                      />
                    </View>

                    <View style={[styles.inputWrapper, { backgroundColor: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.7)' }]}>
                      <Ionicons name="call-outline" size={20} color={isDark ? '#A0A0A0' : '#666'} style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, { color: isDark ? '#fff' : '#000' }]}
                        placeholder="Phone Number"
                        placeholderTextColor={isDark ? '#A0A0A0' : '#888'}
                        value={phoneNumber}
                        keyboardType="phone-pad"
                        onChangeText={setPhoneNumber}
                      />
                    </View>

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
                    style={[styles.registerButton, { shadowColor: colors.primary }]}
                    onPress={signUpWithEmail}
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
                          <Text style={styles.registerButtonText}>Create Account</Text>
                          <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginLeft: 8 }} />
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  <View style={styles.footerRow}>
                    <Text style={[styles.footerText, { color: isDark ? '#A0A0A0' : '#666' }]}>Already have an account? </Text>
                    <Link href="/(auth)/login" asChild>
                      <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Text style={[styles.loginLink, { color: colors.primary }]}>Sign In</Text>
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
            </ScrollView>
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
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  contentWrapper: {
    paddingHorizontal: 24,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  iconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  glassCard: {
    borderRadius: 24,
    padding: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  roleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
  },
  roleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  roleBtnActive: {
    backgroundColor: '#007AFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  roleBtnInactive: {
    backgroundColor: 'transparent',
  },
  roleText: {
    fontSize: 15,
    fontWeight: '600',
  },
  roleTextActive: {
    color: '#fff',
  },
  roleTextInactive: {
    color: '#A0A0A0',
  },
  inputContainer: {
    gap: 16,
    marginBottom: 28,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    height: '100%',
  },
  eyeIcon: {
    padding: 8,
  },
  registerButton: {
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
  registerButtonText: {
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
  loginLink: {
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
