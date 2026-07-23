"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { Search, Filter, Loader, Users, CheckCircle, Plus } from "lucide-react";
import toast from "react-hot-toast";
import apiClient from "@/utils/apiClient";
import Link from "next/link";
import { API_BASE_URL } from "@/utils/config";

export default function FindTeammatesPage() {
  const params = useParams();
  const slug = params?.slug;
  const router = useRouter();
  const { user } = useSelector((state) => state.auth);

  const [hackathon, setHackathon] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [skills, setSkills] = useState("");
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("");

  useEffect(() => {
    fetchHackathonAndRequests();
  }, [slug]);

  const fetchHackathonAndRequests = async () => {
    if (!slug) return;
    setLoading(true);
    try {
      // First get Hackathon ID
      const hRes = await fetch(`${API_BASE_URL}/api/public/hackathons/${slug}`);
      if (!hRes.ok) throw new Error("Hackathon not found");
      const hData = await hRes.json();
      setHackathon(hData);

      // Then get Requests
      const qParams = new URLSearchParams();
      if (skills) qParams.append("skills", skills);
      if (branch) qParams.append("branch", branch);
      if (year) qParams.append("year", year);

      const rRes = await apiClient.get(`/api/hackathons/${hData.id || hData._id}/teammate-requests?${qParams.toString()}`);
      setRequests(rRes.data.requests || []);
    } catch (err) {
      toast.error(err.message || "Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = (e) => {
    e.preventDefault();
    fetchHackathonAndRequests();
  };

  const handleInterest = async (requestId) => {
    try {
      await apiClient.post(`/api/hackathons/teammate-requests/${requestId}/interest`, { message: "I am interested in joining your team!" });
      toast.success("Interest sent to the team leader!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to express interest");
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader className="animate-spin text-orange-500" size={40} /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Find Teammates</h1>
          <p className="text-slate-500">Discover and join teams for {hackathon?.title}</p>
        </div>
        <button className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-semibold transition-colors">
          <Plus size={18} /> Post a Request
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Filters Sidebar */}
        <div className="w-full md:w-1/4 bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 h-fit sticky top-24">
          <h3 className="font-bold flex items-center gap-2 mb-4 dark:text-white"><Filter size={18} /> Filters</h3>
          <form onSubmit={handleApplyFilters} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Skills (comma separated)</label>
              <input type="text" value={skills} onChange={e => setSkills(e.target.value)} placeholder="React, Node.js" className="w-full mt-1 p-2 border dark:border-slate-700 dark:bg-slate-900 rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Branch</label>
              <input type="text" value={branch} onChange={e => setBranch(e.target.value)} placeholder="CSE, IT" className="w-full mt-1 p-2 border dark:border-slate-700 dark:bg-slate-900 rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase">Year</label>
              <input type="text" value={year} onChange={e => setYear(e.target.value)} placeholder="3rd Year" className="w-full mt-1 p-2 border dark:border-slate-700 dark:bg-slate-900 rounded-lg text-sm" />
            </div>
            <button type="submit" className="w-full bg-slate-900 dark:bg-slate-700 text-white py-2 rounded-lg text-sm font-semibold hover:bg-slate-800">Apply Filters</button>
          </form>
        </div>

        {/* Feed */}
        <div className="w-full md:w-3/4 space-y-4">
          {requests.length === 0 ? (
            <div className="text-center py-10 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
              <Users size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium">No teammate requests found matching your criteria.</p>
            </div>
          ) : (
            requests.map(req => (
              <div key={req._id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <img src={req.creator?.profilePicture || "/default-avatar.png"} alt={req.creator?.name} className="w-12 h-12 rounded-full object-cover" />
                    <div>
                      <Link href={`/profile/${req.creator?.username}`} className="font-bold text-slate-900 dark:text-white hover:underline">
                        {req.creator?.name}
                      </Link>
                      <p className="text-xs text-slate-500">{req.creator?.headline}</p>
                    </div>
                  </div>
                  <div className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs px-2 py-1 rounded-full font-semibold flex items-center gap-1">
                    <Users size={12} /> {req.seatsAvailable} Seat{req.seatsAvailable > 1 ? "s" : ""} Available
                  </div>
                </div>

                <p className="text-sm text-slate-700 dark:text-slate-300 mb-4 whitespace-pre-wrap">{req.description}</p>

                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl space-y-2 text-sm mb-4">
                  <p><span className="font-semibold text-slate-700 dark:text-slate-300">Required Skills:</span> {req.requiredSkills?.join(", ")}</p>
                  <div className="flex gap-4 text-slate-600 dark:text-slate-400">
                    {req.preferredYear && <p><span className="font-semibold text-slate-700 dark:text-slate-300">Year:</span> {req.preferredYear}</p>}
                    {req.preferredBranch && <p><span className="font-semibold text-slate-700 dark:text-slate-300">Branch:</span> {req.preferredBranch}</p>}
                  </div>
                </div>

                <div className="flex justify-end pt-2 border-t dark:border-slate-700">
                  <button onClick={() => handleInterest(req._id)} className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-full font-semibold text-sm transition-colors">
                    I&apos;m Interested
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
