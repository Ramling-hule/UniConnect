"use client";
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setTheme } from '@/redux/features/themeSlice';

export default function ThemeWrapper({ children }) {
  const dispatch = useDispatch();
  const { isDark } = useSelector((state) => state.theme);

  // 1. Run once on mount to check localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      dispatch(setTheme(true));
    }
  }, [dispatch]);

  return (
    <div className={`min-h-screen transition-colors duration-500 font-sans 
      ${isDark ? 'bg-brand-dark text-white' : 'bg-[#F8FAFC] text-slate-900'}`
    }>
      {children}
    </div>
  );
}
