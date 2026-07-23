'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ImagePlus, X, MapPin, Building2, CheckCircle, ArrowLeft } from 'lucide-react';

const PROPERTY_TYPES = ['Residential', 'Commercial', 'Office', 'Shop', 'Event'];
const PRICE_PERIODS = [
  { id: 'month', label: '/ Month' },
  { id: 'year', label: '/ Year' },
  { id: 'full', label: 'Full Price' }
];

const AMENITIES = [
  { id: 'wifi', label: 'WiFi', icon: 'wifi-outline' },
  { id: 'parking', label: 'Parking', icon: 'car-outline' },
  { id: 'security', label: 'Security', icon: 'shield-checkmark-outline' },
  { id: 'water', label: 'Water', icon: 'water-outline' },
  { id: 'power', label: 'Backup Power', icon: 'flash-outline' },
  { id: 'ac', label: 'Air-con', icon: 'snow-outline' },
  { id: 'gym', label: 'Gym', icon: 'fitness-outline' },
  { id: 'pool', label: 'Pool', icon: 'sunny-outline' },
  { id: 'furnished', label: 'Furnished', icon: 'bed-outline' },
];

export default function NewListingPage() {
  const router = useRouter();
  
  const [landlords, setLandlords] = useState<any[]>([]);
  const [selectedLandlord, setSelectedLandlord] = useState('');
  const [adminName, setAdminName] = useState('Admin');
  
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Residential');
  const [price, setPrice] = useState('');
  const [pricePeriod, setPricePeriod] = useState('month');
  const [location, setLocation] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [areaSize, setAreaSize] = useState('');
  const [description, setDescription] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [images, setImages] = useState<{file: File, preview: string}[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAdminProfile();
  }, []);

  const fetchAdminProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, username')
        .in('role', ['admin', 'landlord'])
        .order('role', { ascending: true })
        .limit(1);
      if (error) throw error;
      if (data && data.length > 0) {
        setSelectedLandlord(data[0].id);
        setAdminName(data[0].full_name || data[0].username || 'Admin');
      }
    } catch (err) {
      console.error('Error fetching admin profile:', err);
    }
  };

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files).map(file => ({
        file,
        preview: URL.createObjectURL(file)
      }));
      setImages(prev => [...prev, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImage = async (file: File, landlordId: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${landlordId}/${fileName}`;
      
      const { error } = await supabase.storage
        .from('properties')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

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

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedLandlord) {
      setError('Failed to identify Admin profile.');
      return;
    }
    if (!title.trim() || !price || !location.trim()) {
      setError('Missing required fields: Title, Price, Location.');
      return;
    }

    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      setError('Please enter a valid price.');
      return;
    }

    setLoading(true);
    let publicImageUrl = null;

    if (images.length > 0) {
      const uploadPromises = images.map(img => uploadImage(img.file, selectedLandlord));
      const results = await Promise.all(uploadPromises);
      const urls = results.filter(url => url !== null);
      
      if (urls.length === 0) {
        setError('Failed to upload images.');
        setLoading(false);
        return;
      }
      publicImageUrl = JSON.stringify(urls);
    }

    const propertyData = {
      landlord_id: selectedLandlord,
      title: title.trim(),
      type,
      price: numericPrice,
      price_period: pricePeriod,
      location: location.trim(),
      bedrooms: bedrooms ? parseInt(bedrooms) : null,
      bathrooms: bathrooms ? parseInt(bathrooms) : null,
      area_size: areaSize ? parseFloat(areaSize) : null,
      description: description.trim(),
      image_url: publicImageUrl,
      status: 'available',
      amenities: selectedAmenities,
    };

    const { error: insertError } = await supabase.from('properties').insert([propertyData]);

    setLoading(false);

    if (insertError) {
      setError('Error posting property: ' + insertError.message);
      return;
    }

    router.push('/listings');
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 h-full bg-gray-50 pb-24">
      {/* Header */}
      <div className="flex items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <button 
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </button>
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Post a New Property</h1>
          <p className="text-gray-500 mt-2 text-sm font-medium">Add a listing on behalf of a landlord to the platform.</p>
        </div>
      </div>

      <form onSubmit={handlePost} className="space-y-8">
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-semibold border border-red-100">
            {error}
          </div>
        )}

        <div className="bg-white p-8 rounded-3xl border border-gray-200/80 shadow-sm space-y-6">
          <h2 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-4">Basic Details</h2>
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Posting As</label>
            <input
              type="text"
              value={adminName + " (Admin)"}
              disabled
              className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 font-semibold cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Property Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Modern 2-Bedroom Apartment"
              className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Property Type *</label>
            <div className="flex flex-wrap gap-2">
              {PROPERTY_TYPES.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    type === t 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'bg-slate-50 text-gray-600 hover:bg-slate-100 border border-gray-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Price (GHS) *</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Billing Period</label>
              <div className="flex bg-slate-50 border border-gray-200 rounded-xl p-1">
                {PRICE_PERIODS.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPricePeriod(p.id)}
                    className={`flex-1 px-2 py-2 rounded-lg text-xs font-bold transition-all ${
                      pricePeriod === p.id 
                        ? 'bg-white text-blue-600 shadow-sm border border-gray-100' 
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Location *</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-gray-400 absolute left-4 top-3.5" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. East Legon, Accra"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Area Size (m²)</label>
              <input
                type="number"
                value={areaSize}
                onChange={(e) => setAreaSize(e.target.value)}
                placeholder="e.g. 120"
                className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Bedrooms</label>
              <input
                type="number"
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
                placeholder="e.g. 2"
                className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Bathrooms</label>
              <input
                type="number"
                value={bathrooms}
                onChange={(e) => setBathrooms(e.target.value)}
                placeholder="e.g. 2"
                className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the property in detail..."
              rows={4}
              className="w-full px-4 py-3 bg-slate-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Space Amenities</label>
            <div className="flex flex-wrap gap-2">
              {AMENITIES.map(amenity => {
                const isSelected = selectedAmenities.includes(amenity.id);
                return (
                  <button
                    key={amenity.id}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setSelectedAmenities(prev => prev.filter(id => id !== amenity.id));
                      } else {
                        setSelectedAmenities(prev => [...prev, amenity.id]);
                      }
                    }}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                      isSelected 
                        ? 'bg-blue-50 text-blue-700 border-blue-200' 
                        : 'bg-slate-50 text-gray-600 hover:bg-slate-100 border-gray-200'
                    }`}
                  >
                    {amenity.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-gray-200/80 shadow-sm space-y-6">
          <h2 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-4">Property Images</h2>
          
          <div className="flex flex-wrap gap-4">
            <label className="w-32 h-32 flex flex-col items-center justify-center bg-slate-50 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:bg-slate-100 transition-colors">
              <ImagePlus className="w-8 h-8 text-gray-400 mb-2" />
              <span className="text-xs font-bold text-gray-500">Add Photos</span>
              <input 
                type="file" 
                accept="image/*" 
                multiple 
                className="hidden" 
                onChange={handleImagePick}
              />
            </label>

            {images.map((img, idx) => (
              <div key={idx} className="relative w-32 h-32 rounded-2xl overflow-hidden border border-gray-200">
                <img src={img.preview} alt={`preview-${idx}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute top-2 right-2 bg-black/50 p-1 rounded-full hover:bg-black/70 transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-4 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <CheckCircle className="w-5 h-5" />
            )}
            {loading ? 'Publishing...' : 'Publish Listing'}
          </button>
        </div>
      </form>
    </div>
  );
}
