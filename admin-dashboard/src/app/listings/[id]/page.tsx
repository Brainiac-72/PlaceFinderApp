'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, 
  MapPin, 
  DollarSign, 
  Home, 
  BedDouble, 
  Bath, 
  Maximize, 
  User, 
  MessageSquare, 
  Calendar, 
  CheckCircle,
  Archive,
  ChevronRight,
  AlertTriangle,
  Edit,
  X
} from 'lucide-react';

const getPropertyImage = (imageUrlString: string) => {
  if (!imageUrlString) return 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=600&q=80';
  let url = imageUrlString;
  if (imageUrlString.startsWith('[')) {
    try {
      const parsed = JSON.parse(imageUrlString);
      if (Array.isArray(parsed) && parsed.length > 0) {
        url = parsed[0];
      }
    } catch (e) {
      console.error(e);
    }
  }
  if (url && url.toLowerCase().endsWith('.heic')) {
    return 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=600&q=80';
  }
  return url;
};

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const listingId = params.id as string;

  const [listing, setListing] = useState<any>(null);
  const [interactions, setInteractions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Edit states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editPricePeriod, setEditPricePeriod] = useState('month');
  const [editLocation, setEditLocation] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editBedrooms, setEditBedrooms] = useState('');
  const [editBathrooms, setEditBathrooms] = useState('');
  const [editAreaSize, setEditAreaSize] = useState('');
  const [editStatus, setEditStatus] = useState('available');

  const openEditModal = () => {
    if (!listing) return;
    setEditTitle(listing.title || '');
    setEditPrice(listing.price ? String(listing.price) : '');
    setEditPricePeriod(listing.price_period || 'month');
    setEditLocation(listing.location || '');
    setEditDescription(listing.description || '');
    setEditBedrooms(listing.bedrooms ? String(listing.bedrooms) : '');
    setEditBathrooms(listing.bathrooms ? String(listing.bathrooms) : '');
    setEditAreaSize(listing.area_size ? String(listing.area_size) : '');
    setEditStatus(listing.status || 'available');
    setIsEditOpen(true);
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('properties')
        .update({
          title: editTitle,
          price: Number(editPrice) || 0,
          price_period: editPricePeriod,
          location: editLocation,
          description: editDescription,
          bedrooms: editBedrooms ? Number(editBedrooms) : null,
          bathrooms: editBathrooms ? Number(editBathrooms) : null,
          area_size: editAreaSize ? Number(editAreaSize) : null,
          status: editStatus
        })
        .eq('id', listingId);

      if (error) throw error;
      alert('Listing updated successfully!');
      setIsEditOpen(false);
      fetchListingDetails();
    } catch (err) {
      console.error('Error updating listing:', err);
      alert('Failed to save listing changes.');
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    if (listingId) {
      fetchListingDetails();
    }
  }, [listingId]);

  const fetchListingDetails = async () => {
    setLoading(true);
    try {
      // Fetch property details along with landlord profile
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          profiles:landlord_id (id, full_name, avatar_url, role)
        `)
        .eq('id', listingId)
        .single();
      
      if (error) throw error;
      setListing(data);

      // Load seeker interactions
      fetchInteractions(listingId);
    } catch (err) {
      console.error('Error fetching listing details:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInteractions = async (id: string) => {
    setDetailsLoading(true);
    try {
      let interactionsData = [];
      const { data, error } = await supabase.rpc('admin_get_property_interactions', { target_property_id: id });
      
      if (error) {
        console.warn('RPC failed, falling back to direct select query:', error);
        
        // Fetch chats for this property
        const { data: directChats, error: directChatsErr } = await supabase
          .from('chats')
          .select(`
            id,
            seeker_id,
            profiles:seeker_id (full_name, avatar_url)
          `)
          .eq('property_id', id);
        
        if (directChatsErr) throw directChatsErr;

        if (directChats) {
          const resolvedInteractions = await Promise.all(directChats.map(async (c: any) => {
            const { data: lastMsg } = await supabase
              .from('messages')
              .select('content, created_at')
              .eq('chat_id', c.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            
            const { count } = await supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('chat_id', c.id);

            return {
              chat_id: c.id,
              seeker_id: c.seeker_id,
              seeker_name: c.profiles?.full_name || 'User ' + c.seeker_id.substring(0, 5),
              seeker_avatar: c.profiles?.avatar_url,
              last_message: lastMsg?.content || 'No messages sent yet',
              last_message_time: lastMsg?.created_at || null,
              message_count: count || 0
            };
          }));
          interactionsData = resolvedInteractions;
        }
      } else {
        interactionsData = data || [];
      }
      setInteractions(interactionsData);
    } catch (err) {
      console.error('Error fetching property interactions:', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleDeleteListing = async () => {
    if (!listing) return;
    if (!confirm('Are you sure you want to delete and archive this property listing?')) return;
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', listing.id);
      
      if (error) throw error;
      alert('Listing deleted and archived successfully.');
      router.push('/listings');
    } catch (err) {
      console.error('Error deleting listing:', err);
      alert('Failed to delete property listing.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-gray-500 flex flex-col items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-semibold text-lg text-gray-700">Loading property details...</p>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center space-y-4">
        <p className="text-red-600 font-bold">Property listing not found in database.</p>
        <button onClick={() => router.back()} className="px-4 py-2 bg-slate-900 text-white rounded-xl">Go Back</button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-gray-50 min-h-screen">
      
      {/* Navigation Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.back()} 
          className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Listing Management</span>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mt-0.5">{listing.title}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Hero Image and Specs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden">
            
            {/* Property Photo */}
            <div className="h-[380px] bg-slate-100 relative">
              {listing.image_url ? (
                <img src={getPropertyImage(listing.image_url)} alt={listing.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                  <Home className="w-16 h-16 stroke-1 mb-2" />
                  <span className="font-semibold">No property images uploaded</span>
                </div>
              )}
              <div className="absolute bottom-6 left-6 bg-slate-900/90 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10 text-white shadow-xl">
                <span className="text-[10px] uppercase font-bold text-blue-400 tracking-widest block mb-0.5">Rental Rate</span>
                <span className="text-2xl font-black">GH₵ {Number(listing.price).toLocaleString()} <span className="text-xs font-medium text-gray-300">/ {listing.price_period || 'month'}</span></span>
              </div>
            </div>

            {/* Specifications Details Grid */}
            <div className="p-6 space-y-6">
              
              {/* Core numbers */}
              <div className="grid grid-cols-3 gap-4 border-b border-gray-100 pb-6">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                  <div className="p-2 bg-blue-600/10 rounded-xl text-blue-600">
                    <BedDouble className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Bedrooms</span>
                    <span className="font-bold text-gray-900 text-sm">{listing.bedrooms || '0'} Beds</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                  <div className="p-2 bg-green-600/10 rounded-xl text-green-600">
                    <Bath className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Bathrooms</span>
                    <span className="font-bold text-gray-900 text-sm">{listing.bathrooms || '0'} Baths</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                  <div className="p-2 bg-purple-600/10 rounded-xl text-purple-600">
                    <Maximize className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Area Size</span>
                    <span className="font-bold text-gray-900 text-sm">{listing.area_size || '0'} SqFt</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">About this property</h4>
                <p className="text-gray-700 leading-relaxed text-sm font-medium">{listing.description || 'No description provided by the landlord.'}</p>
              </div>

              {/* Location */}
              <div className="flex items-center gap-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <div>
                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Location Address</span>
                  <span className="text-xs font-bold text-gray-800">{listing.location}</span>
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* Right Side: Landlord Details and Inquiries Feed */}
        <div className="space-y-6 lg:col-span-1">
          
          {/* Landlord Card */}
          <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-sm space-y-4">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Listed By</h4>
            
            <div className="flex items-center gap-4">
              {listing.profiles?.avatar_url ? (
                <img src={listing.profiles.avatar_url} alt={listing.profiles.full_name} className="w-12 h-12 rounded-xl object-cover border border-gray-100" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                  {listing.profiles?.full_name ? listing.profiles.full_name.charAt(0).toUpperCase() : 'L'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h5 className="font-bold text-gray-900 text-sm truncate">{listing.profiles?.full_name || 'Landlord'}</h5>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wider">
                  {listing.profiles?.role || 'Landlord'}
                </span>
              </div>
            </div>

            <button
              onClick={() => router.push(`/users/${listing.profiles?.id}`)}
              className="w-full py-3 bg-slate-900 text-white hover:bg-slate-800 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <User className="w-4 h-4" />
              View Landlord Profile
            </button>
          </div>

          {/* Seeker Inquiries Feed */}
          <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-sm">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Seeker Inquiries ({interactions.length})</h4>
            
            {detailsLoading ? (
              <div className="py-6 text-center flex flex-col items-center">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : interactions.length === 0 ? (
              <p className="text-xs text-gray-400 py-2">No seeker inquiries or messages have been logged for this property.</p>
            ) : (
              <div className="space-y-3">
                {interactions.map((chat) => (
                  <div key={chat.chat_id} className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center overflow-hidden">
                          {chat.seeker_avatar ? (
                            <img src={chat.seeker_avatar} alt={chat.seeker_name} className="w-full h-full object-cover" />
                          ) : (
                            chat.seeker_name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <span className="text-xs font-bold text-gray-800">{chat.seeker_name}</span>
                      </div>
                      <span className="text-[9px] text-gray-400 font-bold bg-white px-2 py-0.5 rounded-md border border-gray-100">
                        {chat.message_count} msgs
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500 italic truncate pl-1 bg-white p-2 rounded-xl border border-gray-100/50">
                      "{chat.last_message}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Archive Moderation Control Panel */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-slate-500" /> Administrative Actions
            </h4>
            
            <button
              onClick={openEditModal}
              disabled={actionLoading}
              className="w-full py-3 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Edit className="w-4 h-4" />
              Edit Property Details
            </button>

            <button
              onClick={handleDeleteListing}
              disabled={actionLoading}
              className="w-full py-3 bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Archive className="w-4 h-4" />
              Delete & Archive Property
            </button>
          </div>

        </div>

      </div>

      {/* Edit Property Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-gray-100 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Edit Property Details</h3>
                <p className="text-xs text-gray-500">Changes will reflect instantly inside the mobile app.</p>
              </div>
              <button 
                onClick={() => setIsEditOpen(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveChanges} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Property Title</label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium text-sm text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Price (GH₵)</label>
                  <input
                    type="number"
                    required
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium text-sm text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Price Period</label>
                  <select
                    value={editPricePeriod}
                    onChange={(e) => setEditPricePeriod(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium text-sm text-gray-900 bg-white"
                  >
                    <option value="month">Per Month</option>
                    <option value="year">Per Year</option>
                    <option value="full">Full Price</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Location Address</label>
                  <input
                    type="text"
                    required
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium text-sm text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Bedrooms</label>
                  <input
                    type="number"
                    value={editBedrooms}
                    onChange={(e) => setEditBedrooms(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium text-sm text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Bathrooms</label>
                  <input
                    type="number"
                    value={editBathrooms}
                    onChange={(e) => setEditBathrooms(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium text-sm text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Area Size (SqFt)</label>
                  <input
                    type="number"
                    value={editAreaSize}
                    onChange={(e) => setEditAreaSize(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium text-sm text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium text-sm text-gray-900 bg-white"
                  >
                    <option value="available">Available</option>
                    <option value="in_negotiations">In Negotiations</option>
                    <option value="taken">Taken</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Description</label>
                  <textarea
                    rows={4}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium text-sm text-gray-900 resize-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-500 hover:bg-gray-50 font-bold text-sm rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-slate-900 text-white hover:bg-slate-800 font-bold text-sm rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  {actionLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
