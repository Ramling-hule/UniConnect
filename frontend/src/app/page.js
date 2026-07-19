"use client";
import React, { useState } from 'react';
import Link from 'next/link';

// --- ICONS ---
const SunIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
);
const MoonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
);

// --- DASHBOARD CARD COMPONENT (ShopWave Style) ---
const DashboardGraphic = ({ isDark }) => (
  <div className="relative animate-float">
    {/* Main Card */}
    <div className={`
      relative p-6 rounded-2xl w-80 shadow-2xl transition-all duration-500 border
      ${isDark ? 'bg-brand-dark-card border-brand-dark-border' : 'bg-brand-light-card border-brand-light-border'}
    `}>
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
          JD
        </div>
        <div>
           <h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>John Doe</h3>
           <p className="text-xs text-gray-400">Software Engineer</p>
        </div>
      </div>
      <div className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'} mb-4`}>
        Excited to announce I'll be joining Tech Innovations Inc. as a Senior Developer! 🎉
      </div>
      <div className="flex gap-2">
         <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded">Engineering</span>
         <span className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded">Career Update</span>
      </div>
    </div>

    {/* Floating Badge (Like "Store Manager" in image) */}
    <div className={`
      absolute -right-12 top-12 p-3 rounded-xl shadow-xl border flex items-center gap-3 animate-pulse-slow
      ${isDark ? 'glass border-brand-dark-border' : 'glass border-brand-light-border'}
    `}>
       <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-xs">
          ✓
       </div>
       <div>
          <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>New Connection</p>
          <p className="text-[10px] text-gray-400">Sarah Jenkins</p>
       </div>
    </div>
  </div>
);

// --- MAIN PAGE ---

export default function LandingPage() {
  const [isDark, setIsDark] = useState(false);
  const toggleTheme = () => setIsDark(!isDark);

  return (
    <div className={`min-h-screen transition-colors duration-500 font-sans ${isDark ? 'bg-brand-dark text-white' : 'bg-brand-light text-slate-900'}`}>
      
      {/* NAVBAR */}
      <nav className="flex justify-between items-center py-6 px-6 lg:px-12 max-w-7xl mx-auto relative z-20">
        <div className="flex items-center gap-2">
          {/* Logo */}
          <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/30">
            P
          </div>
          <span className="text-xl font-bold tracking-tight">ProConnect</span>
        </div>
        
        {/* Desktop Links */}
        <div className={`hidden md:flex gap-8 text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
          <a href="#" className="hover:text-brand-primary transition-colors">Hackathons</a>
          <a href="#" className="hover:text-brand-primary transition-colors">Leaderboard</a>
          <a href="#" className="hover:text-brand-primary transition-colors">Institutes</a>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={toggleTheme} className={`p-2 rounded-full transition-all ${isDark ? 'bg-brand-dark-card text-yellow-400' : 'bg-brand-light-card border border-brand-light-border text-slate-600'}`}>
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>
          
          {/* <Link href="/login">
            <button className={`text-sm font-bold px-4 py-2 hover:opacity-70 ${isDark ? 'text-white' : 'text-slate-700'}`}>
                Log in
            </button>
          </Link> */}
          
          <Link href="/login">
            <button className="bg-brand-primary text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20">
                Sign In
            </button>
          </Link>
        </div>
      </nav>

      {/* HERO SECTION */}
      <main className="max-w-7xl mx-auto px-6 lg:px-12 pt-16 lg:pt-28 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        
        {/* LEFT: Text Content */}
        <div className="space-y-8 max-w-xl animate-fade-up">
          
          {/* "Backed by" Badge */}
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${
              isDark ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' : 'bg-orange-50 border-orange-100 text-orange-600'
          }`}>
             <span className="w-2 h-2 rounded-full bg-current"></span> 
             A Platform for Professionals
          </div>

          <h1 className={`text-5xl lg:text-7xl font-bold leading-[1.1] tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Streamline Skills,<br />
            Maximize <span className="text-brand-primary">Growth.</span>
          </h1>

          <p className={`text-lg leading-relaxed max-w-md ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Take control of your professional portfolio. Connect with peers, share updates, and build a career that matters.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <Link href="/login">
                <button className="bg-brand-primary text-white px-8 py-3.5 rounded-lg font-bold text-sm transition-all hover:-translate-y-1 shadow-xl shadow-blue-600/20 w-full sm:w-auto">
                Request Access
                </button>
            </Link>
            <button className={`px-8 py-3.5 rounded-lg font-bold text-sm border flex items-center justify-center gap-2 transition-all ${
                isDark ? 'border-brand-dark-border text-white hover:bg-brand-dark-card' : 'border-brand-light-border text-slate-700 hover:bg-brand-light-card'
            }`}>
              ▶ Watch Demo
            </button>
          </div>

          {/* Logos */}
          <div className="pt-10">
            <p className="text-xs font-bold uppercase tracking-widest mb-6 opacity-40">Trusted by Professionals From</p>
            <div className="flex gap-8 items-center opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
                <span className="text-xl font-bold">Google</span>
                <span className="text-xl font-bold">Microsoft</span>
                <span className="text-xl font-bold">Amazon</span>
            </div>
          </div>
        </div>

        {/* RIGHT: Visuals */}
        <div className="relative flex justify-center lg:justify-end h-[500px] items-center">
          {/* Background Gradient Blob */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl -z-10"></div>
          
          <DashboardGraphic isDark={isDark} />
        </div>

      </main>
    </div>
  );
}