'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { FaCopy, FaArrowLeft, FaRobot, FaPaintBrush, FaPaperPlane, FaSpinner } from 'react-icons/fa';
import { Tldraw } from 'tldraw'; 
import 'tldraw/tldraw.css'; 
import { API_BASE_URL } from '@/utils/config';
import { useSelector } from 'react-redux';
import { io } from "socket.io-client"; 
import apiClient from '@/services/apiClient';
import toast from 'react-hot-toast';

let socket; 

const CopilotSession = () => {
  const { sessionId } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const username = searchParams.get('name') || "Guest";
  
  const { user } = useSelector((state) => state.auth) || {};

  const [activeTab, setActiveTab] = useState('copilot'); 
  const [participants, setParticipants] = useState([]); 
  const [isConnected, setIsConnected] = useState(false);
  
  // AI Copilot State
  const [messages, setMessages] = useState([{ role: 'assistant', content: 'Hi there! I am your AI Career Copilot. Ask me about careers, college life, or professional guidance!' }]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // --- 1. SOCKET.IO (Chat/User List) ---
  useEffect(() => {
    const serverUrl = API_BASE_URL;
    socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
    });

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("join-room", { roomId: sessionId, username });
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });
    
    socket.on("user-list-update", (users) => {
      setParticipants(users);
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [sessionId, username]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !user?.token) return;

    const userMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const { data } = await apiClient.post('/api/career/chat', { query: userMessage.content });
      if (data.success) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.text }]);
      } else {
        setMessages((prev) => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting to my knowledge base right now." }]);
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { role: 'assistant', content: "An error occurred while fetching my response." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const copySessionId = () => {
    navigator.clipboard.writeText(sessionId);
    toast.success("Session ID copied to clipboard!");
  };

  return (
    <div className="flex h-screen bg-brand-dark text-slate-200 font-sans overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-72 bg-brand-dark-card/80 backdrop-blur-xl border-r border-brand-dark-border flex flex-col shadow-2xl z-10">
        <div className="p-5 border-b border-brand-dark-border">
          <button 
            onClick={() => router.push('/copilot')} 
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-brand-primary mb-4 transition-colors"
          >
            <FaArrowLeft /> Exit Session
          </button>
          
          <h3 className="text-2xl font-bold text-brand-primary tracking-tight">
            ProConnect
          </h3>
          
          {/* Connection Status Indicators */}
          <div className="space-y-2 mt-4">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className={`text-xs font-medium ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                Session: {isConnected ? 'Active' : 'Reconnecting...'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between bg-black/40 p-3 mt-4 rounded-lg border border-brand-dark-border backdrop-blur-sm">
            <span className="font-mono text-brand-primary text-sm font-bold truncate">{sessionId}</span>
            <FaCopy 
              onClick={copySessionId} 
              className="cursor-pointer hover:text-brand-primary text-slate-400 transition-colors flex-shrink-0 ml-2"
              title="Copy Session ID"
            />
          </div>
        </div>

        {/* Participants List */}
        <div className="flex-1 p-5 overflow-y-auto">
          <h4 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider flex items-center justify-between">
            <span>Participants</span>
            <span className="bg-brand-primary/20 text-brand-primary px-2 py-0.5 rounded-full text-xs">
              {participants.length}
            </span>
          </h4>
          {participants.length === 0 ? (
            <p className="text-sm text-gray-500 italic">Waiting for others...</p>
          ) : (
            participants.map((p) => (
              <div 
                key={p.id} 
                className="text-sm p-3 bg-brand-dark-card/50 backdrop-blur-sm mb-2 rounded-lg border border-brand-dark-border flex items-center gap-3"
              >
                <div 
                  className="w-3 h-3 rounded-full shadow-lg flex-shrink-0" 
                  style={{ backgroundColor: p.color || '#888', boxShadow: `0 0 10px ${p.color || '#888'}` }}
                />
                <span className="font-medium flex-1">{p.name}</span>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* MAIN AREA */}
      <main className="flex-1 flex flex-col bg-brand-dark/50 backdrop-blur-xl relative">
        <header className="h-16 bg-brand-dark-card/80 backdrop-blur-xl border-b border-brand-dark-border flex items-center justify-between px-6 shadow-lg">
          {/* Tab Navigation */}
          <div className="flex gap-2">
            <button 
              onClick={() => setActiveTab('copilot')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all font-medium ${
                activeTab === 'copilot' 
                  ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/50' 
                  : 'bg-brand-dark-border/50 text-slate-400 hover:bg-brand-dark-border hover:text-white'
              }`}
            >
              <FaRobot /> AI Copilot
            </button>
            <button 
              onClick={() => setActiveTab('whiteboard')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all font-medium ${
                activeTab === 'whiteboard' 
                  ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/50' 
                  : 'bg-brand-dark-border/50 text-slate-400 hover:bg-brand-dark-border hover:text-white'
              }`}
            >
              <FaPaintBrush /> Whiteboard
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 relative overflow-hidden flex flex-col">
          
          {/* AI Copilot Tab */}
          {activeTab === 'copilot' && (
            <div className="flex-1 flex flex-col h-full max-w-4xl mx-auto w-full p-4">
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto space-y-6 p-4 rounded-xl bg-brand-dark-card/40 border border-brand-dark-border scrollbar-thin scrollbar-thumb-brand-dark-border">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ${msg.role === 'user' ? 'bg-brand-primary' : 'bg-brand-dark-card border border-brand-dark-border'}`}>
                      {msg.role === 'user' ? (
                        <span className="font-bold text-xs">{username[0]}</span>
                      ) : (
                        <FaRobot size={14} className="text-brand-primary" />
                      )}
                    </div>
                    <div className={`px-5 py-3.5 rounded-2xl max-w-[80%] text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-brand-primary text-white rounded-tr-none' : 'bg-brand-dark-card/80 text-slate-200 border border-brand-dark-border rounded-tl-none'}`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-brand-dark-card border border-brand-dark-border flex items-center justify-center flex-shrink-0 shadow-lg">
                      <FaRobot size={14} className="text-brand-primary" />
                    </div>
                    <div className="px-5 py-4 rounded-2xl bg-brand-dark-card/80 border border-brand-dark-border rounded-tl-none flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-bounce delay-150"></div>
                      <div className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-bounce delay-300"></div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="mt-4 relative">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about careers, skill roadmaps, or interview prep..."
                  className="w-full bg-brand-dark-card/80 border border-brand-dark-border rounded-xl pl-5 pr-14 py-4 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-transparent transition-all shadow-lg"
                  disabled={isTyping}
                />
                <button 
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="absolute right-2 top-2 bottom-2 aspect-square bg-brand-primary text-white rounded-lg flex items-center justify-center hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isTyping ? <FaSpinner className="animate-spin" /> : <FaPaperPlane size={14} />}
                </button>
              </form>
            </div>
          )}

          {/* Whiteboard Tab */}
          <div className={`h-full w-full ${activeTab === 'whiteboard' ? 'block' : 'hidden'}`}>
            {activeTab === 'whiteboard' && <Tldraw />}
          </div>
        </div>

      </main>
    </div>
  );
};

export default CopilotSession;
