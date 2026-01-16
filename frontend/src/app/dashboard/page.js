"use client";
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation'; // 1. Import Router
import CreatePostModal from '@/Components/CreatePostModal';
import Feed from '@/Components/Feed';
// import Suggestions from '@/Components/Suggestions'; 
import DiscoverView from '@/Components/Views/DiscoverView';
import HackathonsView from '@/Components/Views/HackathonsView';
import ConnectionsView from '@/Components/Views/ConnectionsView';
import { Image as ImageIcon, Calendar } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter(); // 2. Initialize Router
  
  // 3. Get user AND token from Redux
  const { user, token } = useSelector((state) => state.auth);
  const { isDark } = useSelector((state) => state.theme);
  const { activeTab } = useSelector((state) => state.nav);
  
  const [showModal, setShowModal] = useState(false);
  const [newPost, setNewPost] = useState(null);
  
  // 4. Auth Checking State (Prevents flashing content before redirect)
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // 5. PROTECTION LOGIC
  useEffect(() => {
    // If no user or no token, redirect to login
    if (!user) {
       router.push('/login');
    } else {
       // User is authenticated, show the page
       setIsAuthChecking(false);
    }
  }, [user, router]);

  // 6. Loading Guard
  // Don't render anything while checking auth
  if (isAuthChecking) {
     return null; // Or return a <LoadingSpinner /> if you have one
  }

  return (
    <div className="pb-10">
      
      {/* 1. CENTERED CONTAINER */}
      <div className="max-w-3xl mx-auto w-full space-y-6">
        
        {/* Header Title */}
        <div className="flex justify-between items-center">
            <h2 className={`text-2xl font-bold tracking-tight capitalize ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {activeTab === 'home' ? 'Your Feed' : activeTab}
            </h2>
        </div>

        {/* VIEW SWITCHER */}
        {activeTab === 'home' && (
          <>
             {/* "Start Post" Widget */}
             <div className={`p-4 rounded-2xl border shadow-sm transition-colors ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                <div className="flex gap-4 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white font-bold shrink-0 shadow-sm">
                    {user?.name?.[0] || "U"}
                  </div>
                  <button 
                    onClick={() => setShowModal(true)}
                    className={`flex-1 text-left px-5 py-3 rounded-full text-sm font-medium transition-all truncate ${isDark ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200 hover:border-brand-primary/30'}`}
                  >
                    Start a post...
                  </button>
                </div>
                
                {/* Buttons wrapper: responsive padding */}
                <div className="flex gap-4 pl-0 sm:pl-14 justify-between sm:justify-start">
                    <button onClick={() => setShowModal(true)} className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-brand-primary transition-colors px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800">
                        <ImageIcon size={18} className="text-blue-500" /> 
                        <span>Media</span>
                    </button>
                    <button className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-brand-primary transition-colors px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800">
                        <Calendar size={18} className="text-orange-500" /> 
                        <span>Event</span>
                    </button>
                </div>
             </div>

             {/* Feed Component */}
             <Feed newPostTrigger={newPost} />
          </>
        )}

        {activeTab === 'discover' && <DiscoverView />}
        {activeTab === 'hackathons' && <HackathonsView />}
        {activeTab === 'connections' && <ConnectionsView />}
        
        {['groups'].includes(activeTab) && (
            <div className={`p-10 rounded-2xl border border-dashed text-center ${isDark ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-400'}`}>
                <p>Module coming soon.</p>
            </div>
        )}

      </div>

      {/* GLOBAL MODAL */}
      <CreatePostModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        onPostCreated={(post) => setNewPost(post)} 
      />

    </div>
  );
}