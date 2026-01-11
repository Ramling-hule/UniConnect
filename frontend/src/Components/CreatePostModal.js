"use client";
import React, { useState } from 'react';
import { X, Image as ImageIcon, Loader } from 'lucide-react';
import { useSelector } from 'react-redux';

export default function CreatePostModal({ isOpen, onClose, onPostCreated }) {
  const { isDark } = useSelector((state) => state.theme);
  const { user } = useSelector((state) => state.auth);
  
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState(null); // Store the actual file object
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!text && !imageFile) return;
    setLoading(true);

    try {
      // 1. Create FormData (Required for sending files)
      const formData = new FormData();
      formData.append('userId', user._id);
      formData.append('text', text);
      if (imageFile) {
        formData.append('file', imageFile); // 'file' must match upload.single('file') in backend
      }

      // 2. Send to Backend
      const res = await fetch("http://localhost:5000/api/dashboard/posts", {
        method: "POST",
        // Note: Do NOT set Content-Type header when sending FormData; 
        // the browser sets it automatically with the boundary.
        body: formData, 
      });

      if (!res.ok) throw new Error("Failed to create post");

      const newPost = await res.json();
      
      // 3. Update Feed & Close
      onPostCreated(newPost);
      onClose();
      setText("");
      setImageFile(null);

    } catch (error) {
      console.error("Post failed", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className={`w-full max-w-lg rounded-2xl shadow-2xl p-6 ${isDark ? 'bg-slate-800 text-white' : 'bg-white text-slate-900'}`}>
        
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Create Post</h2>
          <button onClick={onClose}><X /></button>
        </div>

        <textarea
          placeholder="What do you want to talk about?"
          className={`w-full h-32 p-3 rounded-xl resize-none outline-none text-sm mb-4 ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        {/* Image Preview */}
        {imageFile && (
          <div className="mb-4 relative">
             <img src={URL.createObjectURL(imageFile)} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
             <button onClick={() => setImageFile(null)} className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full"><X size={16}/></button>
          </div>
        )}

        <div className="flex justify-between items-center pt-4 border-t border-gray-200/20">
          <label className="cursor-pointer p-2 rounded-full hover:bg-gray-100/10 text-brand-primary flex items-center gap-2 text-sm font-bold">
            <ImageIcon size={20} />
            <span>Photo</span>
            <input type="file" accept="image/*" hidden onChange={handleImageChange} />
          </label>

          <button 
            onClick={handleSubmit}
            disabled={loading || (!text && !imageFile)}
            className="bg-brand-primary text-white px-6 py-2 rounded-lg font-bold disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <Loader className="animate-spin" size={16} />}
            Post
          </button>
        </div>
      </div>
    </div>
  );
}