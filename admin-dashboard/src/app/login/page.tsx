'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    document.cookie = "admin_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'adadebtz' && password === 'Ae@198600') {
      document.cookie = "admin_token=true; path=/; max-age=86400; SameSite=Strict";
      router.push('/analytics');
    } else {
      setError('Invalid admin credentials provided');
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-white">
      {/* Left Side - Brand & Graphics */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden items-center justify-center">
        {/* Abstract Background Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/40 via-slate-900/80 to-slate-900 blur-2xl"></div>
        <div className="absolute top-20 right-20 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 p-12 text-center max-w-2xl mx-auto flex flex-col items-center">
          <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md mb-8 border border-white/10 shadow-2xl">
            <Building2 size={64} className="text-white" strokeWidth={1.5} />
          </div>
          <h1 className="text-5xl font-bold text-white tracking-tight mb-6">
            PlaceFinder <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Pro</span>
          </h1>
          <p className="text-lg text-slate-300 leading-relaxed max-w-md">
            The central command center for platform moderation, real-time analytics, and secure user management.
          </p>
          
          <div className="mt-16 flex items-center space-x-2 text-slate-400 bg-white/5 py-2 px-4 rounded-full border border-white/5">
            <ShieldCheck size={18} className="text-blue-400" />
            <span className="text-sm font-medium">Secured by Enterprise-Grade Authentication</span>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-gray-50/50 relative">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
        
        <div className="w-full max-w-md relative z-10">
          <div className="mb-10 text-center lg:text-left">
            <div className="lg:hidden flex justify-center mb-6">
              <div className="bg-slate-900 p-3 rounded-xl shadow-lg">
                <Building2 size={32} className="text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Admin Portal
            </h2>
            <p className="mt-3 text-sm text-slate-500 font-medium">
              Please enter your specialized credentials to proceed.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleLogin}>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  Admin Username
                </label>
                <input
                  type="text"
                  required
                  className="block w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow shadow-sm hover:shadow-md"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              
              <div>
                <div className="flex justify-between items-baseline mb-2">
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Secure Password
                  </label>
                </div>
                <input
                  type="password"
                  required
                  className="block w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow shadow-sm hover:shadow-md"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50/80 border border-red-100 text-red-600 text-sm font-medium p-3 rounded-lg flex items-center">
                <AlertCircle size={16} className="mr-2 flex-shrink-0" />
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                className="group w-full flex items-center justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-all shadow-lg hover:shadow-xl transform active:scale-[0.98]"
              >
                Authenticate
                <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            
            <p className="text-center text-xs font-medium text-slate-400 mt-8">
              Unauthorized access is strictly prohibited and logged.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
