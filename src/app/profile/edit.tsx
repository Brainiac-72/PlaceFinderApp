import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../../providers/AuthProvider';
import { supabase } from '../../utils/supabase';
import { ChevronLeft, User, Phone, Lock, Eye, EyeOff, ShieldCheck, CheckCircle2 } from 'lucide-react-native';
import { useThemeColor } from '../../hooks/useThemeColor';
import Toast from 'react-native-toast-message';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PremiumInput } from '../../components/premium/PremiumInput';
import { PremiumButton } from '../../components/premium/PremiumButton';
import { SectionHeader } from '../../components/premium/SectionHeader';
import { PremiumAvatar } from '../../components/premium/PremiumAvatar';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';

export default function EditProfileScreen() {
  const { user, profile, refreshProfile } = useAuth();
  const { colors } = useThemeColor();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Profile data
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phoneNumber, setPhoneNumber] = useState(profile?.phone_number || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [avatarImage, setAvatarImage] = useState<any>(null);

  // Password data
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password visibility
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Password criteria
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

  const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar;

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setAvatarImage(result.assets[0]);
      setAvatarUrl(result.assets[0].uri);
    }
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarImage) return avatarUrl; // no new image selected

    try {
      const ext = avatarImage.uri.split('.').pop() || 'jpeg';
      const fileName = `${user?.id}_${Date.now()}.${ext}`;
      const filePath = `public/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, decode(avatarImage.base64), {
          contentType: `image/${ext}`,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error) {
      console.log('Error uploading avatar:', error);
      throw error;
    }
  };

  const handleUpdateProfile = async () => {
    if (!fullName || !phoneNumber) {
      Toast.show({ type: 'error', text1: 'Missing Fields', text2: 'Please fill name and phone number.' });
      return;
    }

    try {
      setLoading(true);
      
      let finalAvatarUrl = avatarUrl;
      if (avatarImage) {
        const uploadedUrl = await uploadAvatar();
        if (uploadedUrl) finalAvatarUrl = uploadedUrl;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone_number: phoneNumber,
          avatar_url: finalAvatarUrl,
          updated_at: new Date(),
        })
        .eq('id', user?.id);

      if (error) throw error;
      
      await refreshProfile();
      Toast.show({ type: 'success', text1: 'Success', text2: 'Profile updated successfully!' });
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Update Failed', text2: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Toast.show({ type: 'error', text1: 'Missing Fields', text2: 'Please fill all password fields.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      Toast.show({ type: 'error', text1: 'Mismatch', text2: 'New passwords do not match.' });
      return;
    }

    if (!isPasswordValid) {
      Toast.show({ type: 'error', text1: 'Weak Password', text2: 'Password does not meet requirements.' });
      return;
    }

    try {
      setPasswordLoading(true);
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: oldPassword,
      });

      if (authError) {
        setPasswordLoading(false);
        Toast.show({ type: 'error', text1: 'Invalid Password', text2: 'The old password is incorrect.' });
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      Toast.show({ type: 'success', text1: 'Success', text2: 'Password changed successfully!' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Update Failed', text2: err.message });
    } finally {
      setPasswordLoading(false);
    }
  };

  const renderCriterion = (met: boolean, text: string) => (
    <View style={styles.criterionRow}>
      <CheckCircle2 size={16} color={met ? '#10B981' : '#6B7280'} />
      <Text style={[styles.criterionText, { color: met ? '#10B981' : '#9CA3AF' }]}>{text}</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: '#0A0F1E', paddingTop: insets.top }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <ChevronLeft size={24} color="#FFF" />
            </TouchableOpacity>
            <SectionHeader title="Settings" subtitle="Manage your account & security" />
          </View>

          <View style={styles.avatarContainer}>
             <PremiumAvatar size={100} online={true} uri={avatarUrl} name={fullName} />
             <TouchableOpacity style={styles.changePhotoBtn} onPress={pickImage}>
                <Text style={styles.changePhotoText}>Change Photo</Text>
             </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>PERSONAL DETAILS</Text>
          <PremiumInput 
            label="Full Name" 
            value={fullName} 
            onChangeText={setFullName} 
            placeholder="John Doe" 
            icon={<User size={20} color={colors.primary} />}
          />
          <PremiumInput 
            label="Phone Number" 
            value={phoneNumber} 
            onChangeText={setPhoneNumber} 
            placeholder="+233 24 000 0000" 
            keyboardType="phone-pad"
            icon={<Phone size={20} color={colors.primary} />}
          />

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>SECURITY</Text>
          <PremiumInput 
            label="Current Password" 
            value={oldPassword} 
            onChangeText={setOldPassword} 
            secureTextEntry={!showOld}
            placeholder="••••••••"
            icon={<Lock size={20} color={colors.primary} />}
            rightIcon={
              <TouchableOpacity onPress={() => setShowOld(!showOld)}>
                {showOld ? <EyeOff size={20} color="#9CA3AF" /> : <Eye size={20} color="#9CA3AF" />}
              </TouchableOpacity>
            }
          />
          <PremiumInput 
            label="New Password" 
            value={newPassword} 
            onChangeText={setNewPassword} 
            secureTextEntry={!showNew}
            placeholder="••••••••"
            icon={<ShieldCheck size={20} color={colors.primary} />}
            rightIcon={
              <TouchableOpacity onPress={() => setShowNew(!showNew)}>
                {showNew ? <EyeOff size={20} color="#9CA3AF" /> : <Eye size={20} color="#9CA3AF" />}
              </TouchableOpacity>
            }
          />

          {newPassword.length > 0 && (
            <View style={styles.criteriaContainer}>
              {renderCriterion(hasMinLength, "At least 8 characters")}
              {renderCriterion(hasUppercase, "One uppercase letter")}
              {renderCriterion(hasLowercase, "One lowercase letter")}
              {renderCriterion(hasNumber, "One numeric digit")}
              {renderCriterion(hasSpecialChar, "One special character")}
            </View>
          )}

          <PremiumInput 
            label="Confirm New Password" 
            value={confirmPassword} 
            onChangeText={setConfirmPassword} 
            secureTextEntry={!showConfirm}
            placeholder="••••••••"
            icon={<ShieldCheck size={20} color={colors.primary} />}
            rightIcon={
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                {showConfirm ? <EyeOff size={20} color="#9CA3AF" /> : <Eye size={20} color="#9CA3AF" />}
              </TouchableOpacity>
            }
          />

          <PremiumButton 
            title="Update Password" 
            variant="secondary" 
            loading={passwordLoading} 
            onPress={handleChangePassword} 
            style={{ marginTop: 8 }}
          />

        </ScrollView>
      </KeyboardAvoidingView>

      <BlurView intensity={100} tint="dark" style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <PremiumButton title="Save Profile Changes" loading={loading} onPress={handleUpdateProfile} />
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 160 },
  header: { marginBottom: 32 },
  backBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#1F2937' },
  avatarContainer: { alignItems: 'center', marginBottom: 32 },
  changePhotoBtn: { marginTop: 12, paddingVertical: 8, paddingHorizontal: 16, backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)' },
  changePhotoText: { color: '#F59E0B', fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  sectionTitle: { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#6B7280', letterSpacing: 1.5, marginBottom: 20 },
  divider: { height: 1, backgroundColor: '#1F2937', marginVertical: 32 },
  criteriaContainer: { marginBottom: 24, backgroundColor: '#111827', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#1F2937' },
  criterionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 12 },
  criterionText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 24, paddingTop: 20, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
});
