'use client';

import React, { useState } from 'react';
import { 
  Settings, 
  ShieldAlert, 
  DollarSign, 
  Database, 
  Bell, 
  Sliders, 
  Save, 
  CheckCircle,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'fees' | 'moderation' | 'system'>('general');
  
  // Settings state values
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [allowSignups, setAllowSignups] = useState(true);
  const [listingFee, setListingFee] = useState(25);
  const [featuredFee, setFeaturedFee] = useState(15);
  const [warningThreshold, setWarningThreshold] = useState(3);
  const [autoFlag, setAutoFlag] = useState(true);
  const [successMsg, setSuccessMsg] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 3000);
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Sliders },
    { id: 'fees', label: 'Fees & Packages', icon: DollarSign },
    { id: 'moderation', label: 'Safety & Moderation', icon: ShieldAlert },
    { id: 'system', label: 'System Status', icon: Database },
  ] as const;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-gray-50 min-h-screen">
      
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
            <Settings className="w-8 h-8 text-slate-800" />
            System Settings
          </h1>
          <p className="text-gray-500 mt-2 text-sm font-medium">Configure global platform metrics, pricing structure, and moderation behaviors.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Navigation Sidebar Tabs */}
        <div className="md:col-span-1 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center px-4 py-3 text-sm font-bold rounded-xl transition-all ${
                  isActive 
                    ? 'bg-slate-900 text-white shadow-md' 
                    : 'text-gray-600 bg-white border border-gray-200/50 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4 mr-3" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Configurations Form Panel */}
        <div className="md:col-span-3">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            
            <form onSubmit={handleSave} className="divide-y divide-gray-100">
              
              {/* Tab: General */}
              {activeTab === 'general' && (
                <div className="p-6 space-y-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">General Configurations</h3>
                  
                  {/* Maintenance Mode */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div>
                      <p className="text-sm font-bold text-slate-950">Maintenance Mode</p>
                      <p className="text-xs text-slate-500 mt-0.5">Offline client app for scheduled updates or maintenance.</p>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setMaintenanceMode(!maintenanceMode)}
                      className="text-slate-800 hover:text-slate-950 transition-colors"
                    >
                      {maintenanceMode ? (
                        <ToggleRight className="w-12 h-8 text-blue-600" />
                      ) : (
                        <ToggleLeft className="w-12 h-8 text-gray-400" />
                      )}
                    </button>
                  </div>

                  {/* Allow Signups */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div>
                      <p className="text-sm font-bold text-slate-950">Allow New Registrations</p>
                      <p className="text-xs text-slate-500 mt-0.5">Toggle whether new seekers or landlords can create accounts.</p>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setAllowSignups(!allowSignups)}
                      className="text-slate-800 hover:text-slate-950 transition-colors"
                    >
                      {allowSignups ? (
                        <ToggleRight className="w-12 h-8 text-blue-600" />
                      ) : (
                        <ToggleLeft className="w-12 h-8 text-gray-400" />
                      )}
                    </button>
                  </div>

                  {/* App Version Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Platform Name</label>
                      <input type="text" defaultValue="PlaceFinder" disabled className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm font-semibold text-gray-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Version Release</label>
                      <input type="text" defaultValue="v1.2.0-beta" disabled className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm font-semibold text-gray-500" />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Fees */}
              {activeTab === 'fees' && (
                <div className="p-6 space-y-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Monetization & Commission Fees</h3>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Standard Listing Price (GH₵)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-gray-400 font-bold text-sm">GH₵</span>
                        <input 
                          type="number" 
                          value={listingFee} 
                          onChange={(e) => setListingFee(Number(e.target.value))}
                          className="w-full pl-14 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-semibold" 
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Charged to landlords per standard property upload.</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Premium Featured Badge (GH₵ / week)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-gray-400 font-bold text-sm">GH₵</span>
                        <input 
                          type="number" 
                          value={featuredFee} 
                          onChange={(e) => setFeaturedFee(Number(e.target.value))}
                          className="w-full pl-14 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-semibold" 
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Cost to feature a listing at the top of the search feed.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Safety */}
              {activeTab === 'moderation' && (
                <div className="p-6 space-y-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Safety & Auto-Moderation</h3>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div>
                      <p className="text-sm font-bold text-slate-950">Auto-Flag Flagged Keywords</p>
                      <p className="text-xs text-slate-500 mt-0.5">Instantly flags listings containing prohibited vocabulary.</p>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setAutoFlag(!autoFlag)}
                      className="text-slate-800 hover:text-slate-950 transition-colors"
                    >
                      {autoFlag ? (
                        <ToggleRight className="w-12 h-8 text-blue-600" />
                      ) : (
                        <ToggleLeft className="w-12 h-8 text-gray-400" />
                      )}
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Max User Warnings Threshold</label>
                    <input 
                      type="range" 
                      min="1" 
                      max="10" 
                      value={warningThreshold} 
                      onChange={(e) => setWarningThreshold(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" 
                    />
                    <div className="flex justify-between text-xs text-gray-400 font-bold mt-1">
                      <span>1 Warning</span>
                      <span className="text-blue-600">{warningThreshold} Warnings before Auto-Ban</span>
                      <span>10 Warnings</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: System */}
              {activeTab === 'system' && (
                <div className="p-6 space-y-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Database & Infrastructure Health</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                      <p className="text-xs text-emerald-800 font-bold uppercase tracking-wider">Database Link Status</p>
                      <p className="text-lg font-black text-emerald-950 mt-1">CONNECTED & SECURE</p>
                    </div>

                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Latency</p>
                      <p className="text-lg font-black text-slate-800 mt-1">42 ms (Stable)</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Services Endpoint Logs</p>
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-900 font-mono text-[10px] text-slate-400 space-y-1 max-h-36 overflow-y-auto">
                      <p className="text-emerald-400">[OK] Supabase API REST Router init succeeded - v3.5</p>
                      <p className="text-emerald-400">[OK] Row-Level Security enabled on 5 tables</p>
                      <p className="text-emerald-400">[OK] Realtime subscriptions bound to table: messages</p>
                      <p className="text-blue-400">[INFO] Cron daemon executed cleaning task for expired listings</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Footer Save Action */}
              <div className="p-6 bg-slate-50 flex items-center justify-between">
                <div>
                  {successMsg && (
                    <span className="text-emerald-600 text-xs font-bold flex items-center gap-1.5 animate-bounce">
                      <CheckCircle className="w-4 h-4" /> Configs updated successfully!
                    </span>
                  )}
                </div>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-slate-900 text-white font-bold text-sm rounded-xl hover:bg-slate-800 transition-all flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Save className="w-4 h-4" />
                  Save Configurations
                </button>
              </div>

            </form>
          </div>
        </div>

      </div>

    </div>
  );
}
