"use client";
import React, { useState, useEffect } from 'react';
import { notFound, useParams } from 'next/navigation';
import Link from 'next/link';
import { Loader } from 'lucide-react';
import JoinGroupButton from '@/Components/JoinGroupButton';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6001';

export default function PublicGroupPage() {
  const params = useParams();
  const slug = params?.slug;

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const fetchGroup = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/public/groups/${slug}`);
        if (res.ok) {
          const data = await res.json();
          setGroup(data);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Failed to fetch group:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchGroup();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Loader className="animate-spin text-blue-600 mr-2" size={32} />
        <span className="text-lg text-slate-500">Loading community...</span>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="text-center py-24">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Group Not Found</h1>
        <Link href="/discover" className="text-blue-600 mt-4 inline-block hover:underline">Return to Discover</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 mt-16">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="h-48 w-full bg-gray-200 dark:bg-gray-700 relative">
          {group.image ? (
            <img src={group.image} alt={group.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-green-500 to-teal-600"></div>
          )}
        </div>
        
        <div className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{group.name}</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">{group.memberCount} members</p>
              {group.institute && (
                <p className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {group.institute}
                </p>
              )}
            </div>
            <JoinGroupButton group={group} />
          </div>

          <div className="mt-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">About this group</h2>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{group.description || "No description provided."}</p>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 text-center">
        <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100">Want to see posts in this group?</h3>
        <p className="text-blue-700 dark:text-blue-300 mt-2 mb-4">
          Join ProConnect to participate in group discussions, share posts, and connect with members.
        </p>
        <JoinGroupButton group={group} />
      </div>
    </div>
  );
}
