'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Users, Home, AlertTriangle, MessageSquare, Calendar, ChevronDown, CheckCircle, Clock } from 'lucide-react';

export default function AnalyticsDashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [recentSignups, setRecentSignups] = useState<any[]>([]);
  const [userGrowth, setUserGrowth] = useState<any[]>([]);
  const [listingGrowth, setListingGrowth] = useState<any[]>([]);
  const [topProperties, setTopProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30days'); // 7days, 30days, 90days

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // 1. Overview Metrics (Uses the secure RPC we wrote)
      const { data: metricsData, error: metricsError } = await supabase.rpc('admin_get_overview_metrics');
      if (metricsError) throw metricsError;
      setMetrics(metricsData);

      // 2. Recent Signups
      const { data: signupsData, error: signupsError } = await supabase.rpc('admin_get_recent_signups', { limit_count: 10 });
      if (signupsError) throw signupsError;
      setRecentSignups(signupsData || []);

      // 3. User Growth
      let limitDays = dateRange === '7days' ? 7 : dateRange === '30days' ? 30 : 90;
      const { data: userGrowthData } = await supabase.rpc('admin_get_user_growth', { limit_days: limitDays });
        
      if (userGrowthData) {
        // Group by date for Recharts
        const formattedData: any = {};
        userGrowthData.forEach((row: any) => {
          const date = new Date(row.signup_date).toLocaleDateString();
          if (!formattedData[date]) formattedData[date] = { date, seeker: 0, landlord: 0 };
          formattedData[date][row.role] = row.new_users;
        });
        setUserGrowth(Object.values(formattedData).reverse());
      }

      // 4. Listing Growth
      const { data: listingGrowthData } = await supabase
        .from('admin_listing_growth')
        .select('*')
        .limit(limitDays);
        
      if (listingGrowthData) {
        setListingGrowth(listingGrowthData.map(r => ({
          date: new Date(r.post_date).toLocaleDateString(),
          listings: r.new_listings
        })).reverse());
      }

      // 5. Top Properties
      const { data: topPropsData } = await supabase
        .from('admin_top_properties')
        .select('*');
      if (topPropsData) setTopProperties(topPropsData);

    } catch (error) {
      console.error('Error fetching analytics:', error);
      alert('Failed to load analytics data. Are you sure you are logged in as an Admin?');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !metrics) {
    return <div className="p-10 text-center text-gray-500">Loading Analytics...</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-gray-50 min-h-screen">
      
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics & Reporting</h1>
          <p className="text-gray-500 mt-1">Platform performance overview and insights.</p>
        </div>
        <div className="flex items-center space-x-2 bg-white border border-gray-200 rounded-lg p-2">
          <Calendar size={18} className="text-gray-400" />
          <select 
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-transparent text-sm font-medium focus:outline-none"
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* OVERVIEW METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Total Users" 
          value={(metrics?.total_seekers || 0) + (metrics?.total_landlords || 0)} 
          subtitle={`${metrics?.total_seekers || 0} Seekers | ${metrics?.total_landlords || 0} Landlords`}
          icon={<Users size={24} className="text-blue-600" />}
        />
        <MetricCard 
          title="Active Listings" 
          value={metrics?.active_listings || 0} 
          subtitle={`${metrics?.new_listings_today || 0} new today`}
          icon={<Home size={24} className="text-green-600" />}
        />
        <MetricCard 
          title="Messages Sent" 
          value={metrics?.total_messages || 0} 
          subtitle="Platform engagement"
          icon={<MessageSquare size={24} className="text-purple-600" />}
        />
        <MetricCard 
          title="Trust & Safety" 
          value={metrics?.open_reports || 0} 
          subtitle="Open flagged reports"
          icon={<AlertTriangle size={24} className="text-red-600" />}
          alert={metrics?.open_reports > 0}
        />
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">User Growth</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={userGrowth}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="date" tick={{fontSize: 12, fill: '#6B7280'}} axisLine={false} tickLine={false} />
                <YAxis tick={{fontSize: 12, fill: '#6B7280'}} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend />
                <Line type="monotone" dataKey="seeker" stroke="#3B82F6" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                <Line type="monotone" dataKey="landlord" stroke="#10B981" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Listings Created</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={listingGrowth}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="date" tick={{fontSize: 12, fill: '#6B7280'}} axisLine={false} tickLine={false} />
                <YAxis tick={{fontSize: 12, fill: '#6B7280'}} axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#F3F4F6'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="listings" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* DATA TABLES & INSIGHTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Signups */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Recent Signups</h3>
            <button className="text-sm text-blue-600 font-medium hover:underline">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3 rounded-r-lg">Date Joined</th>
                </tr>
              </thead>
              <tbody>
                {recentSignups.map((user, i) => (
                  <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                    <td className="px-4 py-4 font-medium text-gray-900">{user.full_name || 'Anonymous'}</td>
                    <td className="px-4 py-4 text-gray-500">{user.email}</td>
                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${user.role === 'landlord' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-500">{new Date(user.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Most Viewed Properties */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Most Viewed Properties</h3>
          <div className="space-y-4">
            {topProperties.length > 0 ? topProperties.map((prop, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="overflow-hidden mr-3">
                  <p className="font-medium text-gray-900 truncate text-sm">{prop.title}</p>
                  <p className="text-xs text-gray-500 truncate">{prop.location}</p>
                </div>
                <div className="text-right whitespace-nowrap">
                  <p className="text-sm font-bold text-gray-900">{prop.view_count}</p>
                  <p className="text-[10px] text-gray-400 uppercase font-semibold">Views</p>
                </div>
              </div>
            )) : (
              <p className="text-sm text-gray-500 text-center py-4">No view data available yet.</p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}

function MetricCard({ title, value, subtitle, icon, alert }: any) {
  return (
    <div className={`bg-white p-6 rounded-xl border ${alert ? 'border-red-200 shadow-red-100' : 'border-gray-200'} shadow-sm`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <h4 className="text-3xl font-bold text-gray-900">{value}</h4>
        </div>
        <div className={`p-3 rounded-lg ${alert ? 'bg-red-50' : 'bg-gray-50'}`}>
          {icon}
        </div>
      </div>
      <p className={`text-sm mt-4 font-medium ${alert ? 'text-red-600' : 'text-gray-400'}`}>
        {subtitle}
      </p>
    </div>
  );
}
