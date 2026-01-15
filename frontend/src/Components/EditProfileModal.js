"use client";
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { X, Loader, Save } from 'lucide-react';
import { API_BASE_URL } from '@/utils/config';

export default function EditProfileModal({ isOpen, onClose, userData, onUpdate }) {
  const { user } = useSelector((state) => state.auth);
  const { isDark } = useSelector((state) => state.theme);
  const [loading, setLoading] = useState(false);

  // Initialize form with existing data
  const [formData, setFormData] = useState({
    headline: userData?.headline || "",
    location: userData?.location || "",
    about: userData?.about || "",
    skills: userData?.skills ? userData.skills.join(", ") : "", // Convert array to comma string
    openToWork: userData?.openToWork || false,
    openToCompete: userData?.openToCompete || false,
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = user?.token || localStorage.getItem('token');
      
      const payload = {
         ...formData,
         skills: formData.skills.split(',').map(s => s.trim()).filter(s => s) 
      };

      const res = await fetch(`${API_BASE_URL}/api/dashboard/user/profile`, {
        method: 'PUT',
        headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json(); // Always parse JSON first

      if (res.ok) {
        onUpdate(data); 
        onClose();
      } else {
        // Now you will see the REAL error in the console (e.g., "User not found")
        console.error("Update failed:", data.message || "Unknown error");
        alert("Failed to update: " + (data.message || "Unknown error"));
      }
    } catch (err) {
      console.error("Network Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className={`w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}>
        
        {/* Header */}
        <div className={`px-6 py-4 border-b flex justify-between items-center ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
          <h2 className="text-xl font-bold">Edit Profile</h2>
          <button onClick={onClose} className={`p-2 rounded-full transition-colors ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}>
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-5">
           
           {/* Headline */}
           <div>
              <label className="block text-xs font-bold uppercase opacity-70 mb-1.5">Headline</label>
              <input 
                name="headline"
                value={formData.headline}
                onChange={handleChange}
                placeholder="Ex: Student at IIT Bombay | Full Stack Developer"
                className={`w-full p-3 rounded-xl border bg-transparent outline-none transition-all focus:ring-2 focus:ring-brand-primary/50 ${isDark ? 'border-slate-700' : 'border-slate-200'}`}
              />
           </div>

           {/* Location */}
           <div>
              <label className="block text-xs font-bold uppercase opacity-70 mb-1.5">Location</label>
              <input 
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Ex: Mumbai, India"
                className={`w-full p-3 rounded-xl border bg-transparent outline-none transition-all focus:ring-2 focus:ring-brand-primary/50 ${isDark ? 'border-slate-700' : 'border-slate-200'}`}
              />
           </div>

           {/* About / Bio */}
           <div>
              <label className="block text-xs font-bold uppercase opacity-70 mb-1.5">About</label>
              <textarea 
                name="about"
                value={formData.about}
                onChange={handleChange}
                placeholder="Tell us about yourself..."
                className={`w-full p-3 rounded-xl border bg-transparent outline-none h-32 resize-none transition-all focus:ring-2 focus:ring-brand-primary/50 ${isDark ? 'border-slate-700' : 'border-slate-200'}`}
              />
           </div>

           {/* Skills */}
           <div>
              <label className="block text-xs font-bold uppercase opacity-70 mb-1.5">Skills (Comma separated)</label>
              <input 
                name="skills"
                value={formData.skills}
                onChange={handleChange}
                placeholder="React, Node.js, Python, Leadership..."
                className={`w-full p-3 rounded-xl border bg-transparent outline-none transition-all focus:ring-2 focus:ring-brand-primary/50 ${isDark ? 'border-slate-700' : 'border-slate-200'}`}
              />
           </div>

           {/* Status Toggles */}
           <div className={`p-4 rounded-xl border ${isDark ? 'border-slate-800 bg-slate-800/30' : 'border-slate-100 bg-slate-50'}`}>
              <label className="block text-xs font-bold uppercase opacity-70 mb-3">Status</label>
              
              <div className="flex flex-col gap-3">
                <label className="flex items-center justify-between cursor-pointer group">
                   <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${formData.openToWork ? 'bg-green-500 border-green-500' : 'border-slate-400'}`}>
                          {formData.openToWork && <Save size={12} className="text-white" />}
                      </div>
                      <span className="text-sm font-medium">Open to Work</span>
                   </div>
                   <input 
                     type="checkbox" 
                     name="openToWork"
                     checked={formData.openToWork} 
                     onChange={handleChange}
                     className="hidden"
                   />
                </label>

                <label className="flex items-center justify-between cursor-pointer group">
                   <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${formData.openToCompete ? 'bg-purple-500 border-purple-500' : 'border-slate-400'}`}>
                          {formData.openToCompete && <Save size={12} className="text-white" />}
                      </div>
                      <span className="text-sm font-medium">Open to Compete (Hackathons)</span>
                   </div>
                   <input 
                     type="checkbox" 
                     name="openToCompete"
                     checked={formData.openToCompete} 
                     onChange={handleChange}
                     className="hidden"
                   />
                </label>
              </div>
           </div>

        </div>

        {/* Footer Actions */}
        <div className={`p-6 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
           <button 
             onClick={handleSubmit}
             disabled={loading}
             className="w-full bg-brand-primary text-white py-3.5 rounded-xl font-bold text-sm flex justify-center items-center gap-2 hover:opacity-90 disabled:opacity-70 transition-all shadow-lg shadow-blue-500/20"
           >
             {loading ? <Loader className="animate-spin" size={18} /> : <Save size={18} />}
             Save Changes
           </button>
        </div>

      </div>
    </div>
  );
}