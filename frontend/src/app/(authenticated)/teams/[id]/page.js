"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { Loader, Users, Check, X, Shield, MessageCircle } from "lucide-react";
import toast from "react-hot-toast";
import apiClient from "@/utils/apiClient";
import Link from "next/link";
import { API_BASE_URL } from "@/utils/config";
import ProfilePreviewModal from "@/Components/ProfilePreviewModal";

export default function TeamDashboardPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useSelector((state) => state.auth);

  const [team, setTeam] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchTeamAndRequests();
  }, [id]);

  const fetchTeamAndRequests = async () => {
    setLoading(true);
    try {
      // For brevity, fetching leader requests directly 
      // (in a real app, you'd fetch the team details from another endpoint first, but here we just need the requests for the leader)
      const reqRes = await apiClient.get("/api/teams/leader/requests");
      setRequests(reqRes.data.requests.filter(r => r.team === id || r.team?._id === id));
    } catch (err) {
      console.error(err);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId) => {
    try {
      await apiClient.post(`/api/teams/${id}/requests/${requestId}/accept`);
      toast.success("Request accepted! User added to team.");
      fetchTeamAndRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to accept request");
    }
  };

  const handleReject = async (requestId) => {
    try {
      await apiClient.post(`/api/teams/${id}/requests/${requestId}/reject`);
      toast.success("Request rejected.");
      fetchTeamAndRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reject request");
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader className="animate-spin text-brand-primary" size={40} /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Team Dashboard</h1>
        <p className="text-slate-500">Manage your team members and requests</p>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
        <h2 className="text-xl font-bold mb-4 dark:text-white flex items-center gap-2">
          <Users size={20} /> Pending Requests ({requests.length})
        </h2>
        
        {requests.length === 0 ? (
          <p className="text-slate-500 text-center py-8">No pending requests right now.</p>
        ) : (
          <div className="space-y-4">
            {requests.map(req => (
              <div key={req._id} className="flex justify-between items-center p-4 border dark:border-slate-700 rounded-xl">
                <div className="flex items-center gap-4">
                  <button onClick={() => setSelectedUser(req.user)}>
                    <img src={req.user.profilePicture || "/default-avatar.png"} alt={req.user.name} className="w-12 h-12 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-brand-primary" />
                  </button>
                  <div>
                    <button onClick={() => setSelectedUser(req.user)} className="font-bold hover:underline dark:text-white cursor-pointer">{req.user.name}</button>
                    <p className="text-xs text-slate-500">{req.user.headline || "Student"}</p>
                    {req.message && <p className="text-sm mt-1 text-slate-700 dark:text-slate-300 italic">&quot;{req.message}&quot;</p>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleAccept(req._id)} className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center gap-1 text-sm font-semibold">
                    <Check size={16} /> Accept
                  </button>
                  <button onClick={() => handleReject(req._id)} className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center gap-1 text-sm font-semibold">
                    <X size={16} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ProfilePreviewModal 
        isOpen={!!selectedUser} 
        onClose={() => setSelectedUser(null)} 
        user={selectedUser} 
      />
    </div>
  );
}
