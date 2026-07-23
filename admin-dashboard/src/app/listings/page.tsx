'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { MapPin, ArrowUpRight, Archive, CheckCircle } from 'lucide-react';

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

export default function ListingsPage() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'active' | 'archived'>('active');
  const router = useRouter();

  useEffect(() => {
    if (viewMode === 'active') fetchListings();
    else fetchArchivedListings();
  }, [viewMode]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('properties')
        .select(`
          *,
          profiles:landlord_id (full_name, username)
        `)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setListings(data || []);
    } catch (error) {
      console.error('Error fetching active listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchArchivedListings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('admin_get_deleted_listings');
      if (error) throw error;
      setListings(data || []);
    } catch (error) {
      console.error('Error fetching archived listings:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 h-full bg-gray-50">
      
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Properties Database</h1>
          <p className="text-gray-500 mt-2 text-sm font-medium">Verify specs, landlord listings, and system archives.</p>
        </div>
        
        {/* Toggle Mode buttons */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/50 self-start">
          <button
            onClick={() => setViewMode('active')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'active' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Active Listings
          </button>
          <button
            onClick={() => setViewMode('archived')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'archived' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            Deleted Archive
          </button>
          <button
            onClick={() => router.push('/listings/new')}
            className="ml-2 px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
          >
            <MapPin className="w-3.5 h-3.5" />
            New Property
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-gray-500 flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="font-medium text-sm text-gray-600">Retrieving listings database...</p>
          </div>
        ) : (
          <div className="overflow-x-auto font-sans">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="text-[10px] text-gray-400 font-bold uppercase bg-slate-50 border-b border-gray-100 tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-black">Property Details</th>
                  <th className="px-6 py-4 font-black">Landlord</th>
                  <th className="px-6 py-4 font-black">Price Spec</th>
                  <th className="px-6 py-4 font-black">Status</th>
                  <th className="px-6 py-4 font-black text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {listings.map((listing, i) => (
                  <tr 
                    key={i} 
                    onClick={() => router.push(`/listings/${listing.id}`)}
                    className="transition-all hover:bg-slate-50/80 group cursor-pointer"
                  >
                    <td className="px-6 py-4 flex items-center gap-4">
                      <div className="w-14 h-10 rounded-lg bg-gray-100 overflow-hidden relative border border-gray-200/60 shadow-sm flex-shrink-0">
                        {listing.image_url ? (
                          <img src={getPropertyImage(listing.image_url)} alt={listing.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[8px] font-bold text-gray-400 bg-slate-50">NO IMG</div>
                        )}
                      </div>
                      <div className="min-w-0 max-w-[240px]">
                        <p className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors text-sm truncate">{listing.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1 font-semibold truncate">
                          <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          <span>{listing.location || (listing.original_data && listing.original_data.location)}</span>
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 text-xs font-black">
                          {listing.profiles?.full_name ? listing.profiles.full_name.charAt(0).toUpperCase() : 'L'}
                        </div>
                        <span className="font-bold text-gray-700 text-xs truncate max-w-[150px]">
                          {listing.profiles?.full_name || 'Landlord ' + (listing.landlord_id?.substring(0, 5) || '')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-black text-gray-900 text-sm">GH₵ {Number(listing.price).toLocaleString()}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">per {listing.price_period || (listing.original_data && listing.original_data.price_period) || 'month'}</p>
                    </td>
                    <td className="px-6 py-4">
                      {viewMode === 'active' ? (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                          listing.status === 'available' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                            : 'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                          {listing.status || 'available'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-100">
                          Deleted
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-1 text-xs font-bold text-gray-400 group-hover:text-blue-600 transition-colors">
                        Inspect <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {listings.length === 0 && (
              <div className="p-16 text-center text-gray-500">
                <p className="font-medium text-lg text-gray-900">No properties found</p>
                <p className="text-sm mt-1">There are no properties listed on the platform yet.</p>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
