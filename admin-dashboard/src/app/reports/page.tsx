'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('moderation_logs')
        .select(`
          *,
          profiles:admin_id (full_name)
        `)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 h-full bg-gray-50">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Trust & Safety Reports</h1>
          <p className="text-gray-500 mt-2 text-sm font-medium">Review flagged content, moderation actions, and user reports.</p>
        </div>
        <button className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold shadow-sm hover:bg-red-700 transition-colors">
          Urgent Action
        </button>
      </div>
      
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-gray-500 flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="font-medium">Loading moderation feed...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-slate-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 font-semibold tracking-wider">Target</th>
                  <th className="px-6 py-4 font-semibold tracking-wider">Action</th>
                  <th className="px-6 py-4 font-semibold tracking-wider">Reason / Context</th>
                  <th className="px-6 py-4 font-semibold tracking-wider">Date Logged</th>
                  <th className="px-6 py-4 font-semibold tracking-wider text-right">Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reports.map((report, i) => (
                  <tr key={i} className="hover:bg-red-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900 capitalize flex items-center gap-2">
                        {report.target_type === 'user' ? (
                          <span className="w-6 h-6 rounded bg-purple-100 text-purple-600 flex items-center justify-center text-xs">U</span>
                        ) : (
                          <span className="w-6 h-6 rounded bg-blue-100 text-blue-600 flex items-center justify-center text-xs">P</span>
                        )}
                        {report.target_type}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 font-mono bg-gray-100 p-1 rounded inline-block">{report.target_id.substring(0, 8)}...</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold uppercase tracking-wider ${
                        report.action === 'flag' ? 'bg-orange-100 text-orange-700 border border-orange-200' : 
                        report.action === 'takedown' ? 'bg-red-100 text-red-700 border border-red-200' :
                        'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {report.action}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-800 max-w-sm truncate">{report.reason || 'Violation of platform policies'}</p>
                      {report.profiles?.full_name && (
                        <p className="text-xs text-gray-500 mt-1">By Admin: {report.profiles.full_name}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500 font-medium">{new Date(report.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-blue-600 hover:text-blue-800 font-semibold text-xs bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">Investigate</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {reports.length === 0 && (
              <div className="p-16 text-center text-gray-500">
                <p className="font-medium text-lg text-gray-900">All clear</p>
                <p className="text-sm mt-1">No moderation reports or takedowns found.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
