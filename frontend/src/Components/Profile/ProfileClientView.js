"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { ArrowLeft, Home } from 'lucide-react';
import Link from 'next/link';
import { openChat } from '@/redux/features/chatSlice';
import { openAuthModal } from '@/redux/features/authSlice';

import ProfileHeader from '@/Components/Profile/ProfileHeader';
import ProfileAbout from '@/Components/Profile/ProfileAbout';
import ProfileExperience from '@/Components/Profile/ProfileExperience';
import ProfileSkills from '@/Components/Profile/ProfileSkills';
import EditProfileModal from '@/Components/EditProfileModal';

export default function ProfileClientView({ initialProfile }) {
  const router = useRouter();
  const dispatch = useDispatch();
  
  const { user: currentUser } = useSelector((state) => state.auth);
  const [profile, setProfile] = useState(initialProfile);
  const [showEdit, setShowEdit] = useState(false);

  const isOwnProfile = currentUser?.username === profile?.username;
  const handleMessageClick = () => {
    if (!currentUser) {
      dispatch(openAuthModal("Please sign in to message this user."));
      return;
    }
    dispatch(openChat(profile));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
             <ArrowLeft size={20} className="text-slate-600 dark:text-slate-300"/>
          </button>
          <span className="font-bold text-lg dark:text-white hidden md:block">
            {profile.name}
          </span>
          
          <Link href={currentUser ? "/dashboard" : "/"} className="ml-auto flex items-center gap-2 text-sm font-bold text-brand-primary">
             <Home size={18} /> <span className="hidden md:inline">{currentUser ? "Dashboard" : "Home"}</span>
          </Link>
      </div>
      <div className="max-w-5xl mx-auto px-4 md:px-6 pt-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
         
         <div onClick={(e) => {
           if (!currentUser && e.target.closest('button')) {
             if (e.target.closest('button').textContent.includes('Message')) {
               e.preventDefault();
               e.stopPropagation();
               handleMessageClick();
             }
           }
         }}>
           <ProfileHeader 
              profile={profile} 
              isOwnProfile={isOwnProfile} 
              onEdit={() => setShowEdit(true)} 
           />
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
               <ProfileAbout about={profile.about} />
               <ProfileExperience experience={profile.experience} />
            </div>
            <div className="space-y-6">
               <ProfileSkills skills={profile.skills} />
            </div>
         </div>
      </div>
      {isOwnProfile && (
        <EditProfileModal 
           isOpen={showEdit} 
           onClose={() => setShowEdit(false)} 
           userData={profile} 
           onUpdate={setProfile} 
        />
      )}

    </div>
  );
}
