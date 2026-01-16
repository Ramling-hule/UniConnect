"use client";
import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toggleTheme } from "@/redux/features/themeSlice";
import { setActiveTab } from "@/redux/features/navSlice";
import { setNotifications, addNotification } from "@/redux/features/notificationSlice"; // Import notification actions
import RightSidebar from "@/Components/RightSidebar";
import ProtectedRoute from "@/Components/ProtectedRoute";
import { Home, Search, Users, Trophy, Layers, Sun, Moon } from "lucide-react";
import Link from "next/link";
import ChatWindow from "@/Components/ChatWindow";
import NotificationDropdown from "@/Components/NotificationDropdown";
import io from "socket.io-client"; // Import Socket.io
import { API_BASE_URL } from "@/utils/config";

let socket; // Initialize outside component

export default function DashboardLayout({ children }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { isDark } = useSelector((state) => state.theme);
  const { activeTab } = useSelector((state) => state.nav);

  const navItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "discover", label: "Discover", icon: Search },
    { id: "connections", label: "Connections", icon: Users },
    { id: "hackathons", label: "Hackathons", icon: Trophy },
    { id: "groups", label: "Groups", icon: Layers, href: "/groups" },
  ];

  // --- NOTIFICATION & SOCKET LOGIC ---
  useEffect(() => {
    if (user) {
      // 1. Initialize Socket
      socket = io(API_BASE_URL);

      // 2. Join User Room
      socket.emit("setup_user", user.id || user._id); // Handle both id formats

      // 3. Fetch Old Notifications
      const token = user.token || localStorage.getItem('token');
      fetch(`${API_BASE_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
            if(res.ok) return res.json();
            throw new Error("Failed to fetch notifications");
        })
        .then((data) => {
            if(Array.isArray(data)) dispatch(setNotifications(data));
        })
        .catch(err => console.error("Notification fetch error:", err));

      // 4. Listen for Real-time Notifications
      socket.on("new_notification", (notif) => {
        // Optional: Play sound here
        // const audio = new Audio('/ping.mp3');
        // audio.play().catch(e => console.log("Audio play failed", e));

        dispatch(addNotification(notif));
      });

      // Cleanup on unmount
      return () => {
        if (socket) socket.disconnect();
      };
    }
  }, [user, dispatch]);

  return (
    <ProtectedRoute>
      <div
        className={`min-h-screen ${isDark ? "bg-slate-950" : "bg-slate-50"}`}
      >
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
            
            {/* Notification Dropdown Component */}
            <NotificationDropdown />

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
            
            <Link href={`/profile/${user?.username}`}>
              <div className="w-9 h-9 rounded-full bg-brand-primary text-white flex items-center justify-center font-bold overflow-hidden border-2 border-transparent hover:border-brand-primary transition-all">
                {user?.profilePicture ? (
                    <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover"/>
                ) : (
                    user?.name?.[0]
                )}
              </div>
            </Link>
            <Link href={`/profile/${user?.username}`}>
              <div className={`font-bold hover:underline cursor-pointer hidden sm:block ${isDark ? "text-white" : "text-slate-900"}`}>
                {user?.name}
              </div>
            </Link>
          </div>
        </nav>

        <div className="pt-16 flex max-w-[1600px] mx-auto pb-16 md:pb-0">
          {" "}
          {/* Added pb-16 for mobile nav spacing */}
          {/* --- 2. LEFT SIDEBAR (Desktop Only) --- */}
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
                const isActive = activeTab === item.id;
                const itemClass = `w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all mb-1 ${
                  isActive
                    ? "bg-brand-primary text-white shadow-lg shadow-blue-500/30"
                    : isDark
                    ? "text-slate-400 hover:bg-slate-800"
                    : "text-slate-500 hover:bg-slate-50"
                }`;

                if (item.href) {
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={itemClass}
                      onClick={() => dispatch(setActiveTab(item.id))}
                    >
                      <Icon size={20} />
                      {item.label}
                    </Link>
                  );
                }

                return (
                  <button
                    key={item.id}
                    onClick={() => dispatch(setActiveTab(item.id))}
                    className={itemClass}
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
          </main>
          <ChatWindow />
          {/* --- 4. RIGHT SIDEBAR (Desktop Only) --- */}
          <RightSidebar />
        </div>

        {/* --- 5. MOBILE BOTTOM NAVIGATION (Visible only on small screens) --- */}
        <div
          className={`md:hidden fixed bottom-0 left-0 right-0 border-t z-50 px-6 py-2 flex justify-between items-center transition-colors duration-500
            ${
              isDark
                ? "bg-slate-900 border-slate-800"
                : "bg-white border-slate-200"
            }`}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            // Wrapper for click logic
            const Content = (
              <div className="flex flex-col items-center gap-1">
                <Icon
                  size={24}
                  className={isActive ? "text-brand-primary" : "text-slate-500"}
                />
                <span
                  className={`text-[10px] ${
                    isActive ? "text-brand-primary font-bold" : "text-slate-500"
                  }`}
                >
                  {item.label}
                </span>
              </div>
            );

            if (item.href) {
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => dispatch(setActiveTab(item.id))}
                >
                  {Content}
                </Link>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => dispatch(setActiveTab(item.id))}
              >
                {Content}
              </button>
            );
          })}
        </div>
      </div>
    </ProtectedRoute>
  );
}