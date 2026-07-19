'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import Link from 'next/link';
import { Search, Filter, Trophy, Users, Calendar, Tag, ChevronRight, Loader2, Zap, Globe, Wifi } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7000';

const CATEGORIES = ['All', 'Web Dev', 'AI/ML', 'Blockchain', 'Mobile', 'Cybersecurity', 'Open Innovation'];
const MODES      = ['All', 'online', 'offline', 'hybrid'];
const DIFFICULTY = ['All', 'beginner', 'intermediate', 'advanced', 'open'];

const ModeIcon = ({ mode }) => {
  if (mode === 'online')  return <Wifi className="w-3 h-3" />;
  if (mode === 'offline') return <Globe className="w-3 h-3" />;
  return <Zap className="w-3 h-3" />;
};

const HackathonCard = ({ hackathon }) => {
  const deadline = new Date(hackathon.timeline?.registrationClose);
  const isOpen   = hackathon.timeline?.registrationClose > Date.now();
  const daysLeft = Math.max(0, Math.ceil((deadline - Date.now()) / 86400000));

  return (
    <Link href={`/hackathons/${hackathon.slug}`} className="group block">
      <div className="relative bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-indigo-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1">
        {/* Banner */}
        <div className="relative h-36 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 overflow-hidden">
          {hackathon.banner
            ? <img src={hackathon.banner} alt={hackathon.title} className="w-full h-full object-cover opacity-80" />
            : <div className="absolute inset-0 flex items-center justify-center opacity-20">
                <Trophy className="w-20 h-20 text-white" />
              </div>
          }
          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 ${isOpen ? 'bg-green-500/90 text-white' : 'bg-slate-700/90 text-slate-300'}`}>
              {isOpen ? `${daysLeft}d left` : 'Closed'}
            </span>
            {hackathon.isFree
              ? <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/90 text-white">FREE</span>
              : <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/90 text-white">₹{hackathon.registrationFee}</span>
            }
          </div>
          <div className="absolute top-3 right-3">
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-black/50 text-white flex items-center gap-1">
              <ModeIcon mode={hackathon.mode} /> {hackathon.mode}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="font-bold text-white text-lg leading-tight mb-1 group-hover:text-indigo-400 transition-colors line-clamp-2">
            {hackathon.title}
          </h3>
          <p className="text-slate-400 text-sm mb-4 line-clamp-2">{hackathon.description}</p>

          {/* Skills */}
          {hackathon.skills?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {hackathon.skills.slice(0, 4).map(s => (
                <span key={s} className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-md text-xs font-medium">{s}</span>
              ))}
              {hackathon.skills.length > 4 && (
                <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded-md text-xs">+{hackathon.skills.length - 4}</span>
              )}
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              <span>{hackathon.registrationCount || 0} registered</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              <span>{hackathon.minTeamSize}–{hackathon.maxTeamSize} members</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{new Date(hackathon.timeline?.hackathonStart).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
            </div>
          </div>
        </div>

        <div className="px-5 pb-4">
          <div className="flex items-center justify-between">
            {hackathon.prizes?.[0] && (
              <div className="flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span className="text-amber-400 font-bold text-sm">₹{hackathon.prizes[0].amount?.toLocaleString()}</span>
                <span className="text-slate-500 text-xs">top prize</span>
              </div>
            )}
            <span className="text-indigo-400 text-sm font-semibold flex items-center gap-1 ml-auto group-hover:gap-2 transition-all">
              View <ChevronRight className="w-4 h-4" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default function HackathonsPage() {
  const { user } = useSelector(state => state.auth);
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ category: 'All', mode: 'All', difficulty: 'All', isFree: '' });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchHackathons = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 12, search });
      if (filters.category !== 'All') params.set('category', filters.category);
      if (filters.mode      !== 'All') params.set('mode', filters.mode);
      if (filters.difficulty!== 'All') params.set('difficulty', filters.difficulty);
      if (filters.isFree)              params.set('isFree', filters.isFree);

      const res  = await fetch(`${API_BASE_URL}/api/hackathons?${params}`);
      const data = await res.json();
      if (data.success) {
        setHackathons(data.hackathons);
        setTotalPages(data.pages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search, filters]);

  useEffect(() => { fetchHackathons(); }, [fetchHackathons]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden bg-gradient-to-b from-indigo-950/50 to-slate-950 border-b border-slate-800/50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-600/20 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 py-16 relative">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium mb-4">
              <Trophy className="w-4 h-4" /> ProConnect Hackathons
            </span>
            <h1 className="text-5xl font-extrabold bg-gradient-to-r from-white via-indigo-200 to-purple-300 bg-clip-text text-transparent mb-4">
              Build. Compete. Win.
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Discover hackathons, find your dream team, and build projects that matter.
            </p>
          </div>

          {/* Search */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search hackathons, skills, categories..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-12 pr-4 py-4 bg-slate-900 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-base transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* ── Filters ── */}
        <div className="flex flex-wrap gap-3 mb-8">
          {/* Category */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => { setFilters(f => ({ ...f, category: cat })); setPage(1); }}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                  filters.category === cat
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Mode */}
          <select
            value={filters.mode}
            onChange={e => { setFilters(f => ({ ...f, mode: e.target.value })); setPage(1); }}
            className="px-4 py-1.5 rounded-full text-sm bg-slate-800 border border-slate-700 text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            {MODES.map(m => <option key={m} value={m}>{m === 'All' ? 'Mode: All' : m}</option>)}
          </select>

          {/* Difficulty */}
          <select
            value={filters.difficulty}
            onChange={e => { setFilters(f => ({ ...f, difficulty: e.target.value })); setPage(1); }}
            className="px-4 py-1.5 rounded-full text-sm bg-slate-800 border border-slate-700 text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            {DIFFICULTY.map(d => <option key={d} value={d}>{d === 'All' ? 'Level: All' : d}</option>)}
          </select>

          {/* Free only */}
          <button
            onClick={() => { setFilters(f => ({ ...f, isFree: f.isFree === 'true' ? '' : 'true' })); setPage(1); }}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
              filters.isFree === 'true' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            Free Only
          </button>

          {/* Organizer CTA */}
          {user?.isOrganizer && (
            <Link href="/hackathons/create" className="ml-auto px-5 py-1.5 rounded-full text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all flex items-center gap-2">
              + Create Hackathon
            </Link>
          )}
        </div>

        {/* ── Grid ── */}
        {loading ? (
          <div className="flex justify-center items-center py-32">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : hackathons.length === 0 ? (
          <div className="text-center py-24 text-slate-500">
            <Trophy className="w-14 h-14 mx-auto mb-4 opacity-20" />
            <p className="text-xl font-semibold">No hackathons found</p>
            <p className="text-sm mt-2">Try adjusting your filters or search query.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {hackathons.map(h => <HackathonCard key={h._id} hackathon={h} />)}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-10">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-5 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-semibold"
                >
                  Previous
                </button>
                <span className="px-5 py-2 text-slate-400 text-sm">Page {page} of {totalPages}</span>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="px-5 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-semibold"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
