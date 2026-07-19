'use client';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Trophy, Users, Calendar, Clock, CheckCircle, Tag,
  Globe, Wifi, AlertTriangle, ChevronRight, Loader2,
  Github, ExternalLink, Share2, Bookmark,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7000';

export default function HackathonDetailPage() {
  const { slug }    = useParams();
  const router      = useRouter();
  const { user }    = useSelector(state => state.auth);
  const [hackathon, setHackathon] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [registering, setRegistering] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!slug) return;
    const fetchHackathon = async () => {
      try {
        const res  = await fetch(`${API_BASE_URL}/api/hackathons/${slug}`);
        const data = await res.json();
        if (data.success) setHackathon(data.hackathon);
        else toast.error('Hackathon not found');
      } catch { toast.error('Failed to load hackathon'); }
      finally { setLoading(false); }
    };
    fetchHackathon();
  }, [slug]);

  const handleRegister = async () => {
    if (!user) { router.push('/login'); return; }
    setRegistering(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/hackathons/${hackathon._id}/register`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Successfully registered! 🎉');
        setHackathon(prev => ({ ...prev, registrationCount: (prev.registrationCount || 0) + 1 }));
      } else {
        toast.error(data.message || 'Registration failed');
      }
    } catch { toast.error('Something went wrong'); }
    finally { setRegistering(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
    </div>
  );

  if (!hackathon) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
      <div className="text-center">
        <Trophy className="w-16 h-16 mx-auto mb-4 opacity-20" />
        <h2 className="text-2xl font-bold">Hackathon not found</h2>
        <Link href="/hackathons" className="mt-4 inline-block text-indigo-400 hover:underline">Browse all hackathons</Link>
      </div>
    </div>
  );

  const now              = new Date();
  const regClose         = new Date(hackathon.timeline?.registrationClose);
  const hackStart        = new Date(hackathon.timeline?.hackathonStart);
  const hackEnd          = new Date(hackathon.timeline?.hackathonEnd);
  const isRegOpen        = now >= new Date(hackathon.timeline?.registrationOpen) && now <= regClose;
  const daysLeft         = Math.max(0, Math.ceil((regClose - now) / 86400000));
  const isOrganizer      = user?._id === hackathon.organizer?._id;
  const TABS = ['overview', 'prizes', 'tracks', 'schedule', 'faqs'];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* ── Hero Banner ── */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        {hackathon.banner
          ? <img src={hackathon.banner} alt={hackathon.title} className="w-full h-full object-cover" />
          : <div className="w-full h-full bg-gradient-to-br from-indigo-700 via-purple-700 to-pink-700" />
        }
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

        {/* Action buttons */}
        <div className="absolute top-4 right-4 flex gap-2">
          <button className="p-2 rounded-xl bg-black/40 hover:bg-black/60 transition-all backdrop-blur-sm">
            <Share2 className="w-5 h-5 text-white" />
          </button>
          <button className="p-2 rounded-xl bg-black/40 hover:bg-black/60 transition-all backdrop-blur-sm">
            <Bookmark className="w-5 h-5 text-white" />
          </button>
          {isOrganizer && (
            <Link href={`/hackathons/${hackathon._id}/dashboard`} className="px-4 py-2 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 transition-all backdrop-blur-sm text-sm font-semibold flex items-center gap-2">
              Dashboard <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-16 relative">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Main Content ── */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <div className="flex flex-wrap gap-2 mb-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${isRegOpen ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-slate-800 text-slate-400'}`}>
                  {isRegOpen ? `${daysLeft}d left to register` : 'Registration Closed'}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {hackathon.category}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {hackathon.difficulty}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight mb-2">{hackathon.title}</h1>
              {hackathon.tagline && <p className="text-indigo-300 text-lg">{hackathon.tagline}</p>}

              {/* Organizer */}
              {hackathon.organizer && (
                <div className="flex items-center gap-3 mt-4">
                  <div className="w-8 h-8 rounded-full bg-indigo-600/30 flex items-center justify-center font-bold text-indigo-300 text-sm">
                    {hackathon.organizer.name?.[0]}
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Organized by</p>
                    <p className="text-sm font-semibold text-white">{hackathon.organizer.name}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-1 border-b border-slate-800 mb-6 overflow-x-auto">
              {TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 text-sm font-semibold capitalize whitespace-nowrap border-b-2 transition-all ${
                    activeTab === tab
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-slate-400 hover:text-slate-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="prose prose-invert prose-sm max-w-none">
                  <p className="text-slate-300 text-base leading-relaxed">{hackathon.description}</p>
                </div>
                {hackathon.rules?.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-white mb-3">Rules</h3>
                    <ul className="space-y-2">
                      {hackathon.rules.map((rule, i) => (
                        <li key={i} className="flex gap-3 text-slate-300 text-sm">
                          <CheckCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                          {rule}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {hackathon.skills?.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold text-white mb-3">Skills Needed</h3>
                    <div className="flex flex-wrap gap-2">
                      {hackathon.skills.map(s => (
                        <span key={s} className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-lg text-sm font-medium">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'prizes' && (
              <div className="space-y-4">
                {hackathon.prizes?.length > 0 ? hackathon.prizes.map((prize, i) => (
                  <div key={i} className="flex items-center gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg ${i === 0 ? 'bg-amber-500/20 text-amber-400' : i === 1 ? 'bg-slate-400/20 text-slate-300' : 'bg-orange-600/20 text-orange-400'}`}>
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-white">{prize.title}</p>
                      {prize.description && <p className="text-slate-400 text-sm">{prize.description}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-amber-400">₹{prize.amount?.toLocaleString()}</p>
                    </div>
                  </div>
                )) : <p className="text-slate-500 text-center py-12">Prize details coming soon</p>}
              </div>
            )}

            {activeTab === 'tracks' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {hackathon.tracks?.map((track, i) => (
                  <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                    <h4 className="font-bold text-white text-lg mb-2">{track.name}</h4>
                    {track.description && <p className="text-slate-400 text-sm mb-3">{track.description}</p>}
                    {track.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {track.skills.map(s => <span key={s} className="px-2 py-0.5 bg-indigo-500/10 text-indigo-300 rounded text-xs">{s}</span>)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'schedule' && (
              <div className="space-y-3">
                {[
                  { label: 'Registration Opens',  date: hackathon.timeline?.registrationOpen },
                  { label: 'Registration Closes', date: hackathon.timeline?.registrationClose },
                  { label: 'Hackathon Starts',    date: hackathon.timeline?.hackathonStart },
                  { label: 'Hackathon Ends',       date: hackathon.timeline?.hackathonEnd },
                  { label: 'Results',              date: hackathon.timeline?.resultAnnouncement },
                ].filter(e => e.date).map((event, i) => (
                  <div key={i} className="flex items-center gap-4 bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <Calendar className="w-5 h-5 text-indigo-400 shrink-0" />
                    <div>
                      <p className="font-semibold text-white">{event.label}</p>
                      <p className="text-slate-400 text-sm">{new Date(event.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'faqs' && (
              <div className="space-y-3">
                {hackathon.faqs?.length > 0 ? hackathon.faqs.map((faq, i) => (
                  <details key={i} className="group bg-slate-900 border border-slate-800 rounded-xl p-5 cursor-pointer">
                    <summary className="font-semibold text-white list-none flex justify-between items-center">
                      {faq.question}
                      <ChevronRight className="w-4 h-4 text-slate-400 group-open:rotate-90 transition-transform" />
                    </summary>
                    <p className="text-slate-400 text-sm mt-3 leading-relaxed">{faq.answer}</p>
                  </details>
                )) : <p className="text-slate-500 text-center py-12">No FAQs added yet</p>}
              </div>
            )}
          </div>

          {/* ── Sidebar ── */}
          <div className="space-y-4 lg:pt-4">
            {/* Registration Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sticky top-4">
              <div className="text-center mb-5">
                {hackathon.isFree
                  ? <div className="text-3xl font-black text-emerald-400 mb-1">FREE</div>
                  : <div className="text-3xl font-black text-white mb-1">₹{hackathon.registrationFee}</div>
                }
                <p className="text-slate-500 text-sm">per participant</p>
              </div>

              {isRegOpen ? (
                <button
                  onClick={handleRegister}
                  disabled={registering}
                  className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-base transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {registering ? <><Loader2 className="w-5 h-5 animate-spin" /> Registering...</> : 'Register Now'}
                </button>
              ) : (
                <div className="w-full py-3.5 rounded-xl bg-slate-800 text-slate-500 font-bold text-base text-center cursor-not-allowed">
                  Registration Closed
                </div>
              )}

              {isRegOpen && (
                <Link
                  href={`/hackathons/${hackathon._id}/teams`}
                  className="mt-3 w-full py-3.5 rounded-xl border border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/10 font-semibold text-base transition-all flex items-center justify-center gap-2"
                >
                  <Users className="w-5 h-5" /> Join a Team
                </Link>
              )}

              {/* Stats */}
              <div className="mt-5 pt-5 border-t border-slate-800 grid grid-cols-2 gap-3 text-sm text-slate-400">
                <div><span className="block text-white font-bold text-lg">{hackathon.registrationCount}</span>Registered</div>
                <div><span className="block text-white font-bold text-lg">{hackathon.minTeamSize}–{hackathon.maxTeamSize}</span>Team Size</div>
                <div><span className="block text-white font-bold text-lg capitalize">{hackathon.mode}</span>Mode</div>
                <div><span className="block text-white font-bold text-lg capitalize">{hackathon.difficulty}</span>Level</div>
              </div>
            </div>

            {/* Sponsors */}
            {hackathon.sponsors?.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <h4 className="font-bold text-white mb-3">Sponsors</h4>
                <div className="flex flex-wrap gap-3">
                  {hackathon.sponsors.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 bg-slate-800 rounded-xl px-3 py-2">
                      {s.logo && <img src={s.logo} alt={s.name} className="w-6 h-6 object-contain rounded" />}
                      <span className="text-sm font-semibold text-white">{s.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
