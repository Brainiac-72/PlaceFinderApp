'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Calendar, 
  ShieldAlert, 
  MapPin, 
  DollarSign, 
  MessageSquare, 
  Clock, 
  ChevronRight,
  UserX,
  UserCheck
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

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [userListings, setUserListings] = useState<any[]>([]);
  const [userChats, setUserChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchUserProfile();
    }
  }, [userId]);

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      // Fetch core profile
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (profileErr) throw profileErr;

      // Get email from recent signups or directly from auth if metadata has it
      // Let's call the RPC for signups first to get the email
      const { data: signups } = await supabase.rpc('admin_get_recent_signups', { limit_count: 1000 });
      const matchedSignup = signups?.find((u: any) => u.id === userId);
      
      setUser({
        ...profile,
        email: matchedSignup?.email || 'N/A'
      });

      // Load listings and chats
      fetchUserListingsAndChats(userId);
    } catch (err) {
      console.error('Error fetching profile details:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserListingsAndChats = async (id: string) => {
    setDetailsLoading(true);
    try {
      // 1. Fetch listings
      let listingsData = [];
      const { data: listings, error: listingsErr } = await supabase.rpc('admin_get_user_listings', { target_user_id: id });
      if (listingsErr) {
        console.warn('RPC failed, falling back to direct select query:', listingsErr);
        const { data: directListings, error: directListingsErr } = await supabase
          .from('properties')
          .select('*')
          .eq('landlord_id', id)
          .order('created_at', { ascending: false });
        if (directListingsErr) throw directListingsErr;
        listingsData = directListings || [];
      } else {
        listingsData = listings || [];
      }
      setUserListings(listingsData);

      // 2. Fetch chats
      let chatsData = [];
      const { data: chats, error: chatsErr } = await supabase.rpc('admin_get_user_chats', { target_user_id: id });
      if (chatsErr) {
        console.warn('RPC failed, falling back to direct select join query:', chatsErr);
        const { data: directChats, error: directChatsErr } = await supabase
          .from('chats')
          .select(`
            id,
            property_id,
            seeker_id,
            landlord_id,
            properties:property_id (title)
          `)
          .or(`seeker_id.eq.${id},landlord_id.eq.${id}`);
        
        if (directChatsErr) throw directChatsErr;

        if (directChats) {
          const resolvedChats = await Promise.all(directChats.map(async (c: any) => {
            const otherPartyId = c.seeker_id === id ? c.landlord_id : c.seeker_id;
            const { data: otherProfile } = await supabase
              .from('profiles')
              .select('full_name, avatar_url')
              .eq('id', otherPartyId)
              .single();
            
            const { data: lastMsg } = await supabase
              .from('messages')
              .select('content, created_at')
              .eq('chat_id', c.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            return {
              chat_id: c.id,
              property_id: c.property_id,
              property_title: (c.properties as any)?.title || 'Property Inquiry',
              other_party_name: otherProfile?.full_name || 'User ' + otherPartyId.substring(0, 5),
              other_party_avatar: otherProfile?.avatar_url,
              last_message: lastMsg?.content || 'No messages sent yet',
              last_message_time: lastMsg?.created_at || null
            };
          }));
          chatsData = resolvedChats;
        }
      } else {
        chatsData = chats || [];
      }
      setUserChats(chatsData);
    } catch (err) {
      console.error('Error fetching user engagement:', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleBanToggle = async () => {
    if (!user) return;
    setActionLoading(true);
    const newStatus = !user.is_banned;
    try {
      const { error } = await supabase.rpc('admin_ban_user', { target_user_id: user.id, ban_status: newStatus });
      if (error) throw error;
      
      setUser({ ...user, is_banned: newStatus });
    } catch (err) {
      console.error('Error toggling ban status:', err);
      alert('Failed to update ban status.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-gray-500 flex flex-col items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-semibold text-lg text-gray-700">Loading user profile details...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center space-y-4">
        <p className="text-red-600 font-bold">User profile not found in database.</p>
        <button onClick={() => router.back()} className="px-4 py-2 bg-slate-900 text-white rounded-xl">Go Back</button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-gray-50 min-h-screen">
      
      {/* Back button and navigation title */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.back()} 
          className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">User Profile Management</span>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mt-0.5">{user.full_name || 'Anonymous User'}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* User Metadata Profile Column */}
        <div className="space-y-6 lg:col-span-1">
          <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden">
            
            {/* Header backdrop & Avatar */}
            <div className="h-28 bg-gradient-to-tr from-slate-900 to-slate-800 relative"></div>
            <div className="px-6 pb-6 relative">
              <div className="absolute -top-12 left-6">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.full_name} className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-md" />
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-4xl shadow-md border-4 border-white">
                    {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
              </div>
              
              {/* Profile Details */}
              <div className="pt-16 space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{user.full_name || 'Anonymous User'}</h3>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                      user.role === 'landlord' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {user.role}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      user.is_banned ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {user.is_banned ? 'Banned' : 'Active'}
                    </span>
                  </div>
                </div>

                <div className="space-y-3.5 border-t border-gray-100 pt-6 text-sm text-gray-600 font-medium">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="font-mono text-xs">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span>Registered on {new Date(user.created_at || user.updated_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                </div>

                {/* Moderation actions */}
                <div className="border-t border-gray-100 pt-6">
                  <button
                    onClick={handleBanToggle}
                    disabled={actionLoading}
                    className={`w-full py-3.5 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      user.is_banned 
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/10' 
                        : 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-600/10'
                    }`}
                  >
                    {actionLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : user.is_banned ? (
                      <>
                        <UserCheck className="w-5 h-5" />
                        Reactivate Account
                      </>
                    ) : (
                      <>
                        <UserX className="w-5 h-5" />
                        Suspend & Ban Account
                      </>
                    )}
                  </button>
                </div>

              </div>
            </div>

          </div>
        </div>

        {/* Content Column (Listings & Chats) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Listings Panel */}
          <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6 uppercase tracking-wider text-xs text-gray-500">Property Listings ({userListings.length})</h3>
            
            {detailsLoading ? (
              <div className="py-8 text-center flex flex-col items-center">
                <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : userListings.length === 0 ? (
              <div className="p-8 text-center bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-sm font-medium text-gray-500">No properties published by this landlord.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userListings.map((prop) => (
                  <div 
                    key={prop.id} 
                    onClick={() => router.push(`/listings/${prop.id}`)}
                    className="border border-gray-200/80 rounded-2xl overflow-hidden hover:shadow-md transition-all cursor-pointer group flex flex-col"
                  >
                    <div className="h-36 bg-gray-100 relative overflow-hidden">
                      {prop.image_url ? (
                        <img src={getPropertyImage(prop.image_url)} alt={prop.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">No Image</div>
                      )}
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-xs font-black text-gray-900 border border-white/20">
                        GH₵ {Number(prop.price).toLocaleString()} / {prop.price_period || 'month'}
                      </div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors text-sm line-clamp-1">{prop.title}</h4>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{prop.location}</span>
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          prop.status === 'available' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {prop.status || 'available'}
                        </span>
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* User Chats / Message Log Panel */}
          <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6 uppercase tracking-wider text-xs text-gray-500">Chats & User Engagement ({userChats.length})</h3>
            
            {detailsLoading ? (
              <div className="py-8 text-center flex flex-col items-center">
                <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : userChats.length === 0 ? (
              <div className="p-8 text-center bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-sm font-medium text-gray-500">No active chat sessions found for this user.</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {userChats.map((cht) => (
                  <div key={cht.chat_id} className="p-4 bg-white rounded-2xl border border-gray-200 hover:shadow-sm transition-all flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex-shrink-0 flex items-center justify-center text-slate-700 font-bold border border-slate-200 shadow-sm overflow-hidden">
                      {cht.other_party_avatar ? (
                        <img src={cht.other_party_avatar} alt={cht.other_party_name} className="w-full h-full object-cover" />
                      ) : (
                        cht.other_party_name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Conversation with</p>
                          <h4 className="text-sm font-bold text-gray-900">{cht.other_party_name}</h4>
                        </div>
                        {cht.last_message_time && (
                          <span className="text-[10px] text-gray-400 font-semibold">{new Date(cht.last_message_time).toLocaleDateString()}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-2 bg-gray-50 p-2.5 rounded-xl border border-gray-100/50 italic line-clamp-2">
                        "{cht.last_message}"
                      </p>
                      <p className="text-[10px] font-bold text-blue-600 mt-2 hover:underline inline-flex items-center gap-0.5 cursor-pointer">
                        Attached: {cht.property_title}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
