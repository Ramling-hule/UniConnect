"use client";
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Users, Plus, Lock, Globe } from 'lucide-react';
import GroupChatWindow from '@/Components/GroupChatWindow'; // Ensure this component exists

export default function GroupsPage() {
  const { user } = useSelector((state) => state.auth);
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
         const res = await fetch('http://localhost:5000/api/groups', {
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
         await fetch('http://localhost:5000/api/groups', {
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
          await fetch('http://localhost:5000/api/groups/join', {
             method: 'POST',
             headers: { 
                "Content-Type": "application/json",
                Authorization: `Bearer ${user.token}` 
             },
             body: JSON.stringify({ groupId })
          });
          fetchGroups(); // Refresh to update "isMember" status
      } catch (error) {
          console.error("Failed to join group", error);
      }
  };

  return (
    <div className="flex h-[calc(100vh-80px)] bg-slate-50 dark:bg-slate-950">
       
       {/* LEFT COLUMN: Groups List */}
       <div className={`w-full md:w-1/3 lg:w-1/4 border-r dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col ${activeGroup ? 'hidden md:flex' : 'flex'}`}>
          
          {/* Header */}
          <div className="p-4 border-b dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 sticky top-0 z-10">
             <h2 className="font-bold text-xl dark:text-white">Groups</h2>
             <button 
                onClick={() => setShowCreateModal(true)} 
                className="p-2 bg-brand-primary text-white rounded-full hover:bg-blue-700 transition"
                title="Create Group"
             >
                <Plus size={20} />
             </button>
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1 p-3 space-y-3 custom-scrollbar">
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
                        ? 'border-brand-primary bg-blue-50 dark:bg-slate-800' 
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                     }`}
                >
                   <div className="flex items-center gap-3">
                      {/* Group Icon */}
                      <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex-shrink-0">
                         {group.image ? (
                             <img src={group.image} className="w-full h-full object-cover" alt="Group" />
                         ) : (
                             <div className="w-full h-full flex items-center justify-center">
                                <Users className="text-slate-500" size={20}/>
                             </div>
                         )}
                      </div>
                      
                      {/* Group Details */}
                      <div className="flex-1 min-w-0">
                         <div className="flex justify-between items-center mb-1">
                            <h4 className="font-bold text-sm truncate dark:text-white">{group.name}</h4>
                            {group.privacy === 'private' 
                                ? <Lock size={12} className="text-red-400 flex-shrink-0" title="Private (Institute only)"/> 
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
       <div className={`flex-1 flex flex-col ${!activeGroup ? 'hidden md:flex' : 'flex'}`}>
          {activeGroup ? (
             <GroupChatWindow 
                group={activeGroup} 
                user={user} 
                onBack={() => setActiveGroup(null)} 
             />
          ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50 dark:bg-slate-950">
                <Users size={48} className="mb-4 opacity-20"/>
                <p>Select a group to start chatting</p>
             </div>
          )}
       </div>

       {/* CREATE MODAL */}
       {showCreateModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
             <form onSubmit={handleCreate} className="bg-white dark:bg-slate-900 p-6 rounded-2xl w-full max-w-md space-y-4 shadow-xl border dark:border-slate-800">
                <h3 className="font-bold text-lg dark:text-white">Create New Group</h3>
                
                <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Group Name</label>
                    <input 
                       type="text" required 
                       className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-brand-primary/50 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                       value={newName} onChange={e => setNewName(e.target.value)}
                    />
                </div>

                <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Description</label>
                    <textarea 
                       className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-brand-primary/50 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                       rows="3"
                       value={newDesc} onChange={e => setNewDesc(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">Privacy</label>
                        <select 
                           value={newPrivacy} onChange={e => setNewPrivacy(e.target.value)}
                           className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white"
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
                            className="w-full text-xs text-slate-500 dark:text-slate-400 file:mr-2 file:py-2 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                    </div>
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                   <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Cancel</button>
                   <button type="submit" className="px-6 py-2 bg-brand-primary text-white text-sm font-bold rounded-lg hover:bg-blue-700">Create Group</button>
                </div>
             </form>
          </div>
       )}

    </div>
  );
}