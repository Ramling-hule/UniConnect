"use client";
import React, { useEffect, useState } from 'react';
import { UserPlus } from 'lucide-react';
import { useSelector } from 'react-redux';

const SuggestionSkeleton = ({ isDark }) => (
  <div className="space-y-4">
     {[1, 2, 3].map(i => (
       <div key={i} className="flex items-center justify-between animate-pulse">
          <div className="flex gap-3">
             <div className={`w-10 h-10 rounded-full ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
             <div className="space-y-1">
                <div className={`h-3 w-24 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
                <div className={`h-2 w-16 rounded ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
             </div>
          </div>
       </div>
     ))}
  </div>
);

export default function Suggestions() {
  const { isDark } = useSelector((state) => state.theme);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/dashboard/suggestions');
        if (res.ok) setUsers(await res.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSuggestions();
  }, []);

  return (
    <div className={`rounded-xl p-4 border transition-colors ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
      <h3 className={`font-bold mb-4 text-sm ${isDark ? 'text-white' : 'text-slate-700'}`}>Who to follow</h3>
      
      {loading ? (
        <SuggestionSkeleton isDark={isDark} />
      ) : (
        <div className="space-y-4">
          {users.map((u) => (
            <div key={u._id} className="flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold text-sm">
                  {u.name?.[0]}
                </div>
                <div className="overflow-hidden">
                  <h4 className={`font-bold text-sm truncate w-28 ${isDark ? 'text-white' : 'text-slate-900'}`}>{u.name}</h4>
                  <p className="text-xs text-slate-500 truncate w-28">{u.institute}</p>
                </div>
              </div>
              <button className="text-brand-primary p-2 hover:bg-brand-primary/10 rounded-full transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                <UserPlus size={18} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-slate-200/50 text-xs text-slate-400 flex flex-wrap gap-x-4 gap-y-2">
         <a href="#" className="hover:underline">About</a>
         <a href="#" className="hover:underline">Privacy</a>
         <span>© 2026</span>
      </div>
    </div>
  );
}