"use client";
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setTheme } from '@/redux/features/themeSlice';

export default function ThemeWrapper({ children }) {
  const dispatch = useDispatch();
  const { isDark } = useSelector((state) => state.theme);
  const [mounted, setMounted] = useState(false);

  // 1. Run once on mount to check localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      dispatch(setTheme(true));
    }
    setMounted(true); // Mark as mounted to show UI
  }, [dispatch]);

  // 2. Prevent "Hydration Mismatch" (Optional: hides content until theme is known)
  // If you want to avoid the "flash" of white, you can return null until mounted
  if (!mounted) {
    return <div className="min-h-screen bg-[#F8FAFC]"></div>; // Invisible loader state
  }

  return (
    <div className={`min-h-screen transition-colors duration-500 font-sans 
      ${isDark ? 'bg-brand-dark text-white' : 'bg-[#F8FAFC] text-slate-900'}`
    }>
      {children}
    </div>
  );
}