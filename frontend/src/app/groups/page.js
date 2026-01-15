"use client";
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Users, Plus, Lock, Globe } from 'lucide-react';
import GroupChatWindow from '@/Components/GroupChatWindow'; 
import { API_BASE_URL } from '@/utils/config';

export default function GroupsPage() {
  const { user } = useSelector((state) => state.auth);
  const { isDark } = useSelector((state) => state.theme); // Access theme for consistent styling
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Create Form State
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPrivacy, setNewPrivacy] = useState("public");
  const [newImage, setNewImage] = useState(null);

  useEffect(() => {
    if (user?.token) {
        fetchGroups();
    }
  }, [user]);

  const fetchGroups = async () => {
     try {
         const res = await fetch(`${API_BASE_URL}/api/groups`, {
            headers: { Authorization: `Bearer ${user.token}` }
         });
         const data = await res.json();
         if(Array.isArray(data)) setGroups(data);
     } catch (err) {
         console.error("Failed to fetch groups", err);
     }
  };

  const handleCreate = async (e) => {
     e.preventDefault();
     const formData = new FormData();
     formData.append('name', newName);
     formData.append('description', newDesc);
     formData.append('privacy', newPrivacy);
     if(newImage) formData.append('image', newImage);

     try {
         await fetch(`${API_BASE_URL}/api/groups`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${user.token}` },
            body: formData
         });
         
         // Reset and refresh
         setNewName("");
         setNewDesc("");
         setNewImage(null);
         setShowCreateModal(false);
         fetchGroups();
     } catch (error) {
         console.error("Failed to create group", error);
     }
  };

  const handleJoin = async (groupId) => {
      try {
          await fetch(`${API_BASE_URL}/api/groups/join`, {
             method: 'POST',
             headers: { 
                "Content-Type": "application/json",
                Authorization: `Bearer ${user.token}` 
             },
             body: JSON.stringify({ groupId })
          });
          fetchGroups(); 
      } catch (error) {
          console.error("Failed to join group", error);
      }
  };

  return (
    // CONTAINER HEIGHT: 100vh - (Navbar 64px + Padding ~50px) = approx 114px offset
    <div className={`flex h-[calc(100vh-120px)] rounded-2xl overflow-hidden shadow-sm border ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
       
       {/* LEFT COLUMN: Groups List */}
       <div className={`w-full md:w-80 lg:w-96 border-r flex flex-col transition-all duration-300
           ${isDark ? 'border-slate-800 bg-slate-900' : 'bg-white border-slate-100'} 
           ${activeGroup ? 'hidden md:flex' : 'flex'}`}>
         
         {/* Header */}
         <div className={`p-4 border-b flex justify-between items-center sticky top-0 z-10 
            ${isDark ? 'border-slate-800 bg-slate-900' : 'bg-white border-slate-100'}`}>
             <h2 className={`font-bold text-xl ${isDark ? 'text-white' : 'text-slate-800'}`}>Groups</h2>
             <button 
                onClick={() => setShowCreateModal(true)} 
                className="p-2 bg-brand-primary text-white rounded-full hover:bg-blue-700 transition shadow-md shadow-blue-500/30"
                title="Create Group"
             >
                <Plus size={20} />
             </button>
         </div>

         {/* List */}
         <div className="overflow-y-auto flex-1 p-3 space-y-2 custom-scrollbar">
             {groups.length === 0 && (
                 <div className="flex flex-col items-center justify-center mt-10 text-slate-400">
                    <Users size={30} className="mb-2 opacity-50"/>
                    <p className="text-sm">No groups found.</p>
                 </div>
             )}
             
             {groups.map(group => (
                <div key={group._id} 
                     onClick={() => group.isMember ? setActiveGroup(group) : handleJoin(group._id)}
                     className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        activeGroup?._id === group._id 
                        ? 'border-brand-primary bg-blue-50 dark:bg-slate-800 dark:border-blue-900' 
                        : isDark 
                            ? 'border-slate-800 hover:bg-slate-800' 
                            : 'border-transparent hover:bg-slate-50 hover:border-slate-200'
                     }`}
                >
                   <div className="flex items-center gap-3">
                      {/* Group Icon */}
                      <div className={`w-12 h-12 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                         {group.image ? (
                             <img src={group.image} className="w-full h-full object-cover" alt="Group" />
                         ) : (
                             <Users className="text-slate-400" size={20}/>
                         )}
                      </div>
                      
                      {/* Group Details */}
                      <div className="flex-1 min-w-0">
                         <div className="flex justify-between items-center mb-1">
                            <h4 className={`font-bold text-sm truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{group.name}</h4>
                            {group.privacy === 'private' 
                                ? <Lock size={12} className="text-red-400 flex-shrink-0" title="Private"/> 
                                : <Globe size={12} className="text-green-400 flex-shrink-0" title="Public"/>
                            }
                         </div>
                         <p className="text-xs text-slate-500 line-clamp-1 dark:text-slate-400">{group.description}</p>
                         
                         {!group.isMember && (
                            <span className="text-[10px] font-bold text-brand-primary mt-1 block uppercase tracking-wider">
                                Click to Join
                            </span>
                         )}
                      </div>
                   </div>
                </div>
             ))}
         </div>
       </div>

       {/* RIGHT COLUMN: Chat Window */}
       <div className={`flex-1 flex flex-col bg-slate-50 dark:bg-slate-950/50 ${!activeGroup ? 'hidden md:flex' : 'flex'}`}>
         {activeGroup ? (
             <GroupChatWindow 
                group={activeGroup} 
                user={user} 
                onBack={() => setActiveGroup(null)} 
             />
         ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                    <Users size={40} className="opacity-50"/>
                </div>
                <h3 className="text-lg font-semibold mb-2">Select a group</h3>
                <p className="text-sm max-w-xs text-center opacity-70">
                    Choose a group from the list to start chatting with your community.
                </p>
             </div>
         )}
       </div>

       {/* CREATE MODAL */}
       {showCreateModal && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
             <form onSubmit={handleCreate} className={`p-6 rounded-2xl w-full max-w-md space-y-4 shadow-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white'}`}>
                <div className="flex justify-between items-center">
                    <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>Create New Group</h3>
                </div>
                
                <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Group Name</label>
                    <input 
                       type="text" required 
                       className={`w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-brand-primary/50 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white'}`}
                       value={newName} onChange={e => setNewName(e.target.value)}
                    />
                </div>

                <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Description</label>
                    <textarea 
                       className={`w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-brand-primary/50 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white'}`}
                       rows="3"
                       value={newDesc} onChange={e => setNewDesc(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">Privacy</label>
                        <select 
                           value={newPrivacy} onChange={e => setNewPrivacy(e.target.value)}
                           className={`w-full p-2 border rounded-lg outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white'}`}
                        >
                           <option value="public">Public (Open)</option>
                           <option value="private">Private (Institute)</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">Group Icon</label>
                        <input 
                            type="file" 
                            accept="image/*"
                            onChange={e => setNewImage(e.target.files[0])} 
                            className="w-full text-xs text-slate-500 file:mr-2 file:py-2 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                    </div>
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                   <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Cancel</button>
                   <button type="submit" className="px-6 py-2 bg-brand-primary text-white text-sm font-bold rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/30">Create Group</button>
                </div>
             </form>
         </div>
       )}

    </div>
  );
}