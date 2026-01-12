import React from 'react';
import { MapPin, Edit3, MessageCircle } from 'lucide-react';
import { openChat } from '@/redux/features/chatSlice';
import { useDispatch } from 'react-redux';

export default function ProfileHeader({ profile, isOwnProfile, onEdit }) {

    const dispatch = useDispatch();

  return (
    <div className="rounded-2xl overflow-hidden border shadow-sm bg-white dark:bg-slate-900 dark:border-slate-800">
      {/* Banner */}
      <div className="h-32 bg-gradient-to-r from-brand-primary to-purple-600 relative">
        {isOwnProfile && (
          <button onClick={onEdit} className="absolute top-4 right-4 bg-black/30 text-white p-2 rounded-full hover:bg-black/50 transition-all">
            <Edit3 size={18} />
          </button>
        )}
      </div>

      <div className="px-6 pb-6 relative">
        {/* Avatar */}
        <div className="-mt-12 w-24 h-24 rounded-full border-4 border-white dark:border-slate-900 bg-white dark:bg-slate-800 flex items-center justify-center text-3xl font-bold shadow-md">
          {profile.name?.[0]}
        </div>

        <div className="mt-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold dark:text-white">{profile.name}</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{profile.headline || "No headline set"}</p>
            <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
              <MapPin size={14} />
              <span>{profile.location || "Location not set"}</span>
            </div>
          </div>

          <div className="flex gap-2">
             {profile.openToWork && (
               <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">Open to Work</span>
             )}
             {!isOwnProfile && (
                <button  onClick={() => dispatch(openChat(profile))} className="flex items-center gap-2 bg-brand-primary text-white px-4 py-2 rounded-lg font-bold text-xs hover:opacity-90">
                   <MessageCircle size={16}/> Message
                </button>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}