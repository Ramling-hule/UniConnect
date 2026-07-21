import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Trophy, Calendar, Users, Wifi, Globe, Clock, Cpu } from 'lucide-react';

const API_URL  = process.env.NEXT_PUBLIC_API_URL  || 'http://localhost:5000';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

async function getHackathon(slug) {
  try {
    const res = await fetch(`${API_URL}/api/public/hackathons/${slug}`, {
      next: { revalidate: 120 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const h = await getHackathon(slug);
  if (!h) return { title: 'Hackathon Not Found | ProConnect' };

  const title = `${h.title} | ProConnect Hackathon`;
  const description = h.tagline || h.description?.slice(0, 160) || '';

  return {
    title,
    description,
    openGraph: {
      title, description, type: 'website',
      url: `${SITE_URL}/hackathons/${slug}`,
      images: [{ url: h.banner || '/default-hackathon.png', width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [h.banner || '/default-hackathon.png'] },
  };
}

export default async function PublicHackathonDetailPage({ params }) {
  const { slug } = await params;
  const h = await getHackathon(slug);
  if (!h) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: h.title,
    description: h.description,
    image: h.banner,
    url: `${SITE_URL}/hackathons/${slug}`,
    startDate: h.timeline?.hackathonStart,
    endDate:   h.timeline?.hackathonEnd,
    eventAttendanceMode: h.mode === 'online'
      ? 'https://schema.org/OnlineEventAttendanceMode'
      : 'https://schema.org/OfflineEventAttendanceMode',
    isAccessibleForFree: h.isFree,
    offers: { '@type': 'Offer', price: h.isFree ? 0 : h.registrationFee, priceCurrency: h.currency ?? 'INR' },
    organizer: h.organizer ? {
      '@type': 'Person',
      name: h.organizer.name,
      url: h.organizer.username ? `${SITE_URL}/u/${h.organizer.username}` : undefined,
    } : undefined,
  };

  const regClose  = h.timeline?.registrationClose ? new Date(h.timeline.registrationClose) : null;
  const hackStart = h.timeline?.hackathonStart    ? new Date(h.timeline.hackathonStart)    : null;
  const hackEnd   = h.timeline?.hackathonEnd      ? new Date(h.timeline.hackathonEnd)      : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Banner */}
      <div className="relative w-full h-72 md:h-96 bg-gradient-to-br from-orange-500 to-pink-600 overflow-hidden">
        {h.banner && <img src={h.banner} alt={h.title} className="w-full h-full object-cover opacity-80" />}
        <div className="absolute inset-0 bg-black/40 flex flex-col justify-end p-8">
          {h.isFeatured && (
            <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-yellow-400 text-yellow-900 mb-3 w-fit">
              <Trophy size={12} /> Featured
            </span>
          )}
          <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight">{h.title}</h1>
          {h.tagline && <p className="text-white/80 mt-2 text-lg">{h.tagline}</p>}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 md:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">About</h2>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{h.description}</p>
            </div>

            {h.tracks?.length > 0 && (
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Tracks</h2>
                <div className="space-y-3">
                  {h.tracks.map((t, i) => (
                    <div key={i} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                      <h3 className="font-semibold text-slate-800 dark:text-white">{t.name}</h3>
                      {t.description && <p className="text-sm text-slate-500 mt-1">{t.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {h.prizes?.length > 0 && (
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">🏆 Prizes</h2>
                <div className="space-y-2">
                  {h.prizes.map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-xl border border-yellow-100 dark:border-yellow-800">
                      <span className="font-bold text-slate-900 dark:text-white">{p.rank} — {p.title}</span>
                      {p.amount > 0 && <span className="font-black text-green-600">₹{p.amount.toLocaleString()}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {h.faqs?.length > 0 && (
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">FAQs</h2>
                <div className="space-y-4">
                  {h.faqs.map((f, i) => (
                    <div key={i}>
                      <h3 className="font-semibold text-slate-800 dark:text-white">{f.question}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{f.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm sticky top-6">
              <p className="font-black text-2xl text-slate-900 dark:text-white mb-4">
                {h.isFree ? <span className="text-green-600">Free</span> : `₹${h.registrationFee}`}
              </p>
              <Link href={`/login?callbackUrl=/hackathons/${slug}`}
                className="block w-full text-center px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors mb-4">
                Register Now
              </Link>
              <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                {regClose  && <div className="flex items-center gap-2"><Calendar size={14} /> Reg. closes: {regClose.toLocaleDateString()}</div>}
                {hackStart && <div className="flex items-center gap-2"><Clock size={14} /> Starts: {hackStart.toLocaleDateString()}</div>}
                {hackEnd   && <div className="flex items-center gap-2"><Clock size={14} /> Ends: {hackEnd.toLocaleDateString()}</div>}
                <div className="flex items-center gap-2"><Users size={14} /> Team: {h.minTeamSize}–{h.maxTeamSize}</div>
                <div className="flex items-center gap-2"><Users size={14} /> {h.registrationCount} registered</div>
              </div>
            </div>

            {h.skills?.length > 0 && (
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5">
                <h3 className="font-bold text-slate-900 dark:text-white mb-3">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {h.skills.map(s => <span key={s} className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">{s}</span>)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
