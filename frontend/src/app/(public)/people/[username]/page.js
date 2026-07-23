"use client";
import React, { useState, useEffect } from 'react';
import { notFound, useParams } from 'next/navigation';
import Link from 'next/link';
import { Loader } from 'lucide-react';
import ProfileClientView from '@/Components/Profile/ProfileClientView';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6001';

export default function PublicProfilePage() {
  const params = useParams();
  const username = params?.username;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!username) return;
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/public/profile/${username}`);
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Loader className="animate-spin text-blue-600 mr-2" size={32} />
        <span className="text-lg text-slate-500">Loading profile...</span>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="text-center py-24">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile Not Found</h1>
        <Link href="/discover" className="text-blue-600 mt-4 inline-block hover:underline">Return to Discover</Link>
      </div>
    );
  }

  return <ProfileClientView initialProfile={profile} />;
}
