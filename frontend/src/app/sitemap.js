const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export default async function sitemap() {
  let sitemapData = { users: [], posts: [], groups: [] };

  try {
    const res = await fetch(`${API_URL}/api/public/sitemap`, { next: { revalidate: 3600 } }); // Revalidate every hour
    if (res.ok) {
      sitemapData = await res.json();
    }
  } catch (error) {
    console.error('Failed to fetch sitemap data', error);
  }

  const routes = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    }
  ];

  // Add Public Profiles
  if (sitemapData.users) {
    sitemapData.users.forEach(user => {
      routes.push({
        url: `${SITE_URL}/u/${user.username}`,
        lastModified: new Date(user.updatedAt),
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    });
  }

  // Add Public Posts
  if (sitemapData.posts) {
    sitemapData.posts.forEach(post => {
      routes.push({
        url: `${SITE_URL}/post/${post.id}`,
        lastModified: new Date(post.updatedAt),
        changeFrequency: 'monthly', // Posts don't change often
        priority: 0.6,
      });
    });
  }

  // Add Public Groups
  if (sitemapData.groups) {
    sitemapData.groups.forEach(group => {
      routes.push({
        url: `${SITE_URL}/group/${group.id}`,
        lastModified: new Date(group.updatedAt),
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    });
  }

  return routes;
}
