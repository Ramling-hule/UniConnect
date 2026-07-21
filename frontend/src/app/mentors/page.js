import Link from 'next/link';
import { GraduationCap, Star, Users, ChevronRight } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const metadata = {
  title: 'Find Expert Mentors | ProConnect',
  description: 'Browse approved mentors on ProConnect. Connect with industry experts for guidance, sessions, and career growth.',
  openGraph: {
    title: 'Find Expert Mentors | ProConnect',
    description: 'Browse approved mentors on ProConnect.',
    type: 'website',
  },
};

async function getMentors(page = 1) {
  try {
    const res = await fetch(`${API_URL}/api/public/mentors?page=${page}&limit=18`, {
      next: { revalidate: 120 },
    });
    if (!res.ok) return { mentors: [], pagination: {} };
    return res.json();
  } catch {
    return { mentors: [], pagination: {} };
  }
}

export default async function PublicMentorsPage({ searchParams }) {
  const page = parseInt((await searchParams)?.page) || 1;
  const { mentors, pagination } = await getMentors(page);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'ProConnect Mentors',
    numberOfItems: pagination.total ?? 0,
    itemListElement: (mentors ?? []).slice(0, 10).map((m, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Person',
        name: m.user?.name ?? 'Mentor',
        url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/mentors/${m.user?.username}`,
      },
    })),
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-16 pb-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center py-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-blue-50 border border-blue-200 text-blue-700 mb-6">
            <GraduationCap size={14} /> Expert Mentors
          </div>
          <h1 className="text-5xl font-extrabold text-slate-900 dark:text-white mb-4">Find Your Mentor</h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
            Connect with industry-approved experts to level up your skills, navigate your career, and build something great.
          </p>
        </div>

        {mentors && mentors.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {mentors.map((mentor) => (
              <Link
                key={mentor.id}
                href={`/mentors/${mentor.user?.username}`}
                className="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
              >
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={mentor.user?.profilePicture || '/default-avatar.png'}
                    alt={mentor.user?.name}
                    className="w-14 h-14 rounded-full object-cover border-2 border-blue-100"
                  />
                  <div>
                    <h2 className="font-bold text-slate-900 dark:text-white text-lg leading-tight group-hover:text-blue-600 transition-colors">
                      {mentor.user?.name}
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">@{mentor.user?.username}</p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-1">{mentor.role} @ {mentor.company}</p>
                <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 mb-4">{mentor.about}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {(mentor.skills ?? []).slice(0, 3).map(s => (
                    <span key={s} className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full">{s}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-4 border-t border-slate-100 dark:border-slate-700">
                  <span className="flex items-center gap-1"><Star size={12} className="text-yellow-500" /> {mentor.averageRating?.toFixed(1) ?? '0.0'}</span>
                  <span className="flex items-center gap-1"><Users size={12} /> {mentor.totalSessions} sessions</span>
                  <span className="text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1">View <ChevronRight size={12} /></span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 text-slate-500">No mentors found.</div>
        )}

        {pagination && pagination.pages > 1 && (
          <div className="flex justify-center gap-2 mt-12">
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
              <Link
                key={p}
                href={`/mentors?page=${p}`}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${p === page ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'}`}
              >
                {p}
              </Link>
            ))}
          </div>
        )}

        <div className="mt-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-10 text-center text-white">
          <h3 className="text-2xl font-bold mb-3">Are you an expert? Become a Mentor.</h3>
          <p className="text-blue-100 mb-6">Share your knowledge, earn from sessions, and help the next generation.</p>
          <Link href="/login" className="inline-block px-8 py-3 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-colors">
            Apply as Mentor
          </Link>
        </div>
      </div>
    </div>
  );
}
