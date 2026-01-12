"use client";
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { ArrowLeft, Loader, Home } from 'lucide-react';
import Link from 'next/link';

// Import Components
import ProfileHeader from '@/Components/Profile/ProfileHeader';
import ProfileAbout from '@/Components/Profile/ProfileAbout';
import ProfileExperience from '@/Components/Profile/ProfileExperience';
import ProfileSkills from '@/Components/Profile/ProfileSkills';
import EditProfileModal from '@/Components/EditProfileModal';

export default function UserProfilePage() {
  const params = useParams(); 
  const router = useRouter();
  
  const { user: currentUser } = useSelector((state) => state.auth);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);

  // 1. Get Username from URL
  // (If URL is /profile/msdhoni, params.username will be "msdhoni")
  const usernameParam = params.username;
  
  // Check if this is MY profile by comparing usernames
  // (Ensure your Auth Redux state includes the logged-in user's username!)
  const isOwnProfile = currentUser?.username === usernameParam;

  useEffect(() => {
    if (!usernameParam) return;

    const fetchProfile = async () => {
      try {
        const token = currentUser?.token || localStorage.getItem('token');
        
        // 2. Fetch from the NEW endpoint
        const res = await fetch(`http://localhost:5000/api/dashboard/u/${usernameParam}`, {
           headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.ok) {
           const data = await res.json();
           setProfile(data);
        } else {
           console.error("User not found");
           setProfile(null);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [usernameParam, currentUser]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Loader className="animate-spin text-brand-primary" size={40} />
    </div>
  );

  if (!profile) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 gap-4">
        <h2 className="text-xl font-bold text-slate-500">User not found</h2>
        <Link href="/dashboard" className="text-brand-primary hover:underline">Go Home</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">
      
      {/* Top Nav */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
             <ArrowLeft size={20} className="text-slate-600 dark:text-slate-300"/>
          </button>
          <span className="font-bold text-lg dark:text-white hidden md:block">
            {/* Decode URI component handles spaces/special chars in URL */}
            {decodeURIComponent(usernameParam)}
          </span>
          
          <Link href="/dashboard" className="ml-auto flex items-center gap-2 text-sm font-bold text-brand-primary">
             <Home size={18} /> <span className="hidden md:inline">Dashboard</span>
          </Link>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 pt-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
         
         <ProfileHeader 
            profile={profile} 
            isOwnProfile={isOwnProfile} 
            onEdit={() => setShowEdit(true)} 
         />

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

      {/* Edit Modal */}
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