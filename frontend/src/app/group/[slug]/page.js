import { notFound } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

async function getGroup(slug) {
  try {
    const res = await fetch(`${API_URL}/api/public/group/${slug}`, {
      next: { revalidate: 60 }
    });
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const group = await getGroup(slug);

  if (!group) {
    return { title: 'Group Not Found | ProConnect' };
  }

  const title = `${group.name} | Groups | ProConnect`;
  const description = group.description || `Join ${group.name} on ProConnect.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/group/${slug}`,
      images: [
        {
          url: group.image || '/default-group.png',
          width: 800,
          height: 400,
          alt: `${group.name} Cover Image`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [group.image || '/default-group.png'],
    },
  };
}

export default async function PublicGroupPage({ params }) {
  const { slug } = await params;
  const group = await getGroup(slug);

  if (!group) {
    notFound();
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: group.name,
    description: group.description,
    url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/group/${slug}`,
    logo: group.image || '/default-group.png',
    member: {
        '@type': 'OrganizationRole',
        member: {
            '@type': 'Person',
            name: `${group.memberCount} members`
        }
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 mt-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="h-48 w-full bg-gray-200 dark:bg-gray-700 relative">
          {group.image ? (
            <img src={group.image} alt={group.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-green-500 to-teal-600"></div>
          )}
        </div>
        
        <div className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{group.name}</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">{group.memberCount} members</p>
              {group.institute && (
                <p className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  {group.institute}
                </p>
              )}
            </div>
            <Link 
              href={`/login?callbackUrl=/group/${slug}`}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full transition-colors"
            >
              Join Group
            </Link>
          </div>

          <div className="mt-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">About this group</h2>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{group.description || "No description provided."}</p>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 text-center">
        <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100">Want to see posts in this group?</h3>
        <p className="text-blue-700 dark:text-blue-300 mt-2 mb-4">
          Join ProConnect to participate in group discussions, share posts, and connect with members.
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
