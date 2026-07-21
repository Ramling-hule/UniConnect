export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: ['/u/', '/post/', '/group/'],
      disallow: ['/feed', '/messages', '/settings', '/api/', '/notifications', '/dashboard'],
    },
    sitemap: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/sitemap.xml`,
  };
}
