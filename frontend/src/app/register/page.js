"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { authStart, authSuccess, authFailure, resetAuthStatus } from '@/redux/features/authSlice';
import { API_BASE_URL } from '@/utils/config';

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { isLoading, error, user } = useSelector((state) => state.auth);

  const [isDark, setIsDark] = useState(false);
  const [step, setStep] = useState(1);
  const [tempUserId, setTempUserId] = useState(null); 
  const [otp, setOtp] = useState(["", "", "", ""]);
  const inputRefs = useRef([]);

  // Redirect if already logged in
  useEffect(() => {
    if (user) router.push('/dashboard');
    return () => dispatch(resetAuthStatus());
  }, [user, router, dispatch]);

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

  // --- STEP 1: REGISTER (Get ID, Move to Step 2) ---
  const handleRegister = async (e) => {
    e.preventDefault();
    dispatch(authStart()); 

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // SUCCESS STEP 1:
      // 1. Save the userId returned by backend (needed for verification)
      setTempUserId(data.userId); 
      
      // 2. Stop the Redux loading spinner, but DO NOT log in yet
      dispatch(resetAuthStatus()); 
      
      // 3. Move UI to Step 2
      setStep(2); 

    } catch (err) {
      dispatch(authFailure(err.message));
    }
  };

  // --- OTP INPUT HANDLERS ---
  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 3) inputRefs.current[index + 1].focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  // --- STEP 2: VERIFY (Get Token, Log In) ---
  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 4) return alert("Please enter the 4-digit code");

    dispatch(authStart());

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: tempUserId, code }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Verification failed');
      }

      // SUCCESS STEP 2:
      // 1. Backend returned { token, _id, name... }
      // 2. Dispatch success to save to Redux & LocalStorage
      // dispatch(authSuccess(data)); 
      
      // 3. Redirect (Happens automatically via useEffect, or force it here)
      router.push('/login');

    } catch (err) {
      dispatch(authFailure(err.message));
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-500 ${isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}>
      
      <button onClick={() => setIsDark(!isDark)} className="absolute top-6 right-6 p-2 rounded-full opacity-50 hover:opacity-100 text-2xl">
        {isDark ? '☀️' : '🌙'}
      </button>

      <div className={`w-full max-w-md p-8 rounded-2xl border shadow-2xl transition-all ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
        
        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto rounded-xl bg-blue-600 flex items-center justify-center text-xl font-bold text-white mb-4 shadow-lg shadow-blue-500/30">U</div>
          <h1 className="text-2xl font-bold tracking-tight">
            {step === 1 ? "Create Account" : "Verify Email"}
          </h1>
          <p className="text-sm opacity-60 mt-2">
            {step === 1 ? "Join the competition ecosystem." : `Enter the 4-digit code sent to ${formData.email}`}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm font-medium border border-red-100 text-center animate-pulse">
            {error}
          </div>
        )}

        {/* STEP 1 FORM */}
        {step === 1 && (
          <form className="space-y-4" onSubmit={handleRegister}>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-xs font-bold uppercase opacity-70 mb-1 block">Full Name</label>
                    <input name="name" onChange={handleChange} required type="text" placeholder="John Doe" className={`w-full p-3 rounded-xl border outline-none focus:ring-2 transition-all ${isDark ? 'bg-slate-900 border-slate-700 focus:ring-blue-500' : 'bg-slate-50 border-slate-200 focus:ring-blue-500'}`}/>
                </div>
                <div>
                    <label className="text-xs font-bold uppercase opacity-70 mb-1 block">Username</label>
                    <input name="username" onChange={handleChange} required type="text" placeholder="@johnny" className={`w-full p-3 rounded-xl border outline-none focus:ring-2 transition-all ${isDark ? 'bg-slate-900 border-slate-700 focus:ring-blue-500' : 'bg-slate-50 border-slate-200 focus:ring-blue-500'}`}/>
                </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase opacity-70 mb-1 block">Institute Name</label>
              <input name="institute" onChange={handleChange} required type="text" placeholder="e.g. IIT Bombay" className={`w-full p-3 rounded-xl border outline-none focus:ring-2 transition-all ${isDark ? 'bg-slate-900 border-slate-700 focus:ring-blue-500' : 'bg-slate-50 border-slate-200 focus:ring-blue-500'}`}/>
            </div>

            <div>
              <label className="text-xs font-bold uppercase opacity-70 mb-1 block">Email</label>
              <input name="email" onChange={handleChange} required type="email" placeholder="student@institute.edu" className={`w-full p-3 rounded-xl border outline-none focus:ring-2 transition-all ${isDark ? 'bg-slate-900 border-slate-700 focus:ring-blue-500' : 'bg-slate-50 border-slate-200 focus:ring-blue-500'}`}/>
            </div>
            
            <div>
              <label className="text-xs font-bold uppercase opacity-70 mb-1 block">Password</label>
              <input name="password" onChange={handleChange} required type="password" placeholder="••••••••" className={`w-full p-3 rounded-xl border outline-none focus:ring-2 transition-all ${isDark ? 'bg-slate-900 border-slate-700 focus:ring-blue-500' : 'bg-slate-50 border-slate-200 focus:ring-blue-500'}`}/>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5 shadow-lg shadow-blue-500/20 disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700`}
            >
              {isLoading ? 'Sending Code...' : 'Continue →'}
            </button>
          </form>
        )}

        {/* STEP 2 FORM */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-up">
            <div className="flex gap-3 justify-center">
                {otp.map((digit, i) => (
                    <input 
                        key={i}
                        ref={(el) => inputRefs.current[i] = el}
                        type="text" 
                        maxLength="1"
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(i, e)}
                        className={`w-14 h-14 text-center text-2xl font-bold rounded-xl border outline-none focus:ring-2 transition-all ${isDark ? 'bg-slate-900 border-slate-700 focus:ring-blue-500' : 'bg-slate-50 border-slate-200 focus:ring-blue-500'}`}
                    />
                ))}
            </div>

            <button 
                onClick={handleVerify}
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl font-bold text-sm bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-lg disabled:opacity-50"
            >
              {isLoading ? 'Verifying...' : 'Verify & Complete'}
            </button>

            <button onClick={() => setStep(1)} className="w-full text-xs font-bold opacity-50 hover:opacity-100">
              Change Email / Go Back
            </button>
          </div>
        )}

        <p className="text-center text-xs mt-8 opacity-60">
          Already have an account? <Link href="/login" className="font-bold underline hover:opacity-100 text-blue-600">Log in</Link>
        </p>

      </div>
    </div>
  );
}