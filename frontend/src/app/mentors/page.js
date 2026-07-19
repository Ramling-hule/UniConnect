"use client";
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '@/utils/config';
import Link from 'next/link';

export default function MentorsExplorePage() {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('popular');

  const { data, isLoading, error } = useQuery({
    queryKey: ['mentors', search, sort],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/mentor/explore?search=${search}&sort=${sort}`);
      if (!res.ok) throw new Error("Failed to fetch mentors");
      return res.json();
    }
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Hero Section */}
      <div className="bg-slate-900 border-b border-slate-800 py-16 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">Find Your Perfect Mentor</h1>
          <p className="text-lg text-slate-400 mb-8 max-w-2xl">Connect with industry experts, get career guidance, and accelerate your growth with 1-on-1 sessions.</p>
          
          <div className="flex flex-col md:flex-row gap-4 max-w-3xl">
            <input 
              type="text" 
              placeholder="Search by company, role, or skills..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-slate-800/80 border border-slate-700 rounded-xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all backdrop-blur-sm"
            />
            <select 
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-slate-800/80 border border-slate-700 rounded-xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all backdrop-blur-sm cursor-pointer"
            >
              <option value="popular">Most Popular</option>
              <option value="highestRated">Highest Rated</option>
              <option value="newest">Newest</option>
            </select>
          </div>
        </div>
      </div>

      {/* Mentors Grid */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="text-red-400 bg-red-900/20 p-4 rounded-xl text-center border border-red-900/50">{error.message}</div>
        ) : data?.mentors?.length === 0 ? (
          <div className="text-center text-slate-500 py-12">No mentors found matching your criteria.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.mentors.map((mentor) => (
              <div key={mentor._id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 hover:shadow-2xl hover:shadow-blue-900/20 transition-all group flex flex-col h-full">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-slate-800 overflow-hidden flex-shrink-0 border-2 border-slate-700">
                    {mentor.user?.profilePicture ? (
                      <img src={mentor.user.profilePicture} alt={mentor.user.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl font-bold text-slate-500">
                        {mentor.user?.name?.charAt(0) || 'M'}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">{mentor.user?.name}</h3>
                    <p className="text-sm text-slate-400">{mentor.headline}</p>
                    <p className="text-xs text-blue-400 font-semibold mt-1">{mentor.company}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {mentor.skills.slice(0, 3).map(skill => (
                    <span key={skill} className="bg-slate-800 text-xs px-2 py-1 rounded-md text-slate-300">{skill}</span>
                  ))}
                  {mentor.skills.length > 3 && <span className="bg-slate-800 text-xs px-2 py-1 rounded-md text-slate-400">+{mentor.skills.length - 3}</span>}
                </div>

                <div className="mt-auto pt-4 border-t border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-yellow-500">
                    <span>★</span>
                    <span className="font-bold text-sm text-white">{mentor.averageRating.toFixed(1)}</span>
                    <span className="text-xs text-slate-500">({mentor.totalReviews})</span>
                  </div>
                  <Link href={`/mentor/${mentor._id}`} className="bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all">
                    View Profile
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
