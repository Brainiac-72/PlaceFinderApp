import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Platform, SafeAreaView, KeyboardAvoidingView, ActivityIndicator, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColor } from '../../../hooks/useThemeColor';
import { supabase } from '../../../utils/supabase';
import { useAuth } from '../../../providers/AuthProvider';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import Toast from 'react-native-toast-message';
import { AMENITIES } from '../../../constants/Amenities';

const PROPERTY_TYPES = ['Residential', 'Commercial', 'Office', 'Shop', 'Event'];

export default function EditPropertyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useThemeColor();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form State
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

  useEffect(() => {
    if (id) {
      loadPropertyData();
    }
  }, [id]);

  async function loadPropertyData() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        setTitle(data.title);
        setType(data.type);
        setPrice(data.price.toString());
        setLocation(data.location);
        setBedrooms(data.bedrooms?.toString() || '');
        setBathrooms(data.bathrooms?.toString() || '');
        setAreaSize(data.area_size?.toString() || '');
        setDescription(data.description || '');
        setSelectedAmenities(data.amenities || []);
        setImageUri(data.image_url);
      }
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Error Loading', text2: error.message });
      router.back();
    } finally {
      setLoading(false);
    }
  }

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
      
      const { error } = await supabase.storage
        .from('properties')
        .upload(filePath, decode(base64), { contentType: `image/${fileExt}` });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('properties')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Upload Error:', error);
      return null;
    }
  };

  const handleUpdate = async () => {
    if (!title || !price || !location) {
      Toast.show({ type: 'error', text1: 'Missing Fields', text2: 'Title, price, and location are required.' });
      return;
    }

    setSaving(true);
    let finalImageUrl = imageUri;

    // Only upload if a new image was picked (we have base64)
    if (imageBase64) {
      const uploadedUrl = await uploadImage(imageUri!, imageBase64);
      if (uploadedUrl) finalImageUrl = uploadedUrl;
    }

    const updates = {
      title: title.trim(),
      type,
      price: parseFloat(price),
      location: location.trim(),
      bedrooms: bedrooms ? parseInt(bedrooms) : null,
      bathrooms: bathrooms ? parseInt(bathrooms) : null,
      area_size: areaSize ? parseFloat(areaSize) : null,
      description: description.trim(),
      image_url: finalImageUrl,
      amenities: selectedAmenities,
    };

    const { error } = await supabase
      .from('properties')
      .update(updates)
      .eq('id', id);

    setSaving(false);

    if (error) {
      Toast.show({ type: 'error', text1: 'Update Failed', text2: error.message });
    } else {
      Toast.show({ type: 'success', text1: 'Success', text2: 'Changes saved successfully!' });
      router.back();
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textSecondary, marginTop: 12 }}>Loading listing details...</Text>
      </View>
    );
  }

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
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <View>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Space</Text>
              <Text style={[styles.headerSub, { color: colors.textSecondary }]}>Make adjustments to your listing</Text>
            </View>
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
                <Text style={[styles.imageUploadText, { color: colors.primary }]}>Tap to Change Photos</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={[styles.formContainer, { backgroundColor: colors.card, shadowColor: isDark ? '#FFF' : '#000' }]}>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Property Title <Text style={{ color: colors.error }}>*</Text></Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
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

            <TouchableOpacity style={[styles.submitBtn, { backgroundColor: colors.primary }]} onPress={handleUpdate} disabled={saving}>
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitBtnText}>Save Changes</Text>
              )}
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
    gap: 16,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 14,
  },
  imageUploadBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 180,
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
    borderRadius: 24,
    padding: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
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
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
  },
  textArea: {
    minHeight: 120,
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
    fontWeight: '600',
  },
  submitBtn: {
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
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
