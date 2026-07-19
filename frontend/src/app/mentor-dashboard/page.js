"use client";
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import apiClient from '@/services/apiClient';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { extractErrorMessage } from '@/utils/errorHelper';

export default function MentorDashboardPage() {
  const { user } = useSelector((state) => state.auth);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');

  const [newService, setNewService] = useState({
    title: '', description: '', duration: 30, price: 500, meetingType: 'online'
  });

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['mentorDashboard'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/mentor/me/dashboard');
      return data;
    },
    enabled: !!user
  });

  const { data: profileData } = useQuery({
    queryKey: ['mentorProfile'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/mentor/me/profile');
      return data;
    },
    enabled: !!user
  });

  const { data: servicesData } = useQuery({
    queryKey: ['myServices'],
    queryFn: async () => {
      const mentorId = profileData?.mentor?._id;
      if (!mentorId) return { services: [] };
      const { data } = await apiClient.get(`/api/mentor/${mentorId}/services`);
      return data;
    },
    enabled: !!profileData?.mentor?._id
  });

  const createServiceMutation = useMutation({
    mutationFn: async (data) => {
      const { data: responseData } = await apiClient.post('/api/mentor/services', data);
      return responseData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myServices']);
      setNewService({ title: '', description: '', duration: 30, price: 500, meetingType: 'online' });
      toast.success("Service created!");
    },
    onError: (error) => {
      toast.error(extractErrorMessage(error, 'Failed to create service'));
    }
  });

  if (!user) return <div className="min-h-screen bg-slate-950 flex justify-center items-center text-white">Please login.</div>;
  if (isLoading) return <div className="min-h-screen bg-slate-950 flex justify-center items-center text-white">Loading Dashboard...</div>;

  const analytics = dashboardData?.analytics || { totalEarnings: 0, totalSessions: 0, averageRating: 0 };
  const todaysBookings = dashboardData?.todaysBookings || [];
  const upcomingBookings = dashboardData?.upcomingBookings || [];
  const services = servicesData?.services || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Top Navbar */}
      <div className="bg-slate-900 border-b border-slate-800 p-6 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Mentor Dashboard</h1>
            <p className="text-sm text-slate-400">Welcome back, {user.name}</p>
          </div>
          <div className="flex gap-4 bg-slate-800 p-1 rounded-xl">
            {['overview', 'services', 'bookings'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${activeTab === tab ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 mt-6">
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="animate-fade-up space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 blur-xl rounded-full"></div>
                <p className="text-slate-400 font-medium mb-2">Total Earnings</p>
                <h3 className="text-3xl font-black text-white">₹{analytics.totalEarnings}</h3>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 blur-xl rounded-full"></div>
                <p className="text-slate-400 font-medium mb-2">Completed Sessions</p>
                <h3 className="text-3xl font-black text-white">{analytics.totalSessions}</h3>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/10 blur-xl rounded-full"></div>
                <p className="text-slate-400 font-medium mb-2">Average Rating</p>
                <h3 className="text-3xl font-black text-white">{analytics.averageRating.toFixed(1)} ★</h3>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-6">Today's Sessions</h2>
              {todaysBookings.length === 0 ? (
                <p className="text-slate-500">No sessions scheduled for today.</p>
              ) : (
                <div className="space-y-4">
                  {todaysBookings.map(b => (
                    <div key={b._id} className="flex items-center justify-between bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                      <div className="flex items-center gap-4">
                        <img src={b.user?.profilePicture || 'https://via.placeholder.com/40'} className="w-10 h-10 rounded-full" alt="User" />
                        <div>
                          <p className="font-bold text-white">{b.user?.name}</p>
                          <p className="text-sm text-slate-400">{b.service?.title} • {b.startTime}</p>
                        </div>
                      </div>
                      <a href={b.meetingLink} target="_blank" rel="noreferrer" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold text-sm">Join Call</a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* SERVICES TAB */}
        {activeTab === 'services' && (
          <div className="animate-fade-up grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-xl font-bold text-white mb-4">My Services</h2>
              {services.map(s => (
                <div key={s._id} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-white text-lg">{s.title}</h3>
                    <p className="text-sm text-slate-400">{s.duration} mins • ₹{s.price}</p>
                  </div>
                  <button className="text-red-400 hover:text-red-300 text-sm font-semibold">Delete</button>
                </div>
              ))}
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl h-fit">
              <h2 className="text-xl font-bold text-white mb-4">Create New Service</h2>
              <form onSubmit={(e) => { e.preventDefault(); createServiceMutation.mutate(newService); }} className="space-y-4">
                <input required placeholder="Service Title" value={newService.title} onChange={e=>setNewService({...newService, title: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                <textarea required placeholder="Description" rows="2" value={newService.description} onChange={e=>setNewService({...newService, description: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"></textarea>
                <div className="grid grid-cols-2 gap-2">
                  <input required type="number" placeholder="Duration (mins)" value={newService.duration} onChange={e=>setNewService({...newService, duration: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                  <input required type="number" placeholder="Price (₹)" value={newService.price} onChange={e=>setNewService({...newService, price: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                </div>
                <button disabled={createServiceMutation.isPending} type="submit" className="w-full bg-blue-600 text-white font-bold py-2 rounded-xl text-sm">Add Service</button>
              </form>
            </div>
          </div>
        )}

        {/* BOOKINGS TAB */}
        {activeTab === 'bookings' && (
          <div className="animate-fade-up bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-6">Upcoming Bookings</h2>
            {upcomingBookings.length === 0 ? (
              <p className="text-slate-500">No upcoming bookings.</p>
            ) : (
              <div className="space-y-4">
                {upcomingBookings.map(b => (
                  <div key={b._id} className="flex items-center justify-between bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                    <div className="flex items-center gap-4">
                      <img src={b.user?.profilePicture || 'https://via.placeholder.com/40'} className="w-10 h-10 rounded-full" alt="User" />
                      <div>
                        <p className="font-bold text-white">{b.user?.name}</p>
                        <p className="text-sm text-slate-400">{b.service?.title} • {new Date(b.date).toLocaleDateString()} at {b.startTime}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-green-400 font-bold text-sm">₹{b.amount - b.platformFee}</p>
                      <p className="text-slate-500 text-xs text-uppercase">{b.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
