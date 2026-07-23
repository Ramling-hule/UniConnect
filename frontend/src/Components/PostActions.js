"use client";
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { openAuthModal } from '@/redux/features/authSlice';

export default function PostActions({ postId }) {
  const { user } = useSelector((state) => state.auth);
  const router = useRouter();
  const dispatch = useDispatch();

  const handleAction = (action) => {
    if (!user) {
      dispatch(openAuthModal(`Please sign in to ${action} this post.`));
      return;
    }
    console.log(`Action ${action} triggered by user ${user.username}`);
  };

  return (
    <>
      <div className="flex px-2 py-1">
        <button onClick={() => handleAction('like')} className="flex-1 text-center py-3 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition">
          Like
        </button>
        <button onClick={() => handleAction('comment')} className="flex-1 text-center py-3 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition">
          Comment
        </button>
        <button onClick={() => handleAction('share')} className="flex-1 text-center py-3 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition">
          Share
        </button>
      </div>
      
      {!user && (
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 text-center">
          <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100">Join the conversation</h3>
          <p className="text-blue-700 dark:text-blue-300 mt-2 mb-4">
            Sign in to like, comment, and connect.
          </p>
          <button 
            onClick={() => handleAction('login')}
            className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full transition-colors"
          >
            Sign In
          </button>
        </div>
      )}
    </>
  );
}
