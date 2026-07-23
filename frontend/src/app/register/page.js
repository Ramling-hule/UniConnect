"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { authStart, authSuccess, authFailure, resetAuthStatus } from '@/redux/features/authSlice';
import apiClient from '@/services/apiClient';
import { extractErrorMessage } from '@/utils/errorHelper';
import toast from 'react-hot-toast';
import { GoogleLogin } from '@react-oauth/google';
import { registerSchema, getZodError } from '@/utils/schemas';
import { Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { isLoading, error, user } = useSelector((state) => state.auth);

  const [isDark, setIsDark] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1);
  const [tempUserId, setTempUserId] = useState(null); 
  const [otp, setOtp] = useState(["", "", "", ""]);
  const inputRefs = useRef([]);

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

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      registerSchema.parse(formData);
    } catch (err) {
      dispatch(authFailure(getZodError(err)));
      return;
    }
    dispatch(authStart()); 

    try {
      const { data } = await apiClient.post('/api/auth/register', formData);
      setTempUserId(data.userId); 
      dispatch(resetAuthStatus()); 
      setStep(2); 
      toast.success('Registration successful! Please verify your email.');
    } catch (err) {
      const msg = extractErrorMessage(err, 'Registration failed');
      dispatch(authFailure(msg));
      toast.error(msg);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    dispatch(authStart());
    try {
      const { data } = await apiClient.post('/api/auth/google', { credential: credentialResponse.credential });
      dispatch(authSuccess(data));
      if (data.mfaRequired) {
        router.push('/login');
      } else {
        toast.success('Welcome!');
        router.push('/dashboard');
      }
    } catch (err) {
      const msg = extractErrorMessage(err, 'Google Sign In failed');
      dispatch(authFailure(msg));
      toast.error(msg);
    }
  };

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

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 4) return toast.error("Please enter the 4-digit code");

    dispatch(authStart());

    try {
      await apiClient.post('/api/auth/verify-email', { userId: tempUserId, code });
      toast.success('Account verified successfully! Please log in.');
      router.push('/login');
    } catch (err) {
      const msg = extractErrorMessage(err, 'Verification failed');
      dispatch(authFailure(msg));
      toast.error(msg);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-500 ${isDark ? 'bg-brand-dark text-white' : 'bg-brand-light text-slate-900'}`}>
      
      <button onClick={() => setIsDark(!isDark)} className="absolute top-6 right-6 p-2 rounded-full opacity-50 hover:opacity-100 text-2xl">
        {isDark ? '☀️' : '🌙'}
      </button>

      <div className={`w-full max-w-md p-8 rounded-2xl border shadow-2xl transition-all ${isDark ? 'bg-brand-dark-card border-brand-dark-border' : 'bg-brand-light-card border-brand-light-border'}`}>
        
        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto rounded-xl bg-brand-primary flex items-center justify-center text-xl font-bold text-white mb-4 shadow-lg shadow-brand-primary/30">U</div>
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

        {step === 1 && (
          <>
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
                <div className="relative">
                  <input name="password" onChange={handleChange} required type={showPassword ? "text" : "password"} placeholder="••••••••" className={`w-full p-3 rounded-xl border outline-none focus:ring-2 transition-all pr-10 ${isDark ? 'bg-slate-900 border-slate-700 focus:ring-blue-500' : 'bg-slate-50 border-slate-200 focus:ring-blue-500'}`}/>
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100"
                  >
                    {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5 shadow-lg shadow-brand-primary/20 disabled:opacity-50 bg-brand-primary text-white hover:brightness-110`}
              >
                {isLoading ? 'Sending Code...' : 'Continue →'}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-center space-x-2 opacity-50 text-sm">
              <div className="h-px bg-current flex-1"></div>
              <span>OR</span>
              <div className="h-px bg-current flex-1"></div>
            </div>

            <div className="mt-6 flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {
                  dispatch(authFailure("Google Sign In Failed"));
                }}
                theme={isDark ? "filled_black" : "outline"}
                shape="rectangular"
              />
            </div>
          </>
        )}

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
                className="w-full py-3.5 rounded-xl font-bold text-sm bg-brand-primary text-white hover:brightness-110 transition-all shadow-lg disabled:opacity-50"
            >
              {isLoading ? 'Verifying...' : 'Verify & Complete'}
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
