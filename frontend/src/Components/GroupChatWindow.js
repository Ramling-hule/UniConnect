"use client";
import React, { useEffect, useState, useRef, useMemo } from 'react';
import io from 'socket.io-client';
import { 
  Send, Paperclip, ArrowLeft, FileText, 
  Check, X, Copy, Users, UserPlus 
} from 'lucide-react';
import { API_BASE_URL } from '@/utils/config';
import { toast } from 'react-hot-toast';

let socket;

export default function GroupChatWindow({ group: initialGroup, user, onBack }) {
  const [group, setGroup] = useState(initialGroup);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [joinRequests, setJoinRequests] = useState([]);
  const scrollRef = useRef();

  // FIX: Robust Admin Check
  const isAdmin = useMemo(() => {
    if (!group?.admins || !user) return false;
    const myId = user.id || user._id;
    return group.admins.some(admin => {
        const adminId = typeof admin === 'object' ? admin._id : admin;
        return adminId?.toString() === myId?.toString();
    });
  }, [group.admins, user]);

  useEffect(() => {
    setGroup(initialGroup);
  }, [initialGroup]);

  // Refresh Group Details (to get accurate member/request counts)
  useEffect(() => {
    const fetchLatestGroupDetails = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/groups/${group._id}`, {
                headers: { Authorization: `Bearer ${user.token}` }
            });
            const data = await res.json();
            if (data && data._id) {
                setGroup(prev => ({ ...prev, ...data }));
                if(data.joinRequests) setJoinRequests(data.joinRequests); 
            }
        } catch (error) {
            console.error("Failed to refresh group info", error);
        }
    };
    fetchLatestGroupDetails();
  }, [group._id, user.token]);

  useEffect(() => {
     socket = io(`${API_BASE_URL}`);
     socket.emit('join_group', group._id);

     fetch(`${API_BASE_URL}/api/groups/${group._id}/messages`, {
         headers: { Authorization: `Bearer ${user.token}` }
     })
     .then(res => res.json())
     .then(data => setMessages(data));

     socket.on('receive_group_message', (msg) => {
        setMessages(prev => [...prev, msg]);
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
     });

     return () => socket.disconnect();
  }, [group._id, user.token]);

  useEffect(() => {
    if (showInviteModal && isAdmin) {
        fetchRequests();
    }
  }, [showInviteModal, isAdmin]);


  const fetchRequests = async () => {
    try {
        const res = await fetch(`${API_BASE_URL}/api/groups/${group._id}/requests`, {
            headers: { Authorization: `Bearer ${user.token}` }
        });
        const data = await res.json();
        setJoinRequests(data);
    } catch (error) {
        console.error("Failed to fetch requests", error);
    }
  };


  const handleRequestAction = async (requesterId, action) => {
      try {
          const res = await fetch(`${API_BASE_URL}/api/groups/handle-request`, {
              method: 'POST',
              headers: { 
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${user.token}` 
              },
              body: JSON.stringify({ 
                  groupId: group._id, 
                  requesterId, 
                  action 
              })
          });

          if (res.ok) {
              setJoinRequests(prev => prev.filter(req => req._id !== requesterId));
              if (action === 'accept') {
                  setGroup(prev => ({
                      ...prev,
                      members: [...prev.members, requesterId],
                      joinRequests: prev.joinRequests.filter(id => id !== requesterId)
                  }));
                  toast.success("User added to group!");
              } else {
                  toast.success("Request rejected.");
              }
          }
      } catch (error) {
          console.error("Action failed", error);
          toast.error("Failed to process request");
      }
  };

  const handleSend = async (e) => {
     e.preventDefault();
     if(!text.trim() && !file) return;

     let fileUrl = "";
     let fileType = "none";
     let fileName = "";

     if(file) {
        fileType = file.type.split('/')[0]; 
        fileName = file.name;
     }

     socket.emit('send_group_message', {
        senderId: user.id || user._id, 
        groupId: group._id,
        text,
        fileUrl, 
        fileType,
        fileName
     });

     setText("");
     setFile(null);
  };

  const copyInviteLink = () => {
     const link = `${window.location.origin}/join/${group._id}`;
     navigator.clipboard.writeText(link);
     toast.success("Invite link copied to clipboard!");
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 relative">
       {/* Header */}
       <div className="p-4 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center gap-3">
             <button onClick={onBack} className="md:hidden p-2"><ArrowLeft/></button>
             <div className="w-10 h-10 rounded-full bg-slate-300 overflow-hidden flex items-center justify-center">
                {group.image ? (
                    <img src={group.image} className="w-full h-full object-cover" alt="Group Icon" />
                ) : (
                    <span className="text-slate-500 font-bold">{group.name?.[0]}</span>
                )}
             </div>
             <div>
                <h3 className="font-bold dark:text-white">{group.name}</h3>
                <p className="text-xs text-slate-500">{group.members?.length || 0} members</p>
             </div>
          </div>
          
          <button 
            onClick={() => setShowInviteModal(true)} 
            className="flex items-center gap-2 text-xs bg-slate-200 dark:bg-slate-800 px-3 py-2 rounded-full dark:text-white hover:bg-slate-300 transition"
          >
             <UserPlus size={14}/>
             {isAdmin && group.joinRequests?.length > 0 ? (
                 <span>Requests ({group.joinRequests.length})</span>
             ) : (
                 <span>Invite</span>
             )}
          </button>
       </div>

       {/* Messages Area */}
       <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {messages.map((msg, i) => {
             // =========================================================
             // 1. ROBUST COMPARISON LOGIC
             // =========================================================
             const msgSenderId = typeof msg.sender === 'object' ? msg.sender._id : msg.sender;
             const myId = user.id || user._id; // Handle both id formats
             
             // Convert both to strings for safe comparison
             const isMe = msgSenderId?.toString() === myId?.toString();

             // Fallback for sender name/pic if msg.sender is not populated
             const senderName = typeof msg.sender === 'object' ? msg.sender.name : "Unknown";
             const senderPic = typeof msg.sender === 'object' ? msg.sender.profilePicture : null;

             return (
                <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                   
                   {/* Left Side: Avatar (Only for others) */}
                   {!isMe && (
                      <div className="w-8 h-8 rounded-full bg-slate-200 mr-2 overflow-hidden flex-shrink-0">
                          {senderPic ? (
                              <img src={senderPic} className="w-full h-full object-cover" alt="avatar" />
                          ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-500">
                                  {senderName?.[0]}
                              </div>
                          )}
                      </div>
                   )}

                   {/* Message Bubble */}
                   <div className={`max-w-[70%] p-3 rounded-2xl ${
                      isMe 
                        ? 'bg-brand-primary text-white rounded-tr-none' // Right (Me)
                        : 'bg-slate-100 dark:bg-slate-800 dark:text-slate-200 rounded-tl-none' // Left (Others)
                   }`}>
                      {/* Name (Only for others) */}
                      {!isMe && <p className="text-xs font-bold opacity-70 mb-1">{senderName}</p>}
                      
                      {msg.text && <p>{msg.text}</p>}
                      
                      <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-100' : 'opacity-50'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                      </p>
                   </div>
                </div>
             );
          })}
          <div ref={scrollRef}/>
       </div>

       {/* Input Area */}
       <form onSubmit={handleSend} className="p-4 border-t dark:border-slate-800 flex items-center gap-2">
          <label className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full cursor-pointer transition">
             <Paperclip size={20}/>
             <input type="file" className="hidden" onChange={e => setFile(e.target.files[0])}/>
          </label>
          {file && <span className="text-xs bg-slate-100 px-2 py-1 rounded">{file.name}</span>}
          
          <input 
             value={text} onChange={e => setText(e.target.value)}
             placeholder="Type a message..."
             className="flex-1 bg-slate-100 dark:bg-slate-800 p-3 rounded-full outline-none dark:text-white"
          />
          <button type="submit" className="p-3 bg-brand-primary text-white rounded-full hover:bg-blue-700 transition">
             <Send size={20}/>
          </button>
       </form>

       {/* ================= MODAL ================= */}
       {showInviteModal && (
        <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-4 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
                    <h3 className="font-bold dark:text-white">Manage Group</h3>
                    <button onClick={() => setShowInviteModal(false)} className="p-1 hover:bg-slate-200 rounded-full">
                        <X size={20} className="text-slate-500"/>
                    </button>
                </div>

                <div className="p-4 space-y-6">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Invite Link</label>
                        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-2 rounded-lg">
                            <code className="text-sm flex-1 truncate text-slate-600 dark:text-slate-300">
                                {window.location.origin}/join/{group._id}
                            </code>
                            <button onClick={copyInviteLink} className="p-2 bg-white dark:bg-slate-700 rounded-md shadow-sm hover:text-brand-primary">
                                <Copy size={16}/>
                            </button>
                        </div>
                    </div>

                    {isAdmin && (
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                                    <Users size={14}/> Pending Requests
                                </label>
                                <span className="bg-brand-primary text-white text-[10px] px-2 py-0.5 rounded-full">
                                    {joinRequests.length}
                                </span>
                            </div>

                            <div className="space-y-3 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                                {joinRequests.length === 0 ? (
                                    <div className="text-center py-6 text-slate-400 text-sm border-2 border-dashed rounded-xl">
                                        No pending requests
                                    </div>
                                ) : (
                                    joinRequests.map(req => (
                                        <div key={req._id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 border dark:border-slate-800">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                                                    {req.profilePicture ? (
                                                        <img src={req.profilePicture} className="w-full h-full object-cover" alt={req.name} />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center font-bold text-slate-500">
                                                            {req.name?.[0]}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-sm dark:text-white">{req.name}</h4>
                                                    <p className="text-[10px] text-slate-500">{req.instituteName || "Student"}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleRequestAction(req._id, 'reject')} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition"><X size={18}/></button>
                                                <button onClick={() => handleRequestAction(req._id, 'accept')} className="p-2 text-green-500 hover:bg-green-50 rounded-full transition"><Check size={18}/></button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
       )}
    </div>
  );
}