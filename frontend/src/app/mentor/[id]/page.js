"use client";
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/services/apiClient';
import { useParams, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import toast from 'react-hot-toast';

export default function MentorProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState('services');

  const { data: mentorData, isLoading: mentorLoading } = useQuery({
    queryKey: ['mentor', id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/mentor/${id}`);
      return data;
    }
  });

  const { data: servicesData } = useQuery({
    queryKey: ['mentorServices', id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/mentor/${id}/services`);
      return data;
    }
  });

  const mentor = mentorData?.mentor;
  const services = servicesData?.services || [];

  if (mentorLoading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;
  }

  if (!mentor) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Mentor not found.</div>;
  }

  const handleBook = (serviceId) => {
    if (!user) {
      toast.error("Please login to book a session");
      router.push('/login');
      return;
    }
    router.push(`/checkout?mentorId=${id}&serviceId=${serviceId}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 pb-20">
      {/* Profile Header */}
      <div className="bg-slate-900 border-b border-slate-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 to-purple-900/20 pointer-events-none"></div>
        <div className="max-w-5xl mx-auto px-6 py-12 relative z-10">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl bg-slate-800 border-4 border-slate-700 shadow-2xl overflow-hidden flex-shrink-0">
              {mentor.user?.profilePicture ? (
                <img src={mentor.user.profilePicture} alt={mentor.user.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-5xl font-bold text-slate-500">
                  {mentor.user?.name?.charAt(0) || 'M'}
                </div>
              )}
            </div>
            
            <div className="text-center md:text-left flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{mentor.user?.name}</h1>
              <p className="text-xl text-blue-400 font-medium mb-1">{mentor.headline}</p>
              <p className="text-slate-400 mb-4">{mentor.role} @ {mentor.company} • {mentor.yearsOfExperience} YOE</p>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-6">
                <div className="flex items-center gap-1 bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700">
                  <span className="text-yellow-500">★</span>
                  <span className="font-bold text-white">{mentor.averageRating.toFixed(1)}</span>
                  <span className="text-xs text-slate-400">({mentor.totalReviews} Reviews)</span>
                </div>
                <div className="bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-2">
                  <span className="text-green-400">●</span>
                  <span className="text-sm font-medium text-white">{mentor.totalSessions} Sessions</span>
                </div>
              </div>

              <div className="flex flex-wrap justify-center md:justify-start gap-2">
                {mentor.skills.map(skill => (
                  <span key={skill} className="bg-slate-800 border border-slate-700 text-xs px-3 py-1.5 rounded-full text-slate-300">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex border-b border-slate-800 gap-8 mb-8">
          {['services', 'about', 'reviews'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 text-sm font-semibold capitalize transition-all border-b-2 ${activeTab === tab ? 'border-blue-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-300'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'services' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-up">
            {services.length === 0 ? (
              <p className="text-slate-400 col-span-2">This mentor hasn't added any services yet.</p>
            ) : (
              services.map(service => (
                <div key={service._id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col hover:border-slate-700 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-white">{service.title}</h3>
                    <div className="bg-green-500/10 text-green-400 px-3 py-1 rounded-lg font-bold">
                      ₹{service.price}
                    </div>
                  </div>
                  <p className="text-slate-400 text-sm mb-4 line-clamp-2 flex-1">{service.description}</p>
                  <div className="flex items-center gap-4 text-sm text-slate-500 mb-6">
                    <span>⏱ {service.duration} mins</span>
                    <span>📹 {service.meetingType === 'online' ? 'Video Call' : 'In Person'}</span>
                  </div>
                  <button onClick={() => handleBook(service._id)} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all active:scale-95 shadow-lg shadow-blue-500/20">
                    Book Session
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'about' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 animate-fade-up">
            <h3 className="text-xl font-bold text-white mb-4">About {mentor.user?.name}</h3>
            <p className="text-slate-400 whitespace-pre-wrap leading-relaxed">{mentor.about}</p>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="animate-fade-up">
            {/* Reviews fetched here typically, keeping simple for plan */}
            <p className="text-slate-400 bg-slate-900 p-8 border border-slate-800 rounded-2xl text-center">Reviews will be populated here as users complete sessions.</p>
          </div>
        )}
      </div>
    </div>
  );
}
