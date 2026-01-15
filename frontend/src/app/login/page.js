"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { authStart, authSuccess, authFailure, resetAuthStatus } from '@/redux/features/authSlice';
import { API_BASE_URL } from '@/utils/config';

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  
  // Get Global State from Redux
  const { isLoading, error, user } = useSelector((state) => state.auth);
  
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isDark, setIsDark] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) router.push('/dashboard');
    return () => dispatch(resetAuthStatus()); // Cleanup errors on unmount
  }, [user, router, dispatch]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    dispatch(authStart()); // 1. Start Loading

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }

      dispatch(authSuccess(data)); // 2. Save User & Stop Loading 
      router.push('/dashboard'); // Redirect to Dashboard

    } catch (err) {
      dispatch(authFailure(err.message)); // 3. Set Error
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-500 ${isDark ? 'bg-brand-dark text-white' : 'bg-white text-slate-900'}`}>
      
      <button onClick={() => setIsDark(!isDark)} className="absolute top-6 right-6 p-2 rounded-full opacity-50 hover:opacity-100">
        {isDark ? '☀️' : '🌙'}
      </button>

      <div className={`w-full max-w-md p-8 rounded-2xl border shadow-2xl transition-all ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
        
        <div className="text-center mb-8">
          <div className="w-12 h-12 mx-auto rounded-xl bg-brand-primary flex items-center justify-center text-xl font-bold text-white mb-4 shadow-lg shadow-blue-500/30">U</div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-sm opacity-60 mt-2">Enter your details to access your dashboard.</p>
        </div>

        {/* Redux Error Message */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium border border-red-100 text-center animate-pulse">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleLogin}>
          <div>
            <label className="text-xs font-bold uppercase opacity-70 mb-1 block">Email</label>
            <input 
              name="email"
              type="email" 
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="student@institute.edu"
              className={`w-full p-3 rounded-xl border outline-none focus:ring-2 transition-all ${isDark ? 'bg-slate-900 border-slate-700 focus:ring-brand-primary' : 'bg-slate-50 border-slate-200 focus:ring-brand-primary'}`}
            />
          </div>
          
          <div>
            <label className="text-xs font-bold uppercase opacity-70 mb-1 block">Password</label>
            <input 
              name="password"
              type="password" 
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              className={`w-full p-3 rounded-xl border outline-none focus:ring-2 transition-all ${isDark ? 'bg-slate-900 border-slate-700 focus:ring-brand-primary' : 'bg-slate-50 border-slate-200 focus:ring-brand-primary'}`}
            />
          </div>

          <button 
            disabled={isLoading}
            className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5 shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed
              ${isDark ? 'bg-brand-primary text-white hover:brightness-110' : 'bg-brand-primary text-white hover:bg-blue-700'}`}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-xs mt-8 opacity-60">
          Don't have an account? <Link href="/register" className="font-bold underline hover:opacity-100 text-brand-primary">Sign up</Link>
        </p>

      </div>
    </div>
  );
}