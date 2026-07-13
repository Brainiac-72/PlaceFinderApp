'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User, Mail, ShieldAlert, ArrowUpRight, Search, Eye, EyeOff, ShieldCheck, CheckCircle2, UserX } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRole, setActiveRole] = useState<'landlord' | 'seeker'>('landlord');
  const [searchQuery, setSearchQuery] = useState('');
  const [revealedEmails, setRevealedEmails] = useState<Record<string, boolean>>({});
  
  const router = useRouter();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.rpc('admin_get_recent_signups', { limit_count: 1000 });
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const maskEmail = (email: string) => {
    if (!email) return 'N/A';
    const parts = email.split('@');
    if (parts.length !== 2) return '••••••••';
    const [local, domain] = parts;
    const maskedLocal = local.length > 2 ? local.substring(0, 2) + '••••' : '••••';
    return `${maskedLocal}@${domain}`;
  };

  const toggleRevealEmail = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation(); // Prevent row click navigation
    setRevealedEmails(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  // Grouping counts
  const landlordCount = users.filter(u => u.role === 'landlord').length;
  const seekerCount = users.filter(u => u.role !== 'landlord').length;

  const filteredUsers = users.filter(user => {
    const matchesRole = activeRole === 'landlord' ? user.role === 'landlord' : user.role !== 'landlord';
    const matchesSearch = 
      (user.full_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (user.email?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-gray-50 min-h-screen">
      
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Platform Users</h1>
          <p className="text-gray-500 mt-2 text-sm font-medium">Manage user verification, landlord directory, and system accounts.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-center">
            <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Total accounts</span>
            <span className="text-lg font-black text-slate-900">{users.length}</span>
          </div>
        </div>
      </div>

      {/* Control Panel (Tabs & Search) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-gray-200/80 shadow-sm">
        
        {/* Divided Tabs */}
        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
          <button
            onClick={() => setActiveRole('landlord')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
              activeRole === 'landlord' 
                ? 'bg-slate-900 text-white shadow-md' 
                : 'text-gray-600 hover:text-slate-950'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Landlords
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
              activeRole === 'landlord' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {landlordCount}
            </span>
          </button>

          <button
            onClick={() => setActiveRole('seeker')}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
              activeRole === 'seeker' 
                ? 'bg-slate-900 text-white shadow-md' 
                : 'text-gray-600 hover:text-slate-950'
            }`}
          >
            <User className="w-4 h-4" />
            Seekers
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
              activeRole === 'seeker' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
            }`}>
              {seekerCount}
            </span>
          </button>
        </div>

        {/* Live Search bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder={`Search ${activeRole === 'landlord' ? 'landlords' : 'seekers'}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-xs font-semibold text-gray-900 bg-slate-50/50"
          />
        </div>
      </div>
      
      {/* Table */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-gray-500 flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="font-medium text-sm text-gray-600">Loading user database...</p>
          </div>
        ) : (
          <div className="overflow-x-auto font-sans">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="text-[10px] text-gray-400 font-bold uppercase bg-slate-50 border-b border-gray-100 tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-black">User Profile</th>
                  <th className="px-6 py-4 font-black">Role</th>
                  <th className="px-6 py-4 font-black">Status</th>
                  <th className="px-6 py-4 font-black">Date Joined</th>
                  <th className="px-6 py-4 font-black text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((user, i) => {
                  const isRevealed = revealedEmails[user.id];
                  return (
                    <tr 
                      key={i} 
                      onClick={() => router.push(`/users/${user.id}`)}
                      className={`transition-all hover:bg-slate-50/80 group cursor-pointer ${user.is_banned ? 'bg-red-50/20' : ''}`}
                    >
                      <td className="px-6 py-4 flex items-center gap-4">
                        <div className="relative">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt={user.full_name} className={`w-10 h-10 rounded-xl object-cover shadow-sm border ${user.is_banned ? 'border-red-300 opacity-50 grayscale' : 'border-gray-200'}`} />
                          ) : (
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${user.is_banned ? 'bg-red-100 border-red-200 text-red-600' : 'bg-gradient-to-tr from-blue-50 to-indigo-50 border-blue-100 text-blue-600'}`}>
                              <span className="font-extrabold text-sm">
                                {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                              </span>
                            </div>
                          )}
                          <div className={`absolute -bottom-1 -right-1 w-3 h-3 border-2 border-white rounded-full ${user.is_banned ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                        </div>
                        <div>
                          <p className={`font-bold text-gray-900 group-hover:text-blue-600 transition-colors text-sm ${user.is_banned ? 'text-red-900 line-through opacity-70' : ''}`}>{user.full_name || 'Anonymous User'}</p>
                          <div className="text-xs text-gray-400 mt-1 flex items-center gap-2 font-semibold font-mono">
                            <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span>{isRevealed ? user.email : maskEmail(user.email)}</span>
                            
                            {/* Privacy toggle unmasking */}
                            <button
                              onClick={(e) => toggleRevealEmail(e, user.id)}
                              className="p-1 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                              title={isRevealed ? "Hide sensitive details" : "Reveal details"}
                            >
                              {isRevealed ? (
                                <EyeOff className="w-3.5 h-3.5 text-blue-600" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          user.role === 'admin' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                          user.role === 'landlord' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 
                          'bg-blue-100 text-blue-700 border border-blue-200'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {user.is_banned ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded uppercase border border-red-200">
                            Banned
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded uppercase border border-emerald-100">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-500 font-semibold">{new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="inline-flex items-center gap-1 text-xs font-bold text-gray-400 group-hover:text-blue-600 transition-colors">
                          Manage <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredUsers.length === 0 && (
              <div className="p-16 text-center text-gray-500">
                <p className="font-medium text-lg text-gray-900">No matching accounts found</p>
                <p className="text-sm mt-1">Try tweaking your search term or tab selection.</p>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
