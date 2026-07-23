"use client";
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";

const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:6001";

export default function PodTasks({ podId, isMentor }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { token } = useSelector((state) => state.auth);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch(`${NEXT_PUBLIC_API_URL}/api/pods/${podId}/assignments`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setTasks(data.assignments || []);
        }
      } catch (err) {
        console.error("Failed to fetch tasks", err);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchTasks();
  }, [podId, token]);

  if (loading) return <div className="p-4 text-slate-400">Loading tasks...</div>;

  return (
    <div className="space-y-4">
      {isMentor && (
        <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition">
          Create New Task
        </button>
      )}
      {tasks.length === 0 ? (
        <div className="text-center py-8 text-slate-500">No tasks assigned yet.</div>
      ) : (
        tasks.map(task => (
          <div key={task._id} className="bg-slate-800 p-4 rounded-xl border border-slate-700">
            <h3 className="text-lg font-bold text-white">{task.title}</h3>
            <p className="text-slate-300 mt-2">{task.description}</p>
            <div className="mt-4 text-sm text-slate-400">
              Due: {new Date(task.dueDate).toLocaleDateString()} | Points: {task.totalPoints}
            </div>
            {!isMentor && (
              <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                Submit Assignment
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );
}
