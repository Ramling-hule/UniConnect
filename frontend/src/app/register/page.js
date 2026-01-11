"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { authStart, authSuccess, authFailure, resetAuthStatus } from '@/redux/features/authSlice';

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { isLoading, error, user } = useSelector((state) => state.auth);

  const [isDark, setIsDark] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    return () => dispatch(resetAuthStatus());
  }, [dispatch]);

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    institute: '',
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    dispatch(authStart()); 

    try {
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      dispatch(authSuccess(data)); 
      
      // Move to Step 2 (Verification UI)
      setStep(2); 

    } catch (err) {
      dispatch(authFailure(err.message));
      console.log(err.message);
      
    }
  };

  const handleVerify = () => {
    router.push('/dashboard');
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-500 ${isDark ? 'bg-brand-dark text-white' : 'bg-white text-slate-900'}`}>
      
      <button onClick={() => setIsDark(!isDark)} className="absolute top-6 right-6 p-2 rounded-full opacity-50 hover:opacity-100">
        {isDark ? '☀️' : '🌙'}
      </button>

      <div className={`w-full max-w-md p-8 rounded-2xl border shadow-2xl transition-all ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
        
        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto rounded-xl bg-brand-primary flex items-center justify-center text-xl font-bold text-white mb-4 shadow-lg shadow-blue-500/30">U</div>
          <h1 className="text-2xl font-bold tracking-tight">
            {step === 1 ? "Create Account" : "Verify Email"}
          </h1>
          <p className="text-sm opacity-60 mt-2">
            {step === 1 ? "Join the competition ecosystem." : `We sent a code to ${formData.email}`}
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium border border-red-100 text-center animate-pulse">
            {error}
          </div>
        )}

        {/* STEP 1: FORM */}
        {step === 1 && (
          <form className="space-y-4" onSubmit={handleRegister}>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-bold uppercase opacity-70 mb-1 block">Full Name</label>
                    <input name="name" onChange={handleChange} required type="text" placeholder="John Doe" className={`w-full p-3 rounded-xl border outline-none focus:ring-2 transition-all ${isDark ? 'bg-slate-900 border-slate-700 focus:ring-brand-primary' : 'bg-slate-50 border-slate-200 focus:ring-brand-primary'}`}/>
                </div>
                <div>
                    <label className="text-xs font-bold uppercase opacity-70 mb-1 block">Username</label>
                    <input name="username" onChange={handleChange} required type="text" placeholder="@johnny" className={`w-full p-3 rounded-xl border outline-none focus:ring-2 transition-all ${isDark ? 'bg-slate-900 border-slate-700 focus:ring-brand-primary' : 'bg-slate-50 border-slate-200 focus:ring-brand-primary'}`}/>
                </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase opacity-70 mb-1 block">Institute Name</label>
              <input name="institute" onChange={handleChange} required type="text" placeholder="e.g. IIT Bombay" className={`w-full p-3 rounded-xl border outline-none focus:ring-2 transition-all ${isDark ? 'bg-slate-900 border-slate-700 focus:ring-brand-primary' : 'bg-slate-50 border-slate-200 focus:ring-brand-primary'}`}/>
            </div>

            <div>
              <label className="text-xs font-bold uppercase opacity-70 mb-1 block">Email</label>
              <input name="email" onChange={handleChange} required type="email" placeholder="student@institute.edu" className={`w-full p-3 rounded-xl border outline-none focus:ring-2 transition-all ${isDark ? 'bg-slate-900 border-slate-700 focus:ring-brand-primary' : 'bg-slate-50 border-slate-200 focus:ring-brand-primary'}`}/>
            </div>
            
            <div>
              <label className="text-xs font-bold uppercase opacity-70 mb-1 block">Password</label>
              <input name="password" onChange={handleChange} required type="password" placeholder="••••••••" className={`w-full p-3 rounded-xl border outline-none focus:ring-2 transition-all ${isDark ? 'bg-slate-900 border-slate-700 focus:ring-brand-primary' : 'bg-slate-50 border-slate-200 focus:ring-brand-primary'}`}/>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5 shadow-lg shadow-blue-500/20 disabled:opacity-50
              ${isDark ? 'bg-brand-primary text-white hover:brightness-110' : 'bg-brand-primary text-white hover:bg-blue-700'}`}
            >
              {isLoading ? 'Creating Account...' : 'Continue →'}
            </button>
          </form>
        )}

        {/* STEP 2: VERIFICATION (Visual) */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-up">
            <div className="flex gap-3 justify-center">
                {[1,2,3,4].map((_, i) => (
                    <input 
                        key={i} 
                        type="text" 
                        maxLength="1"
                        className={`w-14 h-14 text-center text-2xl font-bold rounded-xl border outline-none focus:ring-2 transition-all ${isDark ? 'bg-slate-900 border-slate-700 focus:ring-brand-primary' : 'bg-slate-50 border-slate-200 focus:ring-brand-primary'}`}
                    />
                ))}
            </div>

            <button 
                onClick={handleVerify}
                className="w-full py-3.5 rounded-xl font-bold text-sm bg-brand-primary text-white hover:bg-blue-700 transition-all shadow-lg"
            >
              Verify & Complete
            </button>

            <button onClick={() => setStep(1)} className="w-full text-xs font-bold opacity-50 hover:opacity-100">
              Change Email / Go Back
            </button>
          </div>
        )}

        <p className="text-center text-xs mt-8 opacity-60">
          Already have an account? <Link href="/login" className="font-bold underline hover:opacity-100 text-brand-primary">Log in</Link>
        </p>

      </div>
    </div>
  );
}