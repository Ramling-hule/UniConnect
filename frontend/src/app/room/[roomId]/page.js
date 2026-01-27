'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { FaCopy, FaArrowLeft, FaCode, FaPaintBrush } from 'react-icons/fa';
import Editor from '@monaco-editor/react';
import { Tldraw } from 'tldraw'; 
import 'tldraw/tldraw.css'; 

// Yjs Imports
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';
import { io } from "socket.io-client"; 

let socket; 

const CollaborationRoom = () => {
  const { roomId } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const username = searchParams.get('name') || "Guest";

  const [activeTab, setActiveTab] = useState('code'); 
  const [participants, setParticipants] = useState([]); 
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [isConnected, setIsConnected] = useState(false);
  const [yjsConnected, setYjsConnected] = useState(false);

  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const providerRef = useRef(null); 
  const docRef = useRef(null);      
  const bindingRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // --- 1. SOCKET.IO (Chat/User List) ---
  useEffect(() => {
    socket = io("http://localhost:5000", {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    socket.on("connect", () => {
      console.log("✅ Socket.IO connected");
      setIsConnected(true);
      socket.emit("join-room", { roomId, username });
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket.IO disconnected");
      setIsConnected(false);
    });
    
    socket.on("user-list-update", (users) => {
      console.log("👥 Participants updated:", users);
      setParticipants(users);
    });
    
    socket.on("remote-typing", (user) => {
      // Don't show typing indicator for your own typing
      if (user === username) {
        return;
      }
      
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        newSet.add(user);
        return newSet;
      });
      
      setTimeout(() => {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(user);
          return newSet;
        });
      }, 2000);
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [roomId, username]);

  // --- 2. YJS (Code Sync) - Initialize when editor is ready ---
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) {
      console.log("⏳ Waiting for editor to mount...");
      return;
    }

    console.log("🔧 Initializing Yjs for room:", roomId);

    // A. Init Document
    const doc = new Y.Doc();
    docRef.current = doc;

    // B. Connect to Backend - CORRECT URL FORMAT
    const provider = new WebsocketProvider(
      'ws://localhost:5000',
      roomId,
      doc,
      {
        connect: true
      }
    );
    providerRef.current = provider;

    // C. Connection Event Handlers
    provider.on('status', ({ status }) => {
      console.log("⚡ Yjs Status:", status);
      setYjsConnected(status === 'connected');
    });

    provider.on('sync', (isSynced) => {
      console.log("🔄 Yjs Synced:", isSynced);
    });

    // D. Wait for provider to connect before binding
    const connectHandler = () => {
      console.log("🔗 Provider connected, creating binding...");
      
      const yText = doc.getText('monaco');
      
      // Create Monaco binding
      const binding = new MonacoBinding(
        yText,
        editorRef.current.getModel(),
        new Set([editorRef.current]),
        provider.awareness
      );
      bindingRef.current = binding;
      
      // Listen to awareness changes to detect remote users typing
      provider.awareness.on('change', ({ added, updated, removed }) => {
        const states = provider.awareness.getStates();
        states.forEach((state, clientId) => {
          // Check if this is a remote user (not local)
          if (clientId !== provider.awareness.clientID && state.user) {
            // This ensures we can differentiate between local and remote changes
          }
        });
      });
      
      console.log("✅ Monaco binding created");
    };

    if (provider.wsconnected) {
      connectHandler();
    } else {
      provider.on('status', ({ status }) => {
        if (status === 'connected' && !bindingRef.current) {
          connectHandler();
        }
      });
    }

    // E. Set User Awareness with color
    const userColor = `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`;
    provider.awareness.setLocalStateField('user', {
      name: username,
      color: userColor
    });

    // CLEANUP FUNCTION
    return () => {
      console.log("🧹 Cleaning up Yjs connection");
      
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }
      
      if (providerRef.current) {
        providerRef.current.disconnect();
        providerRef.current.destroy();
        providerRef.current = null;
      }
      
      if (docRef.current) {
        docRef.current.destroy();
        docRef.current = null;
      }
    };
  }, [roomId, username, editorRef.current, monacoRef.current]);

  const handleEditorDidMount = (editor, monaco) => {
    console.log("📝 Editor mounted");
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Add typing indicator on content change
    editor.onDidChangeModelContent((e) => {
      // Ignore system changes
      if (e.isFlush || e.isRedoing || e.isUndoing) {
        return;
      }

      // Check if changes exist
      if (!e.changes || e.changes.length === 0) {
        return;
      }
      
      if (socket && socket.connected) {
        // Clear existing timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        
        // Emit typing event (will be filtered on receive end)
        socket.emit("typing", { roomId, username });
        
        // Stop typing after 1 second of inactivity
        typingTimeoutRef.current = setTimeout(() => {
          // Typing stopped
        }, 1000);
      }
    });
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    alert("Room ID copied to clipboard!");
  };

  const typingUsersArray = Array.from(typingUsers);

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-gray-200 font-sans overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-72 bg-slate-900/80 backdrop-blur-xl border-r border-purple-500/20 flex flex-col shadow-2xl z-10">
        <div className="p-5 border-b border-purple-500/20">
          <button 
            onClick={() => router.push('/room')} 
            className="flex items-center gap-2 text-xs text-gray-400 hover:text-purple-400 mb-4 transition-colors"
          >
            <FaArrowLeft /> Exit Session
          </button>
          
          <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 tracking-tight">
            UniConnect
          </h3>
          
          {/* Connection Status Indicators */}
          <div className="space-y-2 mt-4">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className={`text-xs font-medium ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                Socket.IO: {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${yjsConnected ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
              <span className={`text-xs font-medium ${yjsConnected ? 'text-green-400' : 'text-yellow-400'}`}>
                Live Sync: {yjsConnected ? 'Active' : 'Connecting...'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between bg-black/40 p-3 mt-4 rounded-lg border border-purple-500/30 backdrop-blur-sm">
            <span className="font-mono text-purple-400 text-sm font-bold truncate">{roomId}</span>
            <FaCopy 
              onClick={copyRoomId} 
              className="cursor-pointer hover:text-purple-300 text-gray-400 transition-colors flex-shrink-0 ml-2"
              title="Copy Room ID"
            />
          </div>
        </div>

        {/* Participants List */}
        <div className="flex-1 p-5 overflow-y-auto">
          <h4 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider flex items-center justify-between">
            <span>Participants</span>
            <span className="bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full text-xs">
              {participants.length}
            </span>
          </h4>
          {participants.length === 0 ? (
            <p className="text-sm text-gray-500 italic">Waiting for others...</p>
          ) : (
            participants.map((p) => (
              <div 
                key={p.id} 
                className="text-sm p-3 bg-slate-800/50 backdrop-blur-sm mb-2 rounded-lg hover:bg-slate-700/50 transition-all border border-purple-500/10"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full shadow-lg animate-pulse flex-shrink-0" 
                    style={{ 
                      backgroundColor: p.color || '#888',
                      boxShadow: `0 0 10px ${p.color || '#888'}`
                    }}
                  />
                  <span className="font-medium flex-1">{p.name}</span>
                </div>
                {typingUsersArray.includes(p.name) && (
                  <div className="flex items-center gap-2 mt-2 ml-6">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                    <span className="text-xs text-purple-400 italic">
                      typing...
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </aside>

      {/* MAIN AREA */}
      <main className="flex-1 flex flex-col bg-slate-900/50 backdrop-blur-xl relative">
        <header className="h-16 bg-slate-900/80 backdrop-blur-xl border-b border-purple-500/20 flex items-center justify-between px-6 shadow-lg">
          {/* Tab Navigation */}
          <div className="flex gap-2">
            <button 
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all font-medium ${
                activeTab === 'code' 
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50' 
                  : 'bg-slate-800/50 text-gray-400 hover:bg-slate-700/50 hover:text-white'
              }`}
            >
              <FaCode /> Code Editor
            </button>
            <button 
              onClick={() => setActiveTab('whiteboard')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg transition-all font-medium ${
                activeTab === 'whiteboard' 
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/50' 
                  : 'bg-slate-800/50 text-gray-400 hover:bg-slate-700/50 hover:text-white'
              }`}
            >
              <FaPaintBrush /> Whiteboard
            </button>
          </div>

          {/* Empty space - removed typing indicator from here */}
          <div></div>
        </header>

        {/* Content Area */}
        <div className="flex-1 relative">
          {/* Code Editor Tab */}
          <div 
            className={`h-full ${activeTab === 'code' ? 'block' : 'hidden'}`}
          >
            <Editor
              height="100%"
              defaultLanguage="javascript"
              defaultValue="// Start collaborating! Your changes will appear in real-time for all participants.\n\n"
              theme="vs-dark"
              onMount={handleEditorDidMount}
              options={{ 
                minimap: { enabled: true },
                fontSize: 14,
                lineNumbers: 'on',
                roundedSelection: true,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                cursorBlinking: 'smooth',
                cursorSmoothCaretAnimation: 'on',
                smoothScrolling: true,
                fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
                fontLigatures: true,
                renderWhitespace: 'selection',
                bracketPairColorization: {
                  enabled: true
                }
              }}
            />
          </div>

          {/* Whiteboard Tab */}
          <div className={`h-full w-full ${activeTab === 'whiteboard' ? 'block' : 'hidden'}`}>
            {activeTab === 'whiteboard' && <Tldraw />}
          </div>
        </div>

        {/* Status Footer */}
        {activeTab === 'code' && (
          <div className="h-8 bg-slate-900/80 backdrop-blur-xl border-t border-purple-500/20 flex items-center justify-between px-4 text-xs">
            <div className="flex items-center gap-4">
              <span className="text-gray-400">
                Room: <span className="text-purple-400 font-mono">{roomId}</span>
              </span>
              <span className="text-gray-400">
                Language: <span className="text-green-400">JavaScript</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              {yjsConnected ? (
                <span className="text-green-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                  Live Sync Active
                </span>
              ) : (
                <span className="text-yellow-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></span>
                  Connecting to sync...
                </span>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CollaborationRoom;