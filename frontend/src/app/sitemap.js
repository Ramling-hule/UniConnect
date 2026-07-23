const API_URL  = process.env.NEXT_PUBLIC_API_URL  || 'http://localhost:6001';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export default async function sitemap() {
  let data = { users: [], posts: [], hackathons: [], groups: [] };

  try {
    const res = await fetch(`${API_URL}/api/public/sitemap`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) data = await res.json();
  } catch (err) {
    console.error('Sitemap fetch failed:', err.message);
  }

  const staticRoutes = [
    { url: SITE_URL,               lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
    { url: `${SITE_URL}/mentors`,  lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
    { url: `${SITE_URL}/hackathons`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
  ];

  const userRoutes = (data.users || []).map(u => ({
    url:             `${SITE_URL}/u/${u.username}`,
    lastModified:    new Date(u.updatedAt),
    changeFrequency: 'weekly',
    priority:        0.8,
  }));

  const hackathonRoutes = (data.hackathons || []).map(h => ({
    url:             `${SITE_URL}/hackathons/${h.slug}`,
    lastModified:    new Date(h.updatedAt),
    changeFrequency: 'weekly',
    priority:        0.8,
  }));

  const postRoutes = (data.posts || []).map(p => ({
    url:             `${SITE_URL}/post/${p.id}`,
    lastModified:    new Date(p.updatedAt),
    changeFrequency: 'monthly',
    priority:        0.6,
  }));

  const groupRoutes = (data.groups || []).map(g => ({
    url:             `${SITE_URL}/group/${g.id}`,
    lastModified:    new Date(g.updatedAt),
    changeFrequency: 'weekly',
    priority:        0.7,
  }));

  return [...staticRoutes, ...userRoutes, ...hackathonRoutes, ...postRoutes, ...groupRoutes];
}
