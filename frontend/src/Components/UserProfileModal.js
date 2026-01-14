"use client";
import React from "react";
import {
  X,
  MapPin,
  Briefcase,
  Calendar,
  Mail,
  ExternalLink,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { openChat } from "@/redux/features/chatSlice";

export default function UserProfileModal({ user, conn, isOpen, onClose }) {
  const dispatch = useDispatch();
  const { isDark } = useSelector((state) => state.theme);

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div
        className={`w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden relative ${
          isDark ? "bg-slate-900 text-white" : "bg-white text-slate-900"
        }`}
      >
        {/* Banner */}
        <div className="h-32 bg-gradient-to-r from-blue-600 to-purple-600"></div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full transition-colors"
        >
          <X size={20} />
        </button>

        <div className="px-6 pb-6 relative">
          {/* Avatar */}
          <div
            className={`-mt-12 w-24 h-24 rounded-full border-4 flex items-center justify-center text-3xl font-bold shadow-md ${
              isDark ? "bg-slate-800 border-slate-900" : "bg-white border-white"
            }`}
          >
            {user.name?.[0]}
          </div>

          <div className="mt-4">
            <h2 className="text-2xl font-bold">{user.name}</h2>
            <p
              className={`text-sm ${
                isDark ? "text-slate-400" : "text-slate-500"
              }`}
            >
              {user.headline || "Student at " + user.institute}
            </p>
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-3 text-sm opacity-80">
              <Briefcase size={16} />
              <span>{user.institute}</span>
            </div>
            <div className="flex items-center gap-3 text-sm opacity-80">
              <MapPin size={16} />
              <span>{user.location || "India"}</span>
            </div>
            <div className="flex items-center gap-3 text-sm opacity-80">
              <Calendar size={16} />
              <span>Joined {user.joinedDate || "2024"}</span>
            </div>
            <div className="flex items-center gap-3 text-sm opacity-80">
              <Mail size={16} />
              <a
                href={`mailto:${user.email}`}
                className="hover:underline text-blue-500"
              >
                {user.email || "Hidden"}
              </a>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-200/20 flex gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation(); 
                dispatch(openChat(conn)); 
              }}
              className="flex-1 bg-brand-primary text-white py-2.5 rounded-xl font-bold text-sm hover:opacity-90"
            >
              Message
            </button>
            <button
              className={`flex-1 border py-2.5 rounded-xl font-bold text-sm ${
                isDark
                  ? "border-slate-700 hover:bg-slate-800"
                  : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              More Info
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
