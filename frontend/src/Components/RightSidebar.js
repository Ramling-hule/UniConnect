"use client";
import React from 'react';
import { useSelector } from 'react-redux';
import Suggestions from './Suggestions';

export default function RightSidebar() {
  const { isDark } = useSelector((state) => state.theme);

  return (
    // This <aside> fills the "xl:mr-80" gap created in your Layout
    <aside className={`hidden xl:block w-80 fixed right-0 top-16 h-[calc(100vh-64px)] overflow-y-auto border-l p-4 transition-colors duration-500
      ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
      
      {/* Render the suggestions content inside the fixed sidebar */}
      <Suggestions />
      
    </aside>
  );
}