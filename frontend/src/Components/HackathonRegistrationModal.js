"use client";
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { X, User, Users, Loader, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { createPortal } from 'react-dom';
import { API_BASE_URL } from '@/utils/config';

export default function HackathonRegistrationModal({ isOpen, onClose, hackathonId, soloAllowed, onSuccess }) {
  const { user } = useSelector((state) => state.auth);
  const [step, setStep] = useState(1);
  const [regType, setRegType] = useState(soloAllowed ? 'individual' : 'team');
  const [teamName, setTeamName] = useState('');
  const [teamTagline, setTeamTagline] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const endpoint = regType === 'individual'
        ? `${API_BASE_URL}/api/hackathons/${hackathonId}/register`
        : `${API_BASE_URL}/api/hackathons/${hackathonId}/teams`;
      
      const payload = regType === 'individual' ? {} : { name: teamName, tagline: teamTagline };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');

      setSuccess(true);
      toast.success(regType === 'individual' ? "Registered successfully!" : "Team created and registered!");
      if (onSuccess) onSuccess();
      
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setStep(1);
      }, 2000);
      
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
          <X size={18} />
        </button>

        <div className="p-8">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Register for Hackathon</h2>
          
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">You're in!</h3>
              <p className="text-slate-500">Redirecting...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {soloAllowed && (
                <div className="space-y-4 mb-8 mt-6">
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">How would you like to participate?</p>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setRegType('individual')}
                      className={`p-4 rounded-xl border-2 text-center transition-all ${regType === 'individual' ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'}`}
                    >
                      <User className="mx-auto mb-2" size={24} />
                      <span className="font-bold block">Solo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegType('team')}
                      className={`p-4 rounded-xl border-2 text-center transition-all ${regType === 'team' ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'}`}
                    >
                      <Users className="mx-auto mb-2" size={24} />
                      <span className="font-bold block">Create Team</span>
                    </button>
                  </div>
                </div>
              )}

              {regType === 'team' && (
                <div className="space-y-4 mb-8 mt-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Team Name</label>
                    <input
                      required
                      type="text"
                      value={teamName}
                      onChange={e => setTeamName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none text-slate-900 dark:text-white"
                      placeholder="e.g. Code Ninjas"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">Tagline (Optional)</label>
                    <input
                      type="text"
                      value={teamTagline}
                      onChange={e => setTeamTagline(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none text-slate-900 dark:text-white"
                      placeholder="What is your team about?"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {loading ? <Loader className="animate-spin" size={20} /> : "Confirm Registration"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );

  if (typeof window === 'undefined') return null;
  return createPortal(modalContent, document.body);
}
