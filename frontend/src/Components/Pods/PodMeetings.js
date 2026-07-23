"use client";
import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";

const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:6001";

export default function PodMeetings({ podId, isMentor }) {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(false);
  const { token } = useSelector((state) => state.auth);

  if (loading) return <div className="p-4 text-slate-400">Loading meetings...</div>;

  return (
    <div className="space-y-4">
      {isMentor && (
        <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition">
          Schedule Meeting
        </button>
      )}
      {meetings.length === 0 ? (
        <div className="text-center py-8 text-slate-500">No meetings scheduled.</div>
      ) : (
        meetings.map(meeting => (
          <div key={meeting._id} className="bg-slate-800 p-4 rounded-xl border border-slate-700">
            <h3 className="text-lg font-bold text-white">{meeting.title}</h3>
            <div className="mt-2 text-sm text-slate-400">
              {new Date(meeting.date).toLocaleDateString()} at {meeting.time}
            </div>
            <a 
              href={meeting.meetingLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="mt-4 inline-block bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
            >
              Join Meeting
            </a>
          </div>
        ))
      )}
    </div>
  );
}
