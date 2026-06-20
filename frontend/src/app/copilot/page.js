'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RoomLobby() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState('');
  const [username, setUsername] = useState('');

  const generateRoomCode = () => {
    const chars = 'ABCDEF0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
  };

  const handleCreate = () => {
    if (!username) return alert("Please enter your name!");
    const code = generateRoomCode();
    router.push(`/copilot/${code}?name=${username}`);
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (!username) return alert("Please enter your name!");
    if (!joinCode) return alert("Please enter a session code!");
    router.push(`/copilot/${joinCode.toUpperCase()}?name=${username}`);
  };

  return (
    <div className="flex h-screen justify-center items-center bg-brand-dark text-white font-sans">
      <div className="w-full max-w-md bg-brand-dark-card p-8 rounded-2xl border border-brand-dark-border shadow-2xl">
        <h1 className="text-3xl font-bold text-brand-primary mb-2 text-center">AI Copilot</h1>
        <p className="text-slate-400 text-center mb-6">Enter your name to start a session</p>

        {/* Name Input */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Your Name</label>
          <input
            className="w-full p-3 rounded-xl bg-brand-dark text-white border border-brand-dark-border focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all"
            placeholder="Ex: John Doe"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-4">
          <button 
            onClick={handleCreate}
            className="w-full py-3.5 bg-brand-primary hover:bg-brand-primary-hover rounded-xl font-bold transition-all disabled:opacity-50 shadow-lg shadow-brand-primary/20"
            disabled={!username}
          >
            Start New Session
          </button>
          
          <div className="flex items-center gap-2 text-slate-500">
            <div className="h-px bg-brand-dark-border flex-1"></div> OR <div className="h-px bg-brand-dark-border flex-1"></div>
          </div>

          <form onSubmit={handleJoin} className="flex gap-2">
            <input 
              className="flex-1 p-3 rounded-xl bg-brand-dark border border-brand-dark-border uppercase tracking-widest text-center font-mono focus:border-brand-primary outline-none transition-all"
              placeholder="CODE"
              maxLength={6}
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
            />
            <button 
              type="submit" 
              className="px-6 bg-brand-primary hover:bg-brand-primary-hover rounded-xl font-bold disabled:opacity-50 transition-all shadow-lg shadow-brand-primary/20"
              disabled={!username || !joinCode}
            >
              Join
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}