"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { X, Send, Minimize2 } from 'lucide-react';
import { closeChat } from '@/redux/features/chatSlice';
import io from 'socket.io-client';
import { API_BASE_URL } from '@/utils/config';

let socket; 

export default function ChatWindow() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { isOpen, activeChatUser } = useSelector((state) => state.chat);
  const { isDark } = useSelector((state) => state.theme);

  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const scrollRef = useRef(null);

  const currentUserId = user?.id || user?._id;
  const otherUserId = activeChatUser?._id || activeChatUser?.id;

  const getRoomId = (id1, id2) => {
    if (!id1 || !id2) return "default_room";
    return [id1, id2].sort().join('_');
  };

  useEffect(() => {
    if (isOpen && currentUserId && otherUserId) {
      socket = io(`${API_BASE_URL}`);
      
      const roomId = getRoomId(currentUserId, otherUserId);
      socket.emit('join_chat', roomId);

      fetch(`${API_BASE_URL}/api/messages/${currentUserId}/${otherUserId}`)
        .then(res => {
            if (!res.ok) throw new Error("Failed to fetch");
            return res.json();
        })
        .then(data => {
            if (Array.isArray(data)) {
                setChatHistory(data);
            } else {
                console.error("API Error: Expected array but got:", data);
                setChatHistory([]); 
            }
        })
        .catch(err => {
            console.error("Fetch error:", err);
            setChatHistory([]); 
        });

      socket.on('receive_message', (newMessage) => {
         setChatHistory((prev) => Array.isArray(prev) ? [...prev, newMessage] : [newMessage]);
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [isOpen, currentUserId, otherUserId]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !currentUserId || !otherUserId) return;

    const roomId = getRoomId(currentUserId, otherUserId);
    const msgData = {
      senderId: currentUserId,
      receiverId: otherUserId,
      text: message,
      room: roomId,
    };

    socket.emit('send_message', msgData);

    setChatHistory((prev) => [
        ...(Array.isArray(prev) ? prev : []),
        { 
            sender: currentUserId, 
            text: message, 
            createdAt: new Date().toISOString() 
        }
    ]);

    setMessage("");
  };

  if (!isOpen || !activeChatUser) return null;

  return (
    <div className={`fixed bottom-12 right-4 w-80 md:w-96 rounded-t-xl shadow-2xl border z-50 flex flex-col ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`} style={{ height: '450px' }}>
      
      {/* Header */}
      <div className="bg-brand-primary text-white p-3 rounded-t-xl flex justify-between items-center cursor-pointer shadow-md">
         <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
               {activeChatUser.name?.[0] || "?"}
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
         {/* FIX 4: Optional Chaining (?.) prevents crash if chatHistory is null/undefined */}
         {chatHistory?.map((msg, index) => {
            const isMe = msg.sender === currentUserId;
            return (
               <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-xl text-sm ${
                      isMe 
                      ? 'bg-brand-primary text-white rounded-br-none' 
                      : isDark ? 'bg-slate-800 text-slate-200 rounded-bl-none' : 'bg-white text-slate-800 border rounded-bl-none'
                  }`}>
                      <p>{msg.text}</p>
                      <span className={`text-[9px] block mt-1 text-right ${isMe ? 'text-blue-100' : 'text-slate-400'}`}>
                         {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
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