"use client";
import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { toggleTheme } from "@/redux/features/themeSlice";
import { setActiveTab } from "@/redux/features/navSlice"; // Import the specific action
import RightSidebar from "@/Components/RightSidebar";
import ProtectedRoute from "@/Components/ProtectedRoute";
import { Home, Search, Users, Trophy, Layers, Sun, Moon } from "lucide-react";
import Link from "next/link";
import ChatWindow from '@/Components/ChatWindow';

export default function DashboardLayout({ children }) {
  const dispatch = useDispatch();

  // 1. Get Global State
  const { user } = useSelector((state) => state.auth);
  const { isDark } = useSelector((state) => state.theme);
  const { activeTab } = useSelector((state) => state.nav); // Read active tab from Redux

  // 2. Define Tabs (Use IDs instead of Href)
  const navItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "discover", label: "Discover", icon: Search },
    { id: "connections", label: "Connections", icon: Users },
    { id: "hackathons", label: "Hackathons", icon: Trophy },
    { id: "groups", label: "Groups", icon: Layers },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen">
        {/* --- 1. TOP NAVBAR --- */}
        <nav
          className={`fixed top-0 left-0 right-0 h-16 border-b z-50 px-4 md:px-8 flex items-center justify-between transition-colors duration-500
            ${
              isDark
                ? "bg-slate-900 border-slate-800"
                : "bg-white border-slate-200"
            }`}
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center text-white font-bold text-lg">
              U
            </div>
            <span
              className={`text-xl font-bold hidden md:block ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              UniConnect
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => dispatch(toggleTheme())}
              className={`p-2 rounded-full ${
                isDark
                  ? "bg-slate-800 text-yellow-400"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="w-9 h-9 rounded-full bg-brand-primary text-white flex items-center justify-center font-bold">
              {user?.name?.[0]}
            </div>
            <Link href={`/profile/${user.username}`}>
              <div className="font-bold hover:underline cursor-pointer">
                {user.name}
              </div>
            </Link>
          </div>
        </nav>

        <div className="pt-16 flex max-w-[1600px] mx-auto">
          {/* --- 2. LEFT SIDEBAR (Component Navigation) --- */}
          <aside
            className={`hidden md:block w-64 fixed h-[calc(100vh-64px)] overflow-y-auto border-r p-4 transition-colors duration-500
              ${
                isDark
                  ? "bg-slate-900 border-slate-800"
                  : "bg-white border-slate-200"
              }`}
          >
            <div className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id; // Check Redux state
                return (
                  <button
                    key={item.id}
                    onClick={() => dispatch(setActiveTab(item.id))} // Dispatch Action
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all mb-1 ${
                      isActive
                        ? "bg-brand-primary text-white shadow-lg shadow-blue-500/30"
                        : isDark
                        ? "text-slate-400 hover:bg-slate-800"
                        : "text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    <Icon size={20} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </aside>

          {/* --- 3. CENTER CONTENT --- */}
          <main className="flex-1 md:ml-64 xl:mr-80 p-4 md:p-8 min-h-[calc(100vh-64px)] max-w-4xl mx-auto w-full">
            {children}
            {/* 'children' here is src/app/dashboard/page.js, which acts as the Switch Controller */}
          </main>
          <ChatWindow />
          {/* --- 4. RIGHT SIDEBAR --- */}
          <RightSidebar />
        </div>
      </div>
    </ProtectedRoute>
  );
}
