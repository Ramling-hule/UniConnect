"use client";
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:6001";

export default function AdminPodsPage() {
  const [pods, setPods] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, token } = useSelector((state) => state.auth);
  const router = useRouter();

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    const fetchPods = async () => {
      try {
        const res = await fetch(`${NEXT_PUBLIC_API_URL}/api/pods/admin/all`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setPods(data.pods || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPods();
  }, [user, token, router]);

  if (loading) return <div className="text-white p-8">Loading admin pods...</div>;

  return (
    <div className="container mx-auto p-4 space-y-6 text-white max-w-5xl mt-12">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin: Pod Management</h1>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">Create New Pod</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {pods.map(pod => (
          <Card key={pod._id} className="p-4 bg-slate-800 border-slate-700">
            <h3 className="font-semibold text-lg">{pod.name}</h3>
            <p className="text-sm text-gray-400 mt-2">{pod.goal}</p>
            <div className="mt-4 text-xs text-gray-300">
              <p>Mentor: {pod.mentorId?.name || 'Unassigned'}</p>
              <p>Status: {pod.status}</p>
              <p>Capacity: {pod.minSize} - {pod.maxSize}</p>
            </div>
            <div className="mt-4">
              <Button variant="outline" className="w-full text-blue-400 border-blue-400 hover:bg-blue-900">
                Manage Students
              </Button>
            </div>
          </Card>
        ))}
        {pods.length === 0 && (
          <div className="col-span-full text-center py-8 text-gray-400">
            No pods found in the system.
          </div>
        )}
      </div>
    </div>
  );
}
