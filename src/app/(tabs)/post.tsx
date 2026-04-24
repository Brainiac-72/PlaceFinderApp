import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert, Platform, SafeAreaView, KeyboardAvoidingView, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColor } from '../../hooks/useThemeColor';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../providers/AuthProvider';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import Toast from 'react-native-toast-message';
import { AMENITIES } from '../../constants/Amenities';

const PROPERTY_TYPES = ['Residential', 'Commercial', 'Office', 'Shop', 'Event'];

export default function PostPropertyScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useThemeColor();
  const { user } = useAuth();

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
    if (!title || !price || !location) {
      Toast.show({ type: 'error', text1: 'Missing Fields', text2: 'Please fill in the title, price, and location.' });
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
      owner_id: user.id,
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

    const { error } = await supabase.from('properties').insert([propertyData]);

    setLoading(false);

    if (error) {
      Toast.show({ type: 'error', text1: 'Error Posting Property', text2: error.message });
      return;
    }

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
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={[styles.container, { paddingTop: Platform.OS === 'android' ? 24 : insets.top }]}
        >
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>List a Space</Text>
            <Text style={[styles.headerSub, { color: colors.textSecondary }]}>Add a new property to the market</Text>
          </View>

          <TouchableOpacity 
            style={[
              styles.imageUploadBtn, 
              { backgroundColor: colors.card, borderColor: colors.border },
              !imageUri && { borderStyle: 'dashed', borderWidth: 2 }
            ]}
            onPress={pickImage}
          >
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
            ) : (
              <>
                <Ionicons name="images-outline" size={32} color={colors.primary} />
                <Text style={[styles.imageUploadText, { color: colors.primary }]}>Tap to Upload Photos</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={[styles.formContainer, { backgroundColor: colors.card, shadowColor: isDark ? '#FFF' : '#000' }]}>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Property Title <Text style={{ color: colors.error }}>*</Text></Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
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
                      { backgroundColor: colors.background, borderColor: colors.border },
                      type === t && { backgroundColor: colors.primary, borderColor: colors.primary }
                    ]}
                    onPress={() => setType(t)}
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
                  style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  placeholder="0.00"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  value={price}
                  onChangeText={setPrice}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Area Size (sqm)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
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
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
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
                  style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
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
                  style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
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
                  { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }
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
                        { borderColor: colors.border, backgroundColor: colors.background },
                        isSelected && { backgroundColor: colors.primary, borderColor: colors.primary }
                      ]}
                      onPress={() => {
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

            <TouchableOpacity style={[styles.submitBtn, { backgroundColor: colors.primary }]} onPress={handlePost} disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Post Property</Text>
              )}
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
    marginTop: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 4,
  },
  headerSub: {
    fontSize: 16,
  },
  imageUploadBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 160,
    borderRadius: 16,
    marginBottom: 24,
    gap: 8,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  imageUploadText: {
    fontSize: 16,
    fontWeight: '600',
  },
  formContainer: {
    borderRadius: 20,
    padding: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
  },
  textArea: {
    minHeight: 100,
  },
  typeScroll: {
    flexGrow: 0,
  },
  typePill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 10,
  },
  typeText: {
    fontWeight: '500',
  },
  submitBtn: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  inputSubtitle: {
    fontSize: 12,
    marginTop: -8,
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  amenityChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
