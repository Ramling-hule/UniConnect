'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, ArrowLeft, Pencil, Hash } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function CollabLobby() {
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
    if (!username) return toast.error('Please enter your name!');
    const code = generateRoomCode();
    router.push(`/copilot/${code}?name=${username}`);
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (!username) return toast.error('Please enter your name!');
    if (!joinCode) return toast.error('Please enter a session code!');
    router.push(`/copilot/${joinCode.toUpperCase()}?name=${username}`);
  };

  return (
    <div className="flex h-screen justify-center items-center bg-brand-dark text-white font-sans p-4">
      <div className="w-full max-w-md">

        {/* Back link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-xl shadow-purple-500/30">
            <Users size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Collab Studio</h1>
            <p className="text-slate-400 text-sm">Shared whiteboard for teams</p>
          </div>
        </div>

        {/* Info banner */}
        <div className="mt-4 mb-6 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-3">
          <Pencil size={15} className="text-blue-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-300 leading-relaxed">
            Start a shared whiteboard session and invite teammates with a 6-digit code.
            For AI assistance, use the <span className="font-semibold text-blue-200">✨ AI Copilot</span> button on any dashboard page.
          </p>
        </div>

        <div className="bg-brand-dark-card p-6 rounded-2xl border border-brand-dark-border shadow-2xl">

          {/* Name Input */}
          <div className="mb-5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Your Display Name
            </label>
            <input
              className="w-full p-3 rounded-xl bg-brand-dark text-white border border-brand-dark-border focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 outline-none transition-all placeholder-slate-600"
              placeholder="Ex: John Doe"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleCreate}
              disabled={!username}
              className="w-full py-3.5 rounded-xl font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                boxShadow: '0 6px 20px rgba(124,58,237,0.35)',
                color: 'white',
              }}
            >
              Create New Session
            </button>

            <div className="flex items-center gap-2 text-slate-600 text-xs font-medium">
              <div className="h-px bg-brand-dark-border flex-1" />
              OR JOIN EXISTING
              <div className="h-px bg-brand-dark-border flex-1" />
            </div>

            <form onSubmit={handleJoin} className="flex gap-2">
              <div className="relative flex-1">
                <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  className="w-full p-3 pl-8 rounded-xl bg-brand-dark border border-brand-dark-border uppercase tracking-[0.3em] text-center font-mono text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 outline-none transition-all placeholder-slate-600"
                  placeholder="CODE"
                  maxLength={6}
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={!username || !joinCode}
                className="px-5 bg-violet-600 hover:bg-violet-500 rounded-xl font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 shadow-md shadow-violet-500/20"
              >
                Join
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}