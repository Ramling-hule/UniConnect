import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Star, Users, Briefcase, Globe, Github, Linkedin, ChevronRight } from 'lucide-react';

const API_URL  = process.env.NEXT_PUBLIC_API_URL  || 'http://localhost:5000';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

async function getMentor(username) {
  try {
    const res = await fetch(`${API_URL}/api/public/mentors/${username}`, {
      next: { revalidate: 120 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export async function generateMetadata({ params }) {
  const { username } = await params;
  const mentor = await getMentor(username);
  if (!mentor) return { title: 'Mentor Not Found | ProConnect' };

  const name = mentor.user?.name ?? username;
  const title = `${name} | ${mentor.role ?? 'Mentor'} at ${mentor.company ?? 'ProConnect'}`;
  const description = mentor.about?.slice(0, 160) ?? `View ${name}'s mentor profile on ProConnect.`;

  return {
    title,
    description,
    openGraph: { title, description, type: 'profile', url: `${SITE_URL}/mentors/${username}`,
      images: [{ url: mentor.user?.profilePicture || '/default-avatar.png', width: 400, height: 400 }] },
    twitter: { card: 'summary', title, description, images: [mentor.user?.profilePicture || '/default-avatar.png'] },
  };
}

export default async function PublicMentorPage({ params }) {
  const { username } = await params;
  const mentor = await getMentor(username);
  if (!mentor) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: mentor.user?.name,
    jobTitle: mentor.role,
    worksFor: { '@type': 'Organization', name: mentor.company },
    url: `${SITE_URL}/mentors/${username}`,
    image: mentor.user?.profilePicture,
    description: mentor.about,
    knowsAbout: mentor.skills,
    sameAs: [mentor.linkedin, mentor.github, mentor.portfolio].filter(Boolean),
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 pt-20">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600" />
        <div className="px-6 pb-6">
          <div className="flex justify-between items-end -mt-12 mb-4">
            <img src={mentor.user?.profilePicture || '/default-avatar.png'} alt={mentor.user?.name}
              className="w-24 h-24 rounded-full border-4 border-white dark:border-slate-800 object-cover" />
            <Link href={`/login?callbackUrl=/mentors/${username}`}
              className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700 transition-colors text-sm">
              Book a Session
            </Link>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">{mentor.user?.name}</h1>
          <p className="text-blue-600 dark:text-blue-400 font-semibold">{mentor.role} @ {mentor.company}</p>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">{mentor.yearsOfExperience} years of experience</p>

          {/* Stats */}
          <div className="flex gap-6 mt-4">
            <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
              <Star size={15} className="text-yellow-500" />
              <span className="font-bold">{mentor.averageRating?.toFixed(1)}</span>
              <span className="text-slate-400">({mentor.totalReviews} reviews)</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-300">
              <Users size={15} className="text-blue-500" />
              <span className="font-bold">{mentor.totalSessions}</span>
              <span className="text-slate-400">sessions</span>
            </div>
          </div>

          {/* Socials */}
          <div className="flex gap-3 mt-4">
            {mentor.linkedin  && <a href={mentor.linkedin}  target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-blue-600 transition-colors"><Linkedin size={20} /></a>}
            {mentor.github    && <a href={mentor.github}    target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"><Github size={20} /></a>}
            {mentor.portfolio && <a href={mentor.portfolio} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-green-600 transition-colors"><Globe size={20} /></a>}
          </div>
        </div>
      </div>

      {/* About */}
      {mentor.about && (
        <div className="mt-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3">About</h2>
          <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{mentor.about}</p>
        </div>
      )}

      {/* Skills */}
      {mentor.skills?.length > 0 && (
        <div className="mt-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Skills & Expertise</h2>
          <div className="flex flex-wrap gap-2">
            {mentor.skills.map(s => (
              <span key={s} className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* Login CTA */}
      <div className="mt-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-center text-white">
        <h3 className="text-xl font-bold mb-2">Ready to learn from {mentor.user?.name}?</h3>
        <p className="text-blue-100 mb-5">Sign in to book a session, send a message, or save this mentor.</p>
        <Link href={`/login?callbackUrl=/mentors/${username}`}
          className="inline-block px-8 py-3 bg-white text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition-colors">
          Sign In to Book
        </Link>
      </div>
    </div>
  );
}
