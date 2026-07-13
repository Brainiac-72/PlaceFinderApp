'use client';

import { usePathname } from 'next/navigation';
import { 
  BarChart3, 
  Users, 
  Home, 
  AlertTriangle, 
  Megaphone, 
  Settings, 
  LogOut 
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Users', href: '/users', icon: Users },
    { name: 'Listings', href: '/listings', icon: Home },
    { name: 'Reports', href: '/reports', icon: AlertTriangle },
    { name: 'Broadcast', href: '/broadcast', icon: Megaphone },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const handleSignOut = async () => {
    // Delete the cookie
    document.cookie = 'admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    window.location.href = '/login';
  };

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex-shrink-0 flex flex-col h-full z-20">
      {/* Header */}
      <div className="h-20 flex items-center px-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-2 rounded-xl shadow-lg shadow-blue-500/25">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <span className="text-lg font-bold text-white tracking-tight block">PlaceFinder</span>
            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider font-mono">Control Panel</span>
          </div>
        </div>
      </div>
      
      {/* Navigation */}
      <div className="flex-1 px-4 py-6 overflow-y-auto space-y-7">
        <div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-3">Management</p>
          <nav className="space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 mr-3 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-100'}`} />
                  {item.name}
                </a>
              );
            })}
          </nav>
        </div>
      </div>
      
      {/* Sign Out */}
      <div className="p-4 border-t border-slate-800/60">
        <button
          onClick={handleSignOut}
          className="flex items-center justify-center w-full px-4 py-3 text-sm font-semibold rounded-xl text-red-400 bg-red-500/5 hover:bg-red-500/10 hover:text-red-300 transition-all duration-200 border border-red-500/10"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
