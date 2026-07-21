import { notFound } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Server-side data fetching
async function getProfile(username) {
  try {
    const res = await fetch(`${API_URL}/api/public/profile/${username}`, {
      next: { revalidate: 60 } // ISR: revalidate every 60 seconds
    });
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    return null;
  }
}

// Generate Dynamic SEO Metadata
export async function generateMetadata({ params }) {
  const { username } = await params;
  const profile = await getProfile(username);

  if (!profile) {
    return { title: 'Profile Not Found | ProConnect' };
  }

  const title = `${profile.name} | ${profile.headline || 'Member'} | ProConnect`;
  const description = profile.about || `View ${profile.name}'s professional profile on ProConnect.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'profile',
      url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/u/${username}`,
      images: [
        {
          url: profile.profilePicture || '/default-avatar.png',
          width: 200,
          height: 200,
          alt: `${profile.name} Profile Picture`,
        },
      ],
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: [profile.profilePicture || '/default-avatar.png'],
    },
  };
}

export default async function PublicProfilePage({ params }) {
  const { username } = await params;
  const profile = await getProfile(username);

  if (!profile) {
    notFound();
  }

  // JSON-LD Structured Data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name,
    jobTitle: profile.headline,
    url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/u/${username}`,
    image: profile.profilePicture || '/default-avatar.png',
    description: profile.about,
    alumniOf: profile.instituteName || undefined,
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 mt-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Cover Photo Area - Defaulting to a gradient for now */}
        <div className="h-48 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
        
        <div className="px-6 pb-6">
          <div className="relative flex justify-between items-end -mt-16 mb-4">
            <img 
              src={profile.profilePicture || '/default-avatar.png'} 
              alt={profile.name}
              className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 object-cover bg-gray-100"
            />
            <Link 
              href={`/login?callbackUrl=/u/${username}`}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full transition-colors"
            >
              Connect
            </Link>
          </div>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{profile.name}</h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium">@{profile.username}</p>
            <p className="text-lg text-gray-800 dark:text-gray-200 mt-2">{profile.headline}</p>
            {profile.instituteName && (
              <p className="text-gray-600 dark:text-gray-400 mt-1 flex items-center">
                🎓 {profile.instituteName}
              </p>
            )}
          </div>
        </div>
      </div>

      {profile.about && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 mt-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">About</h2>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{profile.about}</p>
        </div>
      )}

      {profile.skills && profile.skills.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 mt-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill, index) => (
              <span key={index} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full text-sm font-medium">
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Login Prompt Banner */}
      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 text-center">
        <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100">Join ProConnect to see the full profile</h3>
        <p className="text-blue-700 dark:text-blue-300 mt-2 mb-4">
          Connect with {profile.name}, send messages, and view more details.
        </p>
        <Link 
          href="/login"
          className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full transition-colors"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}
