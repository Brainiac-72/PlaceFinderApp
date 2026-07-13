'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Megaphone, Send, ShieldAlert, Users, Compass, CheckCircle2, History, AlertCircle } from 'lucide-react';

export default function BroadcastPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [targetRole, setTargetRole] = useState<'all' | 'landlord' | 'seeker'>('all');
  const [notificationType, setNotificationType] = useState<'info' | 'warning' | 'promo' | 'alert'>('info');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [recentBroadcasts, setRecentBroadcasts] = useState<any[]>([]);

  useEffect(() => {
    fetchRecentBroadcasts();
  }, []);

  const fetchRecentBroadcasts = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      setRecentBroadcasts(data || []);
    } catch (err) {
      console.error('Error fetching recent broadcasts:', err);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      setErrorMsg('Please provide a title and message body.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // 1. Fetch matching user profiles
      let query = supabase.from('profiles').select('id');
      if (targetRole !== 'all') {
        query = query.eq('role', targetRole);
      }
      
      const { data: profiles, error: profileErr } = await query;
      if (profileErr) throw profileErr;

      if (!profiles || profiles.length === 0) {
        throw new Error(`No active ${targetRole} users found to receive this broadcast.`);
      }

      // 2. Prepare bulk notifications payload
      const notificationsPayload = profiles.map((profile) => ({
        user_id: profile.id,
        title: title.trim(),
        body: body.trim(),
        type: notificationType,
        data: {
          category: 'broadcast',
          admin_sent: true,
          timestamp: new Date().toISOString()
        },
        is_read: false
      }));

      // 3. Bulk insert into notifications table
      const { error: insertErr } = await supabase
        .from('notifications')
        .insert(notificationsPayload);

      if (insertErr) throw insertErr;

      setSuccessMsg(`Successfully broadcasted message to ${profiles.length} users!`);
      setTitle('');
      setBody('');
      fetchRecentBroadcasts();
    } catch (err: any) {
      console.error('Broadcast failed:', err);
      setErrorMsg(err.message || 'Failed to send broadcast alert.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-gray-50 min-h-screen">
      
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
            <Megaphone className="w-8 h-8 text-blue-600 animate-pulse" />
            System Broadcasts
          </h1>
          <p className="text-gray-500 mt-2 text-sm font-medium">Send push alerts and in-app system notifications directly to platform users.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form Column */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Send className="w-5 h-5 text-blue-600" />
              Compose New Broadcast
            </h3>

            {successMsg && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                {successMsg}
              </div>
            )}

            {errorMsg && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm flex items-center gap-2 font-medium">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSendBroadcast} className="space-y-6">
              {/* Target Audience */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Target Audience</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'all', label: 'All Users', icon: Users, color: 'text-blue-600' },
                    { id: 'landlord', label: 'Landlords Only', icon: ShieldAlert, color: 'text-green-600' },
                    { id: 'seeker', label: 'Seekers Only', icon: Compass, color: 'text-purple-600' },
                  ].map((role) => {
                    const Icon = role.icon;
                    const isSelected = targetRole === role.id;
                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => setTargetRole(role.id as any)}
                        className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all ${
                          isSelected 
                            ? 'bg-blue-600/10 border-blue-500 ring-2 ring-blue-500/20' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className={`w-6 h-6 mb-2 ${role.color}`} />
                        <span className={`text-xs font-bold ${isSelected ? 'text-blue-900' : 'text-gray-600'}`}>{role.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Alert Category */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Alert Category</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'info', label: '📢 Info Announcement' },
                    { id: 'warning', label: '⚠️ Safety Warning' },
                    { id: 'promo', label: '🎁 Promotion / Update' },
                    { id: 'alert', label: '🚨 Urgent Alert' },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setNotificationType(cat.id as any)}
                      className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${
                        notificationType === cat.id 
                          ? 'bg-slate-900 text-white border-slate-900' 
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Notification Title</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Scheduled System Maintenance"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-semibold"
                  maxLength={80}
                  required
                />
              </div>

              {/* Message Body */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Notification Body</label>
                <textarea 
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Type your system announcement message details here..."
                  className="w-full h-32 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium resize-none"
                  maxLength={300}
                  required
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400 font-bold rounded-xl transition-all shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Broadcasting Alerts...
                  </>
                ) : (
                  <>
                    <Megaphone className="w-5 h-5" />
                    Dispatch System Broadcast
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Live Mockup Column */}
        <div className="space-y-8">
          {/* Mockup */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm flex flex-col items-center">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6 self-start">Live Device Preview</h3>
            
            {/* Phone Screen Container */}
            <div className="w-64 h-[420px] bg-slate-950 rounded-[32px] border-4 border-slate-800 p-2 shadow-2xl relative overflow-hidden flex flex-col">
              {/* Phone Speaker Notch */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-4 bg-slate-800 rounded-full z-10 flex items-center justify-center">
                <div className="w-8 h-1 bg-slate-700 rounded-full"></div>
              </div>

              {/* Mobile Wallpaper */}
              <div className="flex-1 bg-gradient-to-b from-indigo-950 via-slate-900 to-black rounded-[24px] p-3 pt-6 flex flex-col justify-start">
                
                {/* Simulated Notification Card */}
                <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-3 shadow-lg transform transition-all duration-300 translate-y-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-4 h-4 bg-blue-600 rounded-md flex items-center justify-center text-[8px] text-white font-bold">PF</div>
                      <span className="text-[10px] text-white/60 font-semibold">PlaceFinder</span>
                    </div>
                    <span className="text-[8px] text-white/40">now</span>
                  </div>
                  <h4 className="text-xs font-bold text-white truncate">{title || 'Notification Title'}</h4>
                  <p className="text-[10px] text-white/75 mt-1 leading-relaxed break-words line-clamp-3">{body || 'Type your message in the composer to preview how users will see it on their mobile lockscreens.'}</p>
                </div>

                {/* Clock indicator */}
                <div className="mt-auto text-center mb-6">
                  <p className="text-3xl font-extralight text-white/80">09:41</p>
                  <p className="text-[10px] text-white/50 font-medium">Monday, July 13</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Broadcasts */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <History className="w-4 h-4 text-slate-400" />
              Latest System Logs
            </h3>
            <div className="space-y-3">
              {recentBroadcasts.length === 0 ? (
                <p className="text-xs text-gray-400 py-2">No recent system announcements logged.</p>
              ) : (
                recentBroadcasts.slice(0, 5).map((log, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                        log.type === 'warning' ? 'bg-red-50 text-red-600 border border-red-100' :
                        log.type === 'promo' ? 'bg-purple-50 text-purple-600 border border-purple-100' :
                        log.type === 'alert' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                        'bg-blue-50 text-blue-600 border border-blue-100'
                      }`}>
                        {log.type}
                      </span>
                      <span className="text-[9px] text-gray-400 font-medium">{new Date(log.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs font-bold text-gray-800 truncate">{log.title}</p>
                    <p className="text-[10px] text-gray-500 line-clamp-2">{log.body}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
