"use client";
import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { io } from "socket.io-client";

const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:6001";

export default function PodChat({ podId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const { user } = useSelector((state) => state.auth);
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io(NEXT_PUBLIC_API_URL);
    socketRef.current.emit("join_pod", podId);

    socketRef.current.on("receive_pod_message", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [podId]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || !user) return;
    
    const msgData = {
      senderId: user._id,
      podId,
      content: input,
    };
    
    socketRef.current.emit("send_pod_message", msgData);
    setMessages((prev) => [...prev, { ...msgData, createdAt: new Date(), isMe: true }]);
    setInput("");
  };

  return (
    <div className="flex flex-col h-[500px] bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-slate-500 mt-10">No messages yet. Say hi!</div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.isMe || msg.senderId === user?._id ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-lg p-3 ${
                msg.isMe || msg.senderId === user?._id ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-200'
              }`}>
                <p>{msg.content}</p>
                <span className="text-xs opacity-50 mt-1 block">
                  {new Date(msg.createdAt).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
      <form onSubmit={sendMessage} className="p-4 bg-slate-900 border-t border-slate-700 flex gap-2">
        <input 
          type="text"
          className="flex-1 bg-slate-800 text-white rounded-lg px-4 py-2 border border-slate-700 focus:outline-none focus:border-purple-500"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition">
          Send
        </button>
      </form>
    </div>
  );
}
