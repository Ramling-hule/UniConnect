"use client";
import React, { useState, useEffect } from 'react';
import { notFound, useParams } from 'next/navigation';
import Link from 'next/link';
import { Star, Users, Briefcase, Globe, Github, Linkedin, ChevronRight, Loader } from 'lucide-react';
import { BookSessionButton } from '@/Components/AuthActionButtons';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6001';

export default function PublicMentorPage() {
  const params = useParams();
  const username = params?.username;

  const [mentor, setMentor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!username) return;
    const fetchMentor = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/public/mentors/${username}`);
        if (res.ok) {
          const data = await res.json();
          setMentor(data);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Failed to fetch mentor:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchMentor();
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex justify-center items-center">
        <Loader className="animate-spin text-blue-600 mr-2" size={32} />
        <span className="text-lg text-slate-500">Loading mentor profile...</span>
      </div>
    );
  }

  if (error || !mentor) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold mb-2">Mentor Not Found</h2>
          <p className="text-slate-500 mb-6">The mentor you're looking for doesn't exist.</p>
          <Link href="/mentors" className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700">
            Browse Mentors
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 pt-20">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600" />
        <div className="px-6 pb-6">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-end -mt-16 md:-mt-12 mb-6">
            <img
              src={mentor.user?.profilePicture || '/default-avatar.png'}
              alt={mentor.user?.name}
              className="w-32 h-32 rounded-2xl object-cover border-4 border-white dark:border-slate-800 bg-white dark:bg-slate-800 shadow-md"
            />
            <div className="flex-1 pb-2">
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
                {mentor.user?.name}
              </h1>
              <p className="text-slate-500 dark:text-slate-400">@{mentor.user?.username}</p>
            </div>
            <div className="pb-2 w-full md:w-auto">
              <BookSessionButton mentorId={mentor._id} username={username} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">About</h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{mentor.about}</p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2"><Briefcase size={18} /> Experience</h3>
                <p className="font-semibold text-slate-800 dark:text-white">{mentor.role}</p>
                <p className="text-slate-500 dark:text-slate-400">{mentor.company} • {mentor.yearsOfExperience} years exp.</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-5 border border-slate-100 dark:border-slate-700">
                <h3 className="font-bold text-slate-900 dark:text-white mb-4">Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Rating</span>
                    <span className="font-bold flex items-center gap-1"><Star size={14} className="text-yellow-500" /> {mentor.averageRating?.toFixed(1) ?? '0.0'}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Sessions</span>
                    <span className="font-bold flex items-center gap-1"><Users size={14} className="text-blue-500" /> {mentor.totalSessions}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">Expertise</h3>
                <div className="flex flex-wrap gap-2">
                  {mentor.skills?.map(s => (
                    <span key={s} className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-3 py-1 rounded-full font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {(mentor.linkedin || mentor.github || mentor.portfolio) && (
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">Links</h3>
                  <div className="flex gap-3">
                    {mentor.linkedin && <a href={mentor.linkedin} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-blue-600 transition-colors"><Linkedin size={20} /></a>}
                    {mentor.github && <a href={mentor.github} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"><Github size={20} /></a>}
                    {mentor.portfolio && <a href={mentor.portfolio} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-emerald-600 transition-colors"><Globe size={20} /></a>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
