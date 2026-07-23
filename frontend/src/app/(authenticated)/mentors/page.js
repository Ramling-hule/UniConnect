"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { GraduationCap, Star, Users, ChevronRight, Loader } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6001';

export default function PublicMentorsPage() {
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get('page')) || 1;

  const [mentors, setMentors] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMentors = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/public/mentors?page=${page}&limit=18`);
        if (res.ok) {
          const data = await res.json();
          setMentors(data.mentors || []);
          setPagination(data.pagination || { total: 0, pages: 1 });
        } else {
          setMentors([]);
        }
      } catch (err) {
        console.error('Failed to fetch mentors:', err);
        setMentors([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMentors();
  }, [page]);

  return (
    <div className="pb-10">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <GraduationCap size={24} className="text-blue-600 dark:text-blue-400" />
              Expert Mentors
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Connect with industry-approved experts to level up your skills and navigate your career.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-24 text-slate-500">
            <Loader className="animate-spin mr-2" /> Loading mentors...
          </div>
        ) : mentors && mentors.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {mentors.map((mentor) => (
              <Link
                key={mentor._id || mentor.id}
                href={`/mentors/${mentor.user?.username}`}
                className="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
              >
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={mentor.user?.profilePicture || '/default-avatar.png'}
                    alt={mentor.user?.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-blue-100"
                  />
                  <div>
                    <h2 className="font-bold text-slate-900 dark:text-white text-lg leading-tight group-hover:text-blue-600 transition-colors">
                      {mentor.user?.name}
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">@{mentor.user?.username}</p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-1">{mentor.role} @ {mentor.company}</p>
                <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mb-4">{mentor.about}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {(mentor.skills ?? []).slice(0, 3).map(s => (
                    <span key={s} className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full">{s}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-4 border-t border-slate-100 dark:border-slate-700">
                  <span className="flex items-center gap-1"><Star size={12} className="text-yellow-500" /> {mentor.averageRating?.toFixed(1) ?? '0.0'}</span>
                  <span className="flex items-center gap-1"><Users size={12} /> {mentor.totalSessions} sessions</span>
                  <span className="text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1">View <ChevronRight size={12} /></span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 text-slate-500">No mentors found.</div>
        )}

        {pagination && pagination.pages > 1 && (
          <div className="flex justify-center gap-2 mt-12">
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
              <Link
                key={p}
                href={`/mentors?page=${p}`}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${p === page ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'}`}
              >
                {p}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
