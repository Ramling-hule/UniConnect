"use client";
import React, { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import { Send, Paperclip, ArrowLeft, FileText, Video, Image as ImageIcon } from 'lucide-react';
import { API_BASE_URL } from '@/utils/config';

let socket;

export default function GroupChatWindow({ group, user, onBack }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const scrollRef = useRef();

  useEffect(() => {
     socket = io(`${API_BASE_URL}`);
     socket.emit('join_group', group._id);

     // Load history
     fetch(`${API_BASE_URL}/api/groups/${group._id}/messages`, {
         headers: { Authorization: `Bearer ${user.token}` }
     })
     .then(res => res.json())
     .then(data => setMessages(data));

     // Listen for incoming
     socket.on('receive_group_message', (msg) => {
        setMessages(prev => [...prev, msg]);
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
     });

     return () => socket.disconnect();
  }, [group._id, user.token]);

  const handleSend = async (e) => {
     e.preventDefault();
     if(!text.trim() && !file) return;

     let fileUrl = "";
     let fileType = "none";
     let fileName = "";

     // 1. Upload File logic (Placeholder for now)
     if(file) {
        // Real implementation would upload to backend/Cloudinary here
        alert("File upload logic needs to be connected to a backend endpoint. Sending text only for now.");
        fileType = file.type.split('/')[0]; 
        if(file.type.includes('pdf')) fileType = 'pdf';
        fileName = file.name;
     }

     // 2. Emit Socket Message
     socket.emit('send_group_message', {
        senderId: user._id,
        groupId: group._id,
        text,
        fileUrl, 
        fileType,
        fileName
     });

     setText("");
     setFile(null);
  };

  const copyInvite = () => {
     const link = `${window.location.origin}/join/${group.inviteCode}`;
     navigator.clipboard.writeText(link);
     alert("Invite link copied!");
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
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
                <p className="text-xs text-slate-500">{group.members.length} members</p>
             </div>
          </div>
          <button onClick={copyInvite} className="text-xs bg-slate-200 dark:bg-slate-800 px-3 py-1 rounded-full dark:text-white hover:bg-slate-300 transition">
             Invite
          </button>
       </div>

       {/* Messages */}
       <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => {
             const isMe = msg.sender._id === user._id;
             return (
                <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                   
                   {/* SENDER AVATAR (Fixed Logic) */}
                   {!isMe && (
                      <div className="w-8 h-8 rounded-full bg-slate-200 mr-2 overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {msg.sender.profilePicture ? (
                              <img 
                                src={msg.sender.profilePicture} 
                                className="w-full h-full object-cover"
                                alt={msg.sender.name}
                              />
                          ) : (
                              <span className="text-xs font-bold text-slate-500">
                                {msg.sender.name?.[0] || "?"}
                              </span>
                          )}
                      </div>
                   )}

                   <div className={`max-w-[70%] p-3 rounded-2xl ${
                      isMe ? 'bg-brand-primary text-white rounded-tr-none' : 'bg-slate-100 dark:bg-slate-800 dark:text-slate-200 rounded-tl-none'
                   }`}>
                      {!isMe && <p className="text-xs font-bold opacity-70 mb-1">{msg.sender.name}</p>}
                      {msg.text && <p>{msg.text}</p>}
                      
                      {/* File Rendering Logic */}
                      {msg.fileType === 'image' && <img src={msg.fileUrl} className="mt-2 rounded-lg max-h-60" alt="attachment" />}
                      {msg.fileType === 'video' && <video src={msg.fileUrl} controls className="mt-2 rounded-lg max-h-60"/>}
                      {(msg.fileType === 'pdf' || msg.fileType === 'ppt') && (
                         <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 mt-2 bg-black/10 p-2 rounded">
                            <FileText size={16}/> <span className="text-sm underline">{msg.fileName || "Download File"}</span>
                         </a>
                      )}
                      
                      <p className="text-[10px] opacity-50 mt-1 text-right">
                         {new Date(msg.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                      </p>
                   </div>
                </div>
             );
          })}
          <div ref={scrollRef}/>
       </div>

       {/* Input */}
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
          <button type="submit" className="p-3 bg-brand-primary text-white rounded-full hover:bg-blue-700 transition shadow-md shadow-blue-500/20">
             <Send size={20}/>
          </button>
       </form>
    </div>
  );
}