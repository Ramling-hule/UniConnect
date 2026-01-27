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
    // Pass name via Query Param
    router.push(`/room/${code}?name=${username}`);
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (!username) return alert("Please enter your name!");
    if (!joinCode) return alert("Please enter a room code!");
    router.push(`/room/${joinCode.toUpperCase()}?name=${username}`);
  };

  return (
    <div className="flex h-screen justify-center items-center bg-zinc-950 text-white font-sans">
      <div className="w-full max-w-md bg-zinc-900 p-8 rounded-lg border border-zinc-800 shadow-xl">
        <h1 className="text-3xl font-bold text-blue-500 mb-2 text-center">UniConnect</h1>
        <p className="text-zinc-500 text-center mb-6">Enter your name to start coding</p>

        {/* Name Input */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">Your Name</label>
          <input
            className="w-full p-3 rounded bg-zinc-800 text-white border border-zinc-700 focus:border-blue-500 outline-none"
            placeholder="Ex: John Doe"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-4">
          <button 
            onClick={handleCreate}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded font-bold transition-colors disabled:opacity-50"
            disabled={!username}
          >
            Create New Room
          </button>
          
          <div className="flex items-center gap-2 text-zinc-600">
            <div className="h-px bg-zinc-800 flex-1"></div> OR <div className="h-px bg-zinc-800 flex-1"></div>
          </div>

          <form onSubmit={handleJoin} className="flex gap-2">
            <input 
              className="flex-1 p-3 rounded bg-zinc-800 border border-zinc-700 uppercase tracking-widest text-center font-mono"
              placeholder="CODE"
              maxLength={6}
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
            />
            <button 
              type="submit" 
              className="px-6 bg-green-600 hover:bg-green-500 rounded font-bold disabled:opacity-50"
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