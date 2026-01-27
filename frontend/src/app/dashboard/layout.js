"use client";
import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useRouter, usePathname } from "next/navigation"; 
import { toggleTheme } from "@/redux/features/themeSlice";
import { setActiveTab } from "@/redux/features/navSlice"; 
import ProtectedRoute from "@/Components/ProtectedRoute";
import { Home, Search, Users, Trophy, Layers, Sun, Moon } from "lucide-react";
import Link from "next/link";
import ChatWindow from '@/Components/ChatWindow';

export default function GroupsLayout({ children }) {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();

  // 1. Get Global State
  const { user } = useSelector((state) => state.auth);
  const { isDark } = useSelector((state) => state.theme);
  const { activeTab } = useSelector((state) => state.nav); 

  // 2. Define Tabs (Same as Dashboard)
  const navItems = [
    { id: "home", label: "Home", icon: Home, href: "/dashboard" }, 
    { id: "discover", label: "Discover", icon: Search },
    { id: "connections", label: "Connections", icon: Users },
    { id: "hackathons", label: "Hackathons", icon: Trophy },
    { id: "groups", label: "Groups", icon: Layers, href: "/groups" },
  ];

  // 3. Sync Active Tab on Mount
  useEffect(() => {
    // When this layout mounts, we are definitely on the groups page
    dispatch(setActiveTab("groups"));
  }, [dispatch]);

  // 4. Navigation Handler (Crucial for moving back to Dashboard)
  const handleNavigation = (item) => {
    dispatch(setActiveTab(item.id));

    // If it's a direct link (Groups/Home), Link component handles it.
    if (item.href) return;

    // If clicking a Dashboard-only tab (Discover, etc.), force navigate to Dashboard
    router.push("/dashboard");
  };

  return (
    <ProtectedRoute>
      <div className={`min-h-screen ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
        
        {/* --- 1. TOP NAVBAR --- */}
        <nav
          className={`fixed top-0 left-0 right-0 h-16 border-b z-50 px-4 md:px-8 flex items-center justify-between transition-colors duration-500
            ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center text-white font-bold text-lg">
              U
            </div>
            <span className={`text-xl font-bold hidden md:block ${isDark ? "text-white" : "text-slate-900"}`}>
              UniConnect
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => dispatch(toggleTheme())}
              className={`p-2 rounded-full ${isDark ? "bg-slate-800 text-yellow-400" : "bg-slate-100 text-slate-600"}`}
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <Link href={`/profile/${user.username}`}>
            <div className="w-9 h-9 rounded-full bg-brand-primary text-white flex items-center justify-center font-bold">
              {user?.name?.[0]}
            </div>
            </Link>
            <Link href={`/profile/${user.username}`}>
              <div className="font-bold hover:underline cursor-pointer hidden sm:block">
                {user.name}
              </div>
            </Link>
          </div>
        </nav>

        {/* --- MAIN LAYOUT --- */}
        <div className="pt-16 flex max-w-[1600px] mx-auto pb-16 md:pb-0">
          
          {/* --- 2. LEFT SIDEBAR (Identical to Dashboard) --- */}
          <aside
            className={`hidden md:block w-64 fixed h-[calc(100vh-64px)] overflow-y-auto border-r p-4 transition-colors duration-500
              ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}
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
                            onClick={() => handleNavigation(item)}
                        >
                             <Icon size={20} /> {item.label}
                        </Link>
                    )
                }

                return (
                  <button key={item.id} onClick={() => handleNavigation(item)} className={itemClass}>
                    <Icon size={20} /> {item.label}
                  </button>
                );
              })}
            </div>
          </aside>

          {/* --- 3. CENTER CONTENT (Specific to Groups) --- */}
          {/* NOTICE: No margin-right (xl:mr-80) because we removed the Right Sidebar */}
          <main className="flex-1 md:ml-64 p-4 md:p-6 min-h-[calc(100vh-64px)] w-full">
            {children}
          </main>
          
          {/* Global Chat Window (Optional, usually for direct messages) */}
          <ChatWindow />
          
          {/* REMOVED: RightSidebar (Suggestions) to give Groups more space */}

        </div>

        {/* --- 4. MOBILE NAV --- */}
        <div className={`md:hidden fixed bottom-0 left-0 right-0 border-t z-50 px-6 py-2 flex justify-between items-center transition-colors duration-500
            ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"}`}>
            {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                
                const Content = (
                   <div className="flex flex-col items-center gap-1">
                      <Icon size={24} className={isActive ? "text-brand-primary" : "text-slate-500"} />
                      <span className={`text-[10px] ${isActive ? "text-brand-primary font-bold" : "text-slate-500"}`}>
                        {item.label}
                      </span>
                   </div>
                );

                if (item.href) {
                  return <Link key={item.id} href={item.href} onClick={() => handleNavigation(item)}>{Content}</Link>;
                }
                return <button key={item.id} onClick={() => handleNavigation(item)}>{Content}</button>;
            })}
        </div>
      </div>
    </ProtectedRoute>
  );
}

remove all related to notification system
