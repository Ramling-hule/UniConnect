"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { X, Send, Minimize2 } from 'lucide-react';
import { closeChat } from '@/redux/features/chatSlice';
import io from 'socket.io-client';

let socket; // Initialize outside to prevent re-connections

export default function ChatWindow() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { isOpen, activeChatUser } = useSelector((state) => state.chat);
  const { isDark } = useSelector((state) => state.theme);

  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const scrollRef = useRef(null);

  // Generate a unique Room ID for 2 users (Always consistent: "ID1_ID2" where ID1 < ID2)
  const getRoomId = (id1, id2) => {
    return [id1, id2].sort().join('_');
  };

  // 1. Initialize Socket & Load History
  useEffect(() => {
    if (isOpen && user && activeChatUser) {
      socket = io('http://localhost:5000'); // Connect
      
      const roomId = getRoomId(user._id, activeChatUser._id);
      socket.emit('join_chat', roomId);

      // Fetch Previous Messages from DB
      fetch(`http://localhost:5000/api/messages/${user._id}/${activeChatUser._id}`)
        .then(res => res.json())
        .then(data => setChatHistory(data))
        .catch(err => console.error(err));

      // Listen for incoming messages
      socket.on('receive_message', (newMessage) => {
         setChatHistory((prev) => [...prev, newMessage]);
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [isOpen, user, activeChatUser]);

  // 2. Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const roomId = getRoomId(user._id, activeChatUser._id);
    const msgData = {
      senderId: user._id,
      receiverId: activeChatUser._id,
      text: message,
      room: roomId,
    };

    // Emit to Server
    socket.emit('send_message', msgData);

    // Optimistically update UI (Add to list immediately)
    setChatHistory((prev) => [...prev, { 
       sender: user._id, 
       text: message, 
       createdAt: new Date().toISOString() 
    }]);

    setMessage("");
  };

  if (!isOpen || !activeChatUser) return null;

  return (
    <div className={`fixed bottom-12 right-4 w-80 md:w-96 rounded-t-xl shadow-2xl border z-50 flex flex-col ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`} style={{ height: '450px' }}>
      
      {/* Header */}
      <div className="bg-brand-primary text-white p-3 rounded-t-xl flex justify-between items-center cursor-pointer shadow-md">
         <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
               {activeChatUser.name[0]}
            </div>
            <div>
               <h4 className="font-bold text-sm">{activeChatUser.name}</h4>
               <span className="text-[10px] opacity-80 block leading-none">Online</span>
            </div>
         </div>
         <div className="flex gap-1">
             <button onClick={() => dispatch(closeChat())} className="p-1 hover:bg-white/20 rounded"><Minimize2 size={16} /></button>
             <button onClick={() => dispatch(closeChat())} className="p-1 hover:bg-white/20 rounded"><X size={16} /></button>
         </div>
      </div>

      {/* Messages Body */}
      <div className={`flex-1 overflow-y-auto p-4 space-y-3 ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
         {chatHistory.map((msg, index) => {
            const isMe = msg.sender === user._id;
            return (
               <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-xl text-sm ${
                      isMe 
                      ? 'bg-brand-primary text-white rounded-br-none' 
                      : isDark ? 'bg-slate-800 text-slate-200 rounded-bl-none' : 'bg-white text-slate-800 border rounded-bl-none'
                  }`}>
                      <p>{msg.text}</p>
                      <span className={`text-[9px] block mt-1 text-right ${isMe ? 'text-blue-100' : 'text-slate-400'}`}>
                         {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                  </div>
               </div>
            );
         })}
         <div ref={scrollRef} />
      </div>

      {/* Input Footer */}
      <form onSubmit={handleSendMessage} className={`p-3 border-t flex gap-2 ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-white'}`}>
         <input 
            type="text" 
            placeholder="Type a message..." 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className={`flex-1 bg-transparent outline-none text-sm px-2 ${isDark ? 'text-white' : 'text-slate-900'}`}
         />
         <button type="submit" className="p-2 bg-brand-primary text-white rounded-full hover:opacity-90 transition-transform active:scale-95">
            <Send size={18} />
         </button>
      </form>

    </div>
  );
}