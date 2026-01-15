import React, { useState } from 'react';
import { MoreVertical, Edit2, Trash2, MessageSquare, Heart } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import { API_BASE_URL } from '@/utils/config';

export default function ProfileActivity({ posts, isOwnProfile, onDeletePost, currentUser }) {
  const [loadingId, setLoadingId] = useState(null);

  const handleDelete = async (postId) => {
    if(!confirm("Are you sure you want to delete this post?")) return;
    
    setLoadingId(postId);
    try {
        const token = currentUser?.token || localStorage.getItem('token');
        await axios.delete(`${API_BASE_URL}/api/posts/${postId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        onDeletePost(postId);
    } catch (error) {
        console.error("Failed to delete post", error);
        alert("Failed to delete post");
    } finally {
        setLoadingId(null);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800">
      <h3 className="text-lg font-bold mb-4 dark:text-white">My Activity</h3>
      
      {posts.length === 0 ? (
        <p className="text-slate-500 text-sm">No recent activity to show.</p>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post._id} className="group relative p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              
              {/* Content Preview */}
              <Link href={`/post/${post._id}`} className="block mb-2">
                 <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2">
                    {post.description || "Shared an image"}
                 </p>
                 {post.image && (
                    <div className="mt-2 h-24 w-full bg-slate-200 dark:bg-slate-700 rounded-lg overflow-hidden">
                        <img src={post.image} alt="Post" className="w-full h-full object-cover" />
                    </div>
                 )}
              </Link>

              {/* Stats Footer */}
              <div className="flex items-center gap-4 text-xs text-slate-500">
                 <span className="flex items-center gap-1"><Heart size={12}/> {post.likes?.length || 0}</span>
                 <span className="flex items-center gap-1"><MessageSquare size={12}/> {post.comments?.length || 0}</span>
                 <span className="ml-auto">{new Date(post.createdAt).toLocaleDateString()}</span>
              </div>

              {/* Edit/Delete Actions (Only visible to owner) */}
              {isOwnProfile && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white dark:bg-slate-900 p-1 rounded-lg shadow-sm">
                   <Link href={`/edit-post/${post._id}`}>
                      <button className="p-1.5 hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded-md" title="Edit">
                        <Edit2 size={14} />
                      </button>
                   </Link>
                   <button 
                      onClick={() => handleDelete(post._id)}
                      disabled={loadingId === post._id}
                      className="p-1.5 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-md" 
                      title="Delete"
                   >
                     {loadingId === post._id ? <span className="animate-spin">...</span> : <Trash2 size={14} />}
                   </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}