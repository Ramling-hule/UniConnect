"use client";
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { UserPlus, Search, Loader, Clock, MessageCircle } from "lucide-react";
import { API_BASE_URL } from "@/utils/config";
import UserProfileModal from "@/Components/UserProfileModal"; // 1. Import Modal

export default function DiscoverView() {
  const { user } = useSelector((state) => state.auth);
  const { isDark } = useSelector((state) => state.theme);

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // 2. Add State for the selected user
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = user?.token || localStorage.getItem("token");
        const res = await fetch(`${API_BASE_URL}/api/dashboard/discover`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();

        if (Array.isArray(data)) {
          setUsers(data);
        } else {
          console.error("API Error:", data);
          setUsers([]);
        }
      } catch (err) {
        console.error("Fetch failed", err);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchUsers();
  }, [user]);

  const handleConnect = async (receiverId) => {
    // 1. Optimistic UI Update (Green button -> Pending)
    if (Array.isArray(users)) {
      setUsers((prev) =>
        prev.map((u) =>
          u._id === receiverId ? { ...u, status: "pending" } : u
        )
      );
    }

    // Also update modal state if open
    if (selectedUser && selectedUser._id === receiverId) {
      setSelectedUser((prev) => ({ ...prev, status: "pending" }));
    }

    try {
      const token = user?.token || localStorage.getItem("token");

      // 2. Send Connection Request
      const connectRes = await fetch(`${API_BASE_URL}/api/dashboard/connect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ receiverId }),
      });

      // 3. IF SUCCESSFUL -> Send Notification manually from here
      if (connectRes.ok) {
        await fetch(`${API_BASE_URL}/api/notifications`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            recipientId: receiverId,
            type: "connection_request",
            message: "sent you a connection request.",
            link: "/network", // Where clicking the notif takes them
          }),
        });
      }
    } catch (err) {
      console.error("Connect failed", err);
      // Optional: Revert UI state on error
    }
  };

  if (loading)
    return (
      <div className="flex justify-center p-10">
        <Loader className="animate-spin text-brand-primary" />
      </div>
    );

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Search Bar */}
      <div
        className={`p-4 rounded-2xl border flex items-center gap-3 transition-colors ${
          isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
        }`}
      >
        <Search className="text-slate-400" />
        <input
          type="text"
          placeholder="Search..."
          className={`bg-transparent outline-none w-full text-sm ${
            isDark ? "text-white" : "text-slate-900"
          }`}
        />
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {users?.length === 0 && !loading && (
          <p className="col-span-2 text-center text-slate-400 py-10">
            No users found to connect with.
          </p>
        )}

        {Array.isArray(users) &&
          users.map((u) => (
            <div
              key={u._id}
              // 3. Add Click Handler to Card
              onClick={() => setSelectedUser(u)}
              className={`cursor-pointer p-5 rounded-2xl border shadow-sm flex items-center justify-between transition-all hover:shadow-md ${
                isDark
                  ? "bg-slate-900 border-slate-800"
                  : "bg-white border-slate-100"
              }`}
            >
              <div className="flex items-center gap-4 overflow-hidden">
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl shrink-0">
                  {u.name?.[0]}
                </div>
                <div className="min-w-0">
                  <h4
                    className={`font-bold truncate ${
                      isDark ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {u.name}
                  </h4>
                  <p className="text-xs text-slate-500 truncate">
                    {u.headline || u.institute}
                  </p>
                  <div className="flex gap-1 mt-2">
                    <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-medium dark:bg-blue-900/20 dark:text-blue-400">
                      Student
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center min-w-[60px]">
                {u.status === "connected" && (
                  <button className="flex flex-col items-center gap-1 text-brand-primary">
                    <div className="p-2 rounded-full bg-brand-primary/10 hover:bg-brand-primary hover:text-white transition-colors">
                      <MessageCircle size={20} />
                    </div>
                    <span className="text-[10px] font-bold">Message</span>
                  </button>
                )}

                {u.status === "pending" && (
                  <button
                    disabled
                    className="flex flex-col items-center gap-1 text-slate-400 cursor-not-allowed"
                  >
                    <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-800">
                      <Clock size={20} />
                    </div>
                    <span className="text-[10px] font-bold">Pending</span>
                  </button>
                )}

                {(u.status === "none" || !u.status) && (
                  <button
                    onClick={(e) => {
                      // 4. STOP PROPAGATION (Critical!)
                      // Prevent clicking "Connect" from opening the modal
                      e.stopPropagation();
                      handleConnect(u._id);
                    }}
                    className="flex flex-col items-center gap-1 text-slate-500 hover:text-brand-primary transition-colors group"
                  >
                    <div className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-brand-primary group-hover:text-white transition-colors">
                      <UserPlus size={20} />
                    </div>
                    <span className="text-[10px] font-bold">Connect</span>
                  </button>
                )}
              </div>
            </div>
          ))}
      </div>

      {/* 5. Render Modal */}
      <UserProfileModal
        user={selectedUser}
        conn={selectedUser} // Passing the user object as connection data
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
      />
    </div>
  );
}
