"use client";
import React from 'react';
import { useSelector } from 'react-redux';
import { Trophy, Calendar, MapPin } from 'lucide-react';

export default function HackathonsView() {
  const { isDark } = useSelector((state) => state.theme);

  return (
    <div className="space-y-6 animate-fade-up">
       {[1, 2, 3].map(i => (
          <div key={i} className={`p-6 rounded-xl border shadow-sm flex flex-col md:flex-row gap-6 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
             <div className="w-full md:w-56 h-32 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold text-2xl">
                HACK 2026
             </div>
             <div className="flex-1">
                <div className="flex justify-between items-start">
                   <div>
                      <h3 className={`font-bold text-xl ${isDark ? 'text-white' : 'text-slate-900'}`}>Global AI Challenge</h3>
                      <p className="text-sm text-slate-500 mb-2">Organized by IIT Bombay</p>
                   </div>
                   <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">Live</span>
                </div>
                
                <div className="flex gap-4 text-xs text-slate-500 my-4">
                   <span className="flex items-center gap-1"><Calendar size={14}/> Oct 24, 2026</span>
                   <span className="flex items-center gap-1"><MapPin size={14}/> Remote</span>
                   <span className="flex items-center gap-1"><Trophy size={14}/> $10,000 Prize</span>
                </div>

                <div className="flex gap-3">
                   <button className="bg-brand-primary text-white px-6 py-2 rounded-lg font-bold text-sm hover:opacity-90">Register</button>
                   <button className={`border px-6 py-2 rounded-lg font-bold text-sm ${isDark ? 'border-slate-600 text-white hover:bg-slate-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>View Details</button>
                </div>
             </div>
          </div>
       ))}
    </div>
  );
}