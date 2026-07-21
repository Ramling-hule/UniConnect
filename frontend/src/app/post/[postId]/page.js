import { notFound } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

async function getPost(postId) {
  try {
    const res = await fetch(`${API_URL}/api/public/post/${postId}`, {
      next: { revalidate: 60 }
    });
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { postId } = await params;
  const post = await getPost(postId);

  if (!post) {
    return { title: 'Post Not Found | ProConnect' };
  }

  const authorName = post.author?.name || 'A Member';
  const textPreview = post.text ? (post.text.substring(0, 60) + (post.text.length > 60 ? '...' : '')) : 'Shared a post';
  const title = `${authorName} on ProConnect`;
  const description = `"${textPreview}"`;

  const images = [];
  if (post.media?.url) images.push(post.media.url);
  else if (post.image) images.push(post.image);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/post/${postId}`,
      images,
    },
    twitter: {
      card: images.length > 0 ? 'summary_large_image' : 'summary',
      title,
      description,
      images,
    },
  };
}

export default async function PublicPostPage({ params }) {
  const { postId } = await params;
  const post = await getPost(postId);

  if (!post) {
    notFound();
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SocialMediaPosting',
    author: {
      '@type': 'Person',
      name: post.author?.name,
      url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/u/${post.author?.username}`,
    },
    datePublished: post.createdAt,
    articleBody: post.text,
    url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/post/${postId}`,
    interactionStatistic: [
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/LikeAction',
        userInteractionCount: post.likesCount
      },
      {
        '@type': 'InteractionCounter',
        interactionType: 'https://schema.org/CommentAction',
        userInteractionCount: post.commentsCount
      }
    ]
  };

  const hasImage = post.media?.url || post.image;

  return (
    <div className="max-w-2xl mx-auto p-4 mt-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Post Header */}
        <div className="p-4 flex items-center gap-3">
          <Link href={`/u/${post.author?.username}`}>
            <img 
              src={post.author?.profilePicture || '/default-avatar.png'} 
              alt={post.author?.name} 
              className="w-12 h-12 rounded-full object-cover"
            />
          </Link>
          <div>
            <Link href={`/u/${post.author?.username}`} className="font-bold text-gray-900 dark:text-white hover:underline">
              {post.author?.name}
            </Link>
            <p className="text-xs text-gray-500 dark:text-gray-400">{post.author?.headline}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {new Date(post.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Post Body */}
        <div className="p-4 pt-0">
          <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{post.text}</p>
        </div>

        {/* Post Media */}
        {hasImage && (
          <div className="w-full bg-gray-100 dark:bg-gray-900">
            <img 
              src={post.media?.url || post.image} 
              alt="Post attachment" 
              className="w-full max-h-96 object-contain"
            />
          </div>
        )}

        {/* Post Stats */}
        <div className="px-4 py-3 text-sm text-gray-500 border-b border-gray-100 dark:border-gray-700 flex justify-between">
          <span>{post.likesCount} Likes</span>
          <span>{post.commentsCount} Comments</span>
        </div>

        {/* Post Actions (Redirect to Login) */}
        <div className="flex px-2 py-1">
          <Link href={`/login?callbackUrl=/post/${postId}`} className="flex-1 text-center py-3 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition">
            Like
          </Link>
          <Link href={`/login?callbackUrl=/post/${postId}`} className="flex-1 text-center py-3 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition">
            Comment
          </Link>
          <Link href={`/login?callbackUrl=/post/${postId}`} className="flex-1 text-center py-3 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition">
            Share
          </Link>
        </div>
      </div>
      
      {/* Login Prompt Banner */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 text-center">
        <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100">Join the conversation</h3>
        <p className="text-blue-700 dark:text-blue-300 mt-2 mb-4">
          Sign in to like, comment, and see more from {post.author?.name}.
        </p>
        <Link 
          href={`/login?callbackUrl=/post/${postId}`}
          className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full transition-colors"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}
