"use client";
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '@/utils/config';
import { openAuthModal } from '@/redux/features/authSlice';

export default function JoinGroupButton({ group }) {
  const { user } = useSelector((state) => state.auth);
  const router = useRouter();
  const dispatch = useDispatch();

  const handleJoin = async () => {
    if (!user) {
      dispatch(openAuthModal("Please sign in to join this group."));
      return;
    }

    try {
      const token = user.token || localStorage.getItem("token");
      const res = await fetch(`${API_BASE_URL}/api/groups/${group._id}/request-join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      
      const data = await res.json();
      if (res.ok) {
        toast.success("Requested to join group!");
      } else {
        toast.error(data.message || "Failed to join group");
      }
    } catch (err) {
      toast.error("Something went wrong");
    }
  };

  return (
    <button 
      onClick={handleJoin}
      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full transition-colors"
    >
      Join Group
    </button>
  );
}
