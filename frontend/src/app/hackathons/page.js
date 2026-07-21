import Link from 'next/link';
import { Trophy, Calendar, Users, Globe, Wifi, Cpu, ChevronRight } from 'lucide-react';

const API_URL  = process.env.NEXT_PUBLIC_API_URL  || 'http://localhost:5000';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const metadata = {
  title: 'Hackathons | ProConnect',
  description: 'Discover the latest hackathons on ProConnect. Register, form teams, and compete with top students and developers.',
  openGraph: {
    title: 'Hackathons | ProConnect',
    description: 'Discover hackathons, form teams, and compete.',
    type: 'website',
    url: `${SITE_URL}/hackathons`,
  },
};

async function getHackathons(page = 1) {
  try {
    const res = await fetch(`${API_URL}/api/public/hackathons?page=${page}&limit=12`, {
      next: { revalidate: 120 },
    });
    if (!res.ok) return { hackathons: [], pagination: {} };
    return res.json();
  } catch { return { hackathons: [], pagination: {} }; }
}

const ModeIcon = ({ mode }) => {
  if (mode === 'online') return <Wifi size={13} />;
  if (mode === 'offline') return <Globe size={13} />;
  return <Cpu size={13} />;
};

const statusColor = (status) => {
  if (status === 'ongoing')   return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
  if (status === 'published') return 'bg-blue-100  text-blue-700  dark:bg-blue-900/30  dark:text-blue-400';
  return 'bg-slate-100 text-slate-600';
};

export default async function PublicHackathonsPage({ searchParams }) {
  const page = parseInt((await searchParams)?.page) || 1;
  const { hackathons, pagination } = await getHackathons(page);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'ProConnect Hackathons',
    numberOfItems: pagination.total ?? 0,
    itemListElement: (hackathons ?? []).slice(0, 10).map((h, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Event',
        name: h.title,
        url: `${SITE_URL}/hackathons/${h.slug}`,
        startDate: h.timeline?.hackathonStart,
        endDate:   h.timeline?.hackathonEnd,
      },
    })),
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-16 pb-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="text-center py-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-orange-50 border border-orange-200 text-orange-700 mb-6">
            <Trophy size={14} /> Live Hackathons
          </div>
          <h1 className="text-5xl font-extrabold text-slate-900 dark:text-white mb-4">Discover Hackathons</h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            Register, form a team, and compete in the latest hackathons across AI, Web3, and more.
          </p>
        </div>

        {/* Grid */}
        {hackathons && hackathons.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hackathons.map((h) => (
              <Link
                key={h.id}
                href={`/hackathons/${h.slug}`}
                className="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
              >
                {h.banner ? (
                  <img src={h.banner} alt={h.title} className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 bg-gradient-to-br from-orange-500 to-pink-600" />
                )}
                <div className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${statusColor(h.status)}`}>{h.status}</span>
                    <span className="flex items-center gap-1 text-xs text-slate-400 capitalize"><ModeIcon mode={h.mode} /> {h.mode}</span>
                  </div>
                  <h2 className="font-bold text-slate-900 dark:text-white text-lg leading-tight group-hover:text-blue-600 transition-colors line-clamp-2 mb-1">
                    {h.title}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">{h.tagline || h.description}</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {(h.skills ?? []).slice(0, 3).map(s => (
                      <span key={s} className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">{s}</span>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-700">
                    <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(h.timeline?.hackathonStart).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><Users size={12} /> {h.registrationCount} registered</span>
                    <span className={`font-bold ${h.isFree ? 'text-green-600' : 'text-slate-700 dark:text-slate-300'}`}>
                      {h.isFree ? 'Free' : `₹${h.registrationFee}`}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 text-slate-500">No hackathons available right now. Check back soon!</div>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex justify-center gap-2 mt-12">
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
              <Link key={p} href={`/hackathons?page=${p}`}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${p === page ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'}`}>
                {p}
              </Link>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-16 bg-gradient-to-r from-orange-500 to-pink-600 rounded-2xl p-10 text-center text-white">
          <h3 className="text-2xl font-bold mb-3">Want to host a Hackathon?</h3>
          <p className="text-orange-100 mb-6">Organizers can create and manage hackathons directly on ProConnect.</p>
          <Link href="/login" className="inline-block px-8 py-3 bg-white text-orange-600 font-bold rounded-xl hover:bg-orange-50 transition-colors">
            Get Organizer Access
          </Link>
        </div>
      </div>
    </div>
  );
}
