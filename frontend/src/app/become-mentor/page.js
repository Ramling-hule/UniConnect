"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import apiClient from '@/services/apiClient';
import { mentorSchema, getZodError } from '@/utils/schemas';
import toast from 'react-hot-toast';
import { extractErrorMessage } from '@/utils/errorHelper';

export default function BecomeMentorPage() {
  const router = useRouter();
  const { user } = useSelector((state) => state.auth);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    headline: '',
    about: '',
    company: '',
    role: '',
    yearsOfExperience: 1,
    skills: '',
    languages: 'English',
    linkedin: '',
    github: '',
    portfolio: '',
  });

  const applyMutation = useMutation({
    mutationFn: async (data) => {
      const { data: responseData } = await apiClient.post('/api/mentor/apply', {
        ...data,
        skills: data.skills.split(',').map(s => s.trim()),
        languages: data.languages.split(',').map(l => l.trim())
      });
      return responseData;
    },
    onSuccess: () => {
      toast.success("Application submitted! Redirecting to dashboard...");
      router.push('/dashboard');
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error, 'Application failed'));
    }
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      mentorSchema.parse(formData);
    } catch (err) {
      toast.error(getZodError(err));
      return;
    }
    applyMutation.mutate(formData);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="p-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl">
          <h2 className="text-2xl font-bold mb-4">You need to log in first.</h2>
          <button onClick={() => router.push('/login')} className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-lg font-semibold transition-all">Go to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6 flex flex-col items-center">
      <div className="max-w-4xl w-full mt-10">
        <h1 className="text-4xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 text-center mb-4">
          Become a Mentor
        </h1>
        <p className="text-center text-slate-400 mb-12 text-lg">Share your expertise. Build your brand. Get paid.</p>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
          {/* Glassmorphism background glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-blue-500/10 blur-3xl rounded-full -z-10 pointer-events-none"></div>

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            {step === 1 && (
              <div className="animate-fade-up">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><span className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm">1</span> Professional Details</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Headline</label>
                    <input name="headline" value={formData.headline} onChange={handleChange} required placeholder="e.g. Senior SWE at Google" className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white placeholder-slate-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Company</label>
                    <input name="company" value={formData.company} onChange={handleChange} required placeholder="e.g. Google" className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white placeholder-slate-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Role</label>
                    <input name="role" value={formData.role} onChange={handleChange} required placeholder="e.g. Software Engineer" className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white placeholder-slate-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Years of Experience</label>
                    <input name="yearsOfExperience" type="number" min="1" value={formData.yearsOfExperience} onChange={handleChange} required className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white placeholder-slate-500" />
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-slate-400 mb-2">About You</label>
                  <textarea name="about" value={formData.about} onChange={handleChange} required rows="4" placeholder="Tell mentees about your journey..." className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white placeholder-slate-500 resize-none"></textarea>
                </div>

                <div className="mt-8 flex justify-end">
                  <button type="button" onClick={nextStep} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-1">Next Step →</button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="animate-fade-up">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><span className="w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-sm">2</span> Skills & Socials</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Skills (comma separated)</label>
                    <input name="skills" value={formData.skills} onChange={handleChange} required placeholder="React, Node, System Design" className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-white placeholder-slate-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Languages (comma separated)</label>
                    <input name="languages" value={formData.languages} onChange={handleChange} required placeholder="English, Hindi" className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-white placeholder-slate-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">LinkedIn URL</label>
                    <input name="linkedin" value={formData.linkedin} onChange={handleChange} placeholder="https://linkedin.com/in/..." className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-white placeholder-slate-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Portfolio/Github URL</label>
                    <input name="portfolio" value={formData.portfolio} onChange={handleChange} placeholder="https://github.com/..." className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all text-white placeholder-slate-500" />
                  </div>
                </div>

                <div className="mt-8 flex justify-between">
                  <button type="button" onClick={prevStep} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-8 py-3 rounded-xl font-bold transition-all">← Back</button>
                  <button type="submit" disabled={applyMutation.isPending} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-purple-500/30 transition-all hover:-translate-y-1 disabled:opacity-50">
                    {applyMutation.isPending ? 'Submitting...' : 'Submit Application ✨'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
