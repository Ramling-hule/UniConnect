'use client';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Plus, Trash2, Loader2, Upload, ChevronDown } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7000';

const inputClass = "w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all";
const labelClass = "block text-sm font-semibold text-slate-300 mb-1.5";

const Section = ({ title, children }) => (
  <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 space-y-4">
    <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3">{title}</h2>
    {children}
  </div>
);

export default function CreateHackathonPage() {
  const { user }   = useSelector(state => state.auth);
  const router     = useRouter();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: '', description: '', tagline: '', category: 'Open Innovation',
    skills: '', mode: 'online', difficulty: 'open',
    minTeamSize: 1, maxTeamSize: 4, soloAllowed: true,
    isFree: true, registrationFee: 0, maxParticipants: '',
    waitlistEnabled: false, approvalRequired: false,
    timeline: {
      registrationOpen: '', registrationClose: '',
      hackathonStart: '', hackathonEnd: '', resultAnnouncement: '',
    },
    rules: [''],
    prizes: [{ rank: '1st', title: 'First Prize', amount: '', description: '' }],
    tracks: [{ name: '', description: '', skills: '' }],
    faqs: [{ question: '', answer: '' }],
    status: 'draft',
  });

  const update = (field, value) => setForm(f => ({ ...f, [field]: value }));
  const updateTimeline = (field, value) => setForm(f => ({ ...f, timeline: { ...f.timeline, [field]: value } }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.isOrganizer) { toast.error('Only verified organizers can create hackathons'); return; }
    setLoading(true);
    try {
      const payload = {
        ...form,
        skills:  form.skills.split(',').map(s => s.trim()).filter(Boolean),
        prizes:  form.prizes.map(p => ({ ...p, amount: Number(p.amount) })),
        tracks:  form.tracks.map(t => ({ ...t, skills: t.skills.split(',').map(s => s.trim()).filter(Boolean) })),
        rules:   form.rules.filter(Boolean),
        registrationFee: Number(form.registrationFee),
        maxParticipants: form.maxParticipants ? Number(form.maxParticipants) : null,
      };

      const res  = await fetch(`${API_BASE_URL}/api/hackathons`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        toast.success('Hackathon created! 🎉');
        router.push(`/hackathons/${data.hackathon.slug}`);
      } else {
        toast.error(data.message || 'Failed to create hackathon');
      }
    } catch { toast.error('Something went wrong'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold text-white mb-2">Create a Hackathon</h1>
          <p className="text-slate-400">Fill in the details to publish your hackathon on ProConnect.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Basic Info */}
          <Section title="Basic Information">
            <div>
              <label className={labelClass}>Title *</label>
              <input className={inputClass} required placeholder="e.g. HackIndia 2025" value={form.title} onChange={e => update('title', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Tagline</label>
              <input className={inputClass} placeholder="One-line description" value={form.tagline} onChange={e => update('tagline', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Description *</label>
              <textarea className={`${inputClass} min-h-32 resize-y`} required placeholder="Tell participants what this hackathon is about..." value={form.description} onChange={e => update('description', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Category</label>
                <select className={inputClass} value={form.category} onChange={e => update('category', e.target.value)}>
                  {['Web Dev','AI/ML','Blockchain','Mobile','Cybersecurity','Open Innovation'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Mode</label>
                <select className={inputClass} value={form.mode} onChange={e => update('mode', e.target.value)}>
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
            </div>
            <div>
              <label className={labelClass}>Skills (comma-separated)</label>
              <input className={inputClass} placeholder="React, Node.js, Python, ML" value={form.skills} onChange={e => update('skills', e.target.value)} />
            </div>
          </Section>

          {/* Team Config */}
          <Section title="Team Configuration">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Min Team Size</label>
                <input type="number" min="1" className={inputClass} value={form.minTeamSize} onChange={e => update('minTeamSize', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Max Team Size</label>
                <input type="number" min="1" className={inputClass} value={form.maxTeamSize} onChange={e => update('maxTeamSize', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Max Participants</label>
                <input type="number" className={inputClass} placeholder="Leave empty for unlimited" value={form.maxParticipants} onChange={e => update('maxParticipants', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Difficulty</label>
                <select className={inputClass} value={form.difficulty} onChange={e => update('difficulty', e.target.value)}>
                  {['beginner','intermediate','advanced','open'].map(d => <option key={d} value={d} className="capitalize">{d}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.soloAllowed} onChange={e => update('soloAllowed', e.target.checked)} className="rounded accent-indigo-500 w-4 h-4" />
                <span className="text-slate-300 text-sm">Solo participation allowed</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.waitlistEnabled} onChange={e => update('waitlistEnabled', e.target.checked)} className="rounded accent-indigo-500 w-4 h-4" />
                <span className="text-slate-300 text-sm">Enable waitlist</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.approvalRequired} onChange={e => update('approvalRequired', e.target.checked)} className="rounded accent-indigo-500 w-4 h-4" />
                <span className="text-slate-300 text-sm">Approval required</span>
              </label>
            </div>
          </Section>

          {/* Payment */}
          <Section title="Registration & Payment">
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="fee" checked={form.isFree} onChange={() => update('isFree', true)} className="accent-indigo-500 w-4 h-4" />
                <span className="text-slate-300 text-sm font-semibold">Free</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="fee" checked={!form.isFree} onChange={() => update('isFree', false)} className="accent-indigo-500 w-4 h-4" />
                <span className="text-slate-300 text-sm font-semibold">Paid</span>
              </label>
            </div>
            {!form.isFree && (
              <div>
                <label className={labelClass}>Registration Fee (₹)</label>
                <input type="number" min="0" className={inputClass} value={form.registrationFee} onChange={e => update('registrationFee', e.target.value)} />
              </div>
            )}
          </Section>

          {/* Timeline */}
          <Section title="Timeline">
            {[
              { key: 'registrationOpen',   label: 'Registration Opens *' },
              { key: 'registrationClose',  label: 'Registration Closes *' },
              { key: 'hackathonStart',     label: 'Hackathon Starts *' },
              { key: 'hackathonEnd',       label: 'Hackathon Ends *' },
              { key: 'resultAnnouncement', label: 'Results Announcement' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className={labelClass}>{label}</label>
                <input type="datetime-local" className={inputClass} value={form.timeline[key]} onChange={e => updateTimeline(key, e.target.value)} required={!key.includes('result')} />
              </div>
            ))}
          </Section>

          {/* Prizes */}
          <Section title="Prizes">
            {form.prizes.map((prize, i) => (
              <div key={i} className="grid grid-cols-2 gap-3 bg-slate-800/50 rounded-xl p-4 relative">
                <input className={inputClass} placeholder="Rank (e.g. 1st)" value={prize.rank} onChange={e => { const p = [...form.prizes]; p[i].rank = e.target.value; update('prizes', p); }} />
                <input className={inputClass} placeholder="Title (e.g. Best AI)" value={prize.title} onChange={e => { const p = [...form.prizes]; p[i].title = e.target.value; update('prizes', p); }} />
                <input type="number" className={inputClass} placeholder="Amount (₹)" value={prize.amount} onChange={e => { const p = [...form.prizes]; p[i].amount = e.target.value; update('prizes', p); }} />
                <input className={inputClass} placeholder="Description (optional)" value={prize.description} onChange={e => { const p = [...form.prizes]; p[i].description = e.target.value; update('prizes', p); }} />
                {form.prizes.length > 1 && (
                  <button type="button" onClick={() => update('prizes', form.prizes.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 p-1 text-slate-500 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => update('prizes', [...form.prizes, { rank: '', title: '', amount: '', description: '' }])} className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm font-semibold transition-colors">
              <Plus className="w-4 h-4" /> Add Prize
            </button>
          </Section>

          {/* Rules */}
          <Section title="Rules">
            {form.rules.map((rule, i) => (
              <div key={i} className="flex gap-2">
                <input className={inputClass} placeholder={`Rule ${i + 1}`} value={rule} onChange={e => { const r = [...form.rules]; r[i] = e.target.value; update('rules', r); }} />
                {form.rules.length > 1 && (
                  <button type="button" onClick={() => update('rules', form.rules.filter((_, idx) => idx !== i))} className="text-slate-500 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={() => update('rules', [...form.rules, ''])} className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm font-semibold transition-colors">
              <Plus className="w-4 h-4" /> Add Rule
            </button>
          </Section>

          {/* Status */}
          <Section title="Visibility">
            <div className="flex gap-4">
              {['draft', 'published'].map(s => (
                <label key={s} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="status" value={s} checked={form.status === s} onChange={() => update('status', s)} className="accent-indigo-500 w-4 h-4" />
                  <span className="text-slate-300 text-sm font-semibold capitalize">{s}</span>
                </label>
              ))}
            </div>
            <p className="text-slate-500 text-xs">Published hackathons are visible to all users. Drafts are only visible to you.</p>
          </Section>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg shadow-indigo-500/20"
          >
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Creating...</> : '🚀 Create Hackathon'}
          </button>
        </form>
      </div>
    </div>
  );
}
