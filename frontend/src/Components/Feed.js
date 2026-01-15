"use client";
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { 
  Heart, MessageCircle, Share2, MoreHorizontal, Bookmark, Send 
} from 'lucide-react';
import { API_BASE_URL } from '@/utils/config';

// --- SUB-COMPONENT: INDIVIDUAL POST CARD ---
const PostCard = ({ post, user, isDark }) => {
  // Local State for interactions
  const [likes, setLikes] = useState(post.likes || []);
  const [comments, setComments] = useState(post.comments || []);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isShareClicked, setIsShareClicked] = useState(false);

  const isLiked = likes.includes(user?._id);

  // 1. Handle Like Toggle
  const handleLike = async () => {
    // Optimistic Update (Update UI immediately)
    if (isLiked) {
      setLikes(likes.filter(id => id !== user._id));
    } else {
      setLikes([...likes, user._id]);
    }

    try {
      await fetch(`${API_BASE_URL}/api/dashboard/posts/${post._id}/like`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user._id }),
      });
    } catch (err) {
      console.error("Like failed", err);
      // Revert on failure (optional)
    }
  };

  // 2. Handle Add Comment
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/dashboard/posts/${post._id}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user._id, text: commentText }),
      });
      const updatedComments = await res.json();
      setComments(updatedComments);
      setCommentText(""); // Clear input
    } catch (err) {
      console.error("Comment failed", err);
    }
  };

  // 3. Handle Share (Visual Only)
  const handleShare = () => {
    setIsShareClicked(true);
    navigator.clipboard.writeText(`Check out this post on UniConnect!`);
    setTimeout(() => setIsShareClicked(false), 2000); // Reset after 2s
  };

  return (
    <div className={`rounded-2xl border shadow-sm transition-all duration-300 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
      
      {/* HEADER */}
      <div className="p-5 flex justify-between items-start">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
              {post.user?.name?.[0] || "U"}
           </div>
           <div>
             <h4 className={`font-bold text-sm leading-none mb-1 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                {post.user?.name || "Unknown User"}
             </h4>
             <p className="text-xs text-slate-500 font-medium">
                {post.user?.institute || "Institute"} • {new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
             </p>
           </div>
        </div>
        <button className={`p-2 rounded-full ${isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-400 hover:bg-slate-50'}`}>
          <MoreHorizontal size={20} />
        </button>
      </div>
      
      {/* TEXT BODY */}
      {post.text && (
        <div className={`px-5 pb-3 text-sm leading-7 whitespace-pre-wrap ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            {post.text}
        </div>
      )}
      
      {/* IMAGE MEDIA */}
      {post.image && (
         <div className={`mt-2 w-full flex items-center justify-center overflow-hidden ${isDark ? 'bg-black/40' : 'bg-slate-50'}`}>
           <img src={post.image} alt="Post media" className="w-full h-auto max-h-[500px] object-contain" loading="lazy" />
         </div>
      )}
      
      {/* STATS ROW (Likes/Comments Count) */}
      <div className={`px-5 py-3 flex justify-between text-xs font-medium border-t ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-50 text-slate-500'}`}>
         <span>{likes.length > 0 ? `${likes.length} Likes` : 'Be the first to like'}</span>
         <span>{comments.length} Comments</span>
      </div>

      {/* ACTION BUTTONS */}
      <div className={`px-2 py-2 flex items-center justify-between border-t ${isDark ? 'border-slate-800' : 'border-slate-50'}`}>
         
         {/* LIKE BUTTON */}
         <button 
           onClick={handleLike}
           className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
             isLiked 
               ? 'text-red-500 bg-red-50 dark:bg-red-900/10' 
               : isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-50'
           }`}
         >
           <Heart size={18} className={isLiked ? "fill-current" : ""} />
           <span>Like</span>
         </button>

         {/* COMMENT BUTTON */}
         <button 
           onClick={() => setShowCommentInput(!showCommentInput)}
           className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-50'}`}
         >
           <MessageCircle size={18} />
           <span>Comment</span>
         </button>

         {/* SHARE BUTTON */}
         <button 
           onClick={handleShare}
           className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              isShareClicked ? 'text-green-600 bg-green-50' : isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-50'
           }`}
         >
           <Share2 size={18} />
           <span>{isShareClicked ? "Copied!" : "Share"}</span>
         </button>
      </div>

      {/* COMMENT SECTION (Toggleable) */}
      {showCommentInput && (
        <div className={`p-4 border-t animate-fade-up ${isDark ? 'border-slate-800 bg-slate-800/50' : 'border-slate-50 bg-slate-50'}`}>
           
           {/* Existing Comments List */}
           {comments.length > 0 && (
             <div className="space-y-3 mb-4 max-h-40 overflow-y-auto custom-scrollbar">
                {comments.map((c, i) => (
                  <div key={i} className="flex gap-2">
                     <div className="w-6 h-6 rounded-full bg-brand-primary text-white text-xs flex items-center justify-center font-bold">
                        {c.user?.name?.[0] || "?"}
                     </div>
                     <div className={`flex-1 p-2 rounded-lg text-xs ${isDark ? 'bg-slate-800' : 'bg-white border border-slate-200'}`}>
                        <span className={`font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>{c.user?.name || "User"}</span>
                        <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>{c.text}</span>
                     </div>
                  </div>
                ))}
             </div>
           )}

           {/* Input Field */}
           <form onSubmit={handleCommentSubmit} className="flex gap-2">
              <input 
                type="text" 
                placeholder="Add a comment..." 
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-primary/50 ${isDark ? 'bg-slate-900 text-white border-slate-700' : 'bg-white text-slate-900 border-slate-200 border'}`}
              />
              <button 
                type="submit" 
                disabled={!commentText.trim()}
                className="bg-brand-primary text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <Send size={16} />
              </button>
           </form>
        </div>
      )}

    </div>
  );
};

// --- MAIN FEED CONTAINER ---
export default function Feed({ newPostTrigger }) {
  const { user } = useSelector((state) => state.auth);
  const { isDark } = useSelector((state) => state.theme);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch Posts
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/dashboard/posts`);
        const data = await res.json();
        setPosts(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  // Update when new post is created
  useEffect(() => {
    if (newPostTrigger) setPosts((prev) => [newPostTrigger, ...prev]);
  }, [newPostTrigger]);

  if (loading) return (
    <div className={`text-center py-10 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Loading feed...</div>
  );

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <PostCard key={post._id} post={post} user={user} isDark={isDark} />
      ))}
    </div>
  );
}
