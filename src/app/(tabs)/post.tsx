import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert, Platform, KeyboardAvoidingView, ActivityIndicator, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '../../hooks/useThemeColor';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../providers/AuthProvider';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import Toast from 'react-native-toast-message';
import { AMENITIES } from '../../constants/Amenities';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

const PROPERTY_TYPES = ['Residential', 'Commercial', 'Office', 'Shop', 'Event'];

/**
 * The Property Listing Creation Screen.
 * Allows landlords to upload a new property, complete with images, details, and amenities.
 * Handles uploading the image to Supabase storage before creating the database row.
 */
export default function PostPropertyScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useThemeColor();
  const { user, profile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (profile && profile.role === 'seeker') {
      router.replace('/(tabs)');
    }
  }, [profile, router]);

  const [title, setTitle] = useState('');
  const [type, setType] = useState('Residential');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [areaSize, setAreaSize] = useState('');
  const [description, setDescription] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.3,
      base64: true,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      setImageBase64(result.assets[0].base64 || null);
    }
  };

  const uploadImage = async (uri: string, base64: string): Promise<string | null> => {
    try {
      const fileExt = uri.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;
      
      const { data, error } = await supabase.storage
        .from('properties')
        .upload(filePath, decode(base64), {
          contentType: `image/${fileExt}`
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('properties')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Upload Error:', error);
      return null;
    }
  };

  const handlePost = async () => {
    if (!title.trim() || !price || !location.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({ type: 'error', text1: 'Missing Fields', text2: 'Please fill in the title, price, and location.' });
      return;
    }

    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({ type: 'error', text1: 'Invalid Price', text2: 'Please enter a valid price greater than 0.' });
      return;
    }
    
    if (!user) {
      Toast.show({ type: 'error', text1: 'Authentication Error', text2: 'You must be logged in to post a property.' });
      return;
    }

    setLoading(true);
    let publicImageUrl = null;

    if (imageUri && imageBase64) {
      publicImageUrl = await uploadImage(imageUri, imageBase64);
      if (!publicImageUrl) {
        Toast.show({ type: 'error', text1: 'Upload Failed', text2: 'There was an error uploading your image. Please try again.' });
        setLoading(false);
        return;
      }
    }

    const propertyData = {
      landlord_id: user.id,
      title: title.trim(),
      type,
      price: parseFloat(price),
      location: location.trim(),
      bedrooms: bedrooms ? parseInt(bedrooms) : null,
      bathrooms: bathrooms ? parseInt(bathrooms) : null,
      area_size: areaSize ? parseFloat(areaSize) : null,
      description: description.trim(),
      image_url: publicImageUrl,
      status: 'available',
      amenities: selectedAmenities,
    };

    const { data, error } = await supabase.from('properties').insert([propertyData]).select('id').single();

    setLoading(false);

    if (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Toast.show({ type: 'error', text1: 'Error Posting Property', text2: error.message });
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Toast.show({ type: 'success', text1: 'Success!', text2: 'Property has been posted successfully!' });
    
    // Reset forms
    setTitle('');
    setPrice('');
    setLocation('');
    setBedrooms('');
    setBathrooms('');
    setAreaSize('');
    setDescription('');
    setSelectedAmenities([]);
    setImageUri(null);
    setImageBase64(null);
    
    if (data?.id) {
      router.push(`/property/${data.id}`);
    }
  };

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background, paddingTop: insets.top + (Platform.OS === 'android' ? 15 : 0) }]}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={[styles.container, { paddingTop: Platform.OS === 'android' ? 24 : insets.top, paddingBottom: 140 }]}
        >
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>List a Space</Text>
            <Text style={[styles.headerSub, { color: colors.textSecondary }]}>Add a new property to the market</Text>
          </View>

          <TouchableOpacity 
            style={[
              styles.imageUploadBtn, 
              { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7', borderColor: colors.border },
              !imageUri && { borderStyle: 'dashed', borderWidth: 1.5 }
            ]}
            onPress={pickImage}
            activeOpacity={0.8}
          >
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
            ) : (
              <>
                <Ionicons name="images" size={36} color={colors.primary} />
                <Text style={[styles.imageUploadText, { color: colors.text }]}>Tap to Upload Photos</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.formContainer}>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Property Title <Text style={{ color: colors.error }}>*</Text></Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: isDark ? '#38383A' : '#E5E5EA' }]}
                placeholder="e.g. Modern 2-Bedroom Apartment"
                placeholderTextColor={colors.textSecondary}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Property Type <Text style={{ color: colors.error }}>*</Text></Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
                {PROPERTY_TYPES.map(t => (
                  <TouchableOpacity 
                    key={t}
                    style={[
                      styles.typePill, 
                      { backgroundColor: colors.card, borderColor: isDark ? '#38383A' : '#E5E5EA' },
                      type === t && { backgroundColor: colors.primary, borderColor: colors.primary }
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setType(t);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[
                      styles.typeText,
                      { color: colors.textSecondary },
                      type === t && { color: '#FFF' }
                    ]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Price (GHS) <Text style={{ color: colors.error }}>*</Text></Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: isDark ? '#38383A' : '#E5E5EA' }]}
                  placeholder="0.00"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  value={price}
                  onChangeText={setPrice}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Area Size (m²)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: isDark ? '#38383A' : '#E5E5EA' }]}
                  placeholder="e.g. 120"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  value={areaSize}
                  onChangeText={setAreaSize}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Location <Text style={{ color: colors.error }}>*</Text></Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: isDark ? '#38383A' : '#E5E5EA' }]}
                placeholder="e.g. East Legon, Accra"
                placeholderTextColor={colors.textSecondary}
                value={location}
                onChangeText={setLocation}
              />
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Bedrooms</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: isDark ? '#38383A' : '#E5E5EA' }]}
                  placeholder="e.g. 2"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  value={bedrooms}
                  onChangeText={setBedrooms}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Bathrooms</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: isDark ? '#38383A' : '#E5E5EA' }]}
                  placeholder="e.g. 2"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  value={bathrooms}
                  onChangeText={setBathrooms}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Description</Text>
              <TextInput
                style={[
                  styles.input, 
                  styles.textArea,
                  { backgroundColor: colors.card, color: colors.text, borderColor: isDark ? '#38383A' : '#E5E5EA' }
                ]}
                placeholder="Describe your property in detail..."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={description}
                onChangeText={setDescription}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Space Amenities</Text>
              <Text style={[styles.inputSubtitle, { color: colors.textSecondary }]}>Select features your space offers</Text>
              <View style={styles.amenitiesContainer}>
                {AMENITIES.map(amenity => {
                  const isSelected = selectedAmenities.includes(amenity.id);
                  return (
                    <TouchableOpacity
                      key={amenity.id}
                      style={[
                        styles.amenityChip,
                        { borderColor: isDark ? '#38383A' : '#E5E5EA', backgroundColor: colors.card },
                        isSelected && { backgroundColor: colors.primary, borderColor: colors.primary }
                      ]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        if (isSelected) {
                          setSelectedAmenities(prev => prev.filter(id => id !== amenity.id));
                        } else {
                          setSelectedAmenities(prev => [...prev, amenity.id]);
                        }
                      }}
                    >
                      <Ionicons 
                        name={amenity.icon as any} 
                        size={16} 
                        color={isSelected ? '#fff' : colors.textSecondary} 
                      />
                      <Text style={[
                        styles.amenityChipText,
                        { color: colors.textSecondary },
                        isSelected && { color: '#fff' }
                      ]}>
                        {amenity.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Floating Bottom Action */}
      <BlurView 
        tint={isDark ? "dark" : "light"} 
        intensity={90} 
        style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 100) }]}
      >
        <TouchableOpacity 
          style={[styles.submitBtn, { backgroundColor: colors.primary }]} 
          activeOpacity={0.8}
          onPress={handlePost} 
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Publish Listing</Text>
          )}
        </TouchableOpacity>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
    marginTop: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontFamily: 'Outfit_800ExtraBold',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 15,
    fontFamily: 'Outfit_400Regular',
  },
  imageUploadBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 180,
    borderRadius: 24,
    marginBottom: 32,
    gap: 8,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  imageUploadText: {
    fontSize: 16,
    fontFamily: 'Outfit_700Bold',
  },
  formContainer: {
    // Removed external background to make it look cleaner
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 16,
  },
  label: {
    fontSize: 15,
    fontFamily: 'Outfit_700Bold',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Outfit_500Medium',
  },
  textArea: {
    minHeight: 120,
    paddingTop: 16,
  },
  typeScroll: {
    flexGrow: 0,
    marginHorizontal: -24,
    paddingHorizontal: 24,
  },
  typePill: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    marginRight: 10,
  },
  typeText: {
    fontSize: 14,
    fontFamily: 'Outfit_600SemiBold',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  submitBtn: {
    paddingVertical: 18,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Outfit_700Bold',
  },
  inputSubtitle: {
    fontSize: 13,
    fontFamily: 'Outfit_400Regular',
    marginTop: -4,
    marginBottom: 12,
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  amenityChipText: {
    fontSize: 13,
    fontFamily: 'Outfit_600SemiBold',
  },
});
