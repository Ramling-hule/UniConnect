import Post from '../models/Post.js';
import cloudinary from '../config/cloudinary.js';
import { getMimeInfo } from '../middlewares/upload.js';
import AppError from '../utils/AppError.js';

/**
 * PostService — Single Responsibility: Feed post lifecycle.
 *
 * Design patterns applied:
 *  - Service Layer (SRP): All post-related business logic in one place.
 *  - Facade: Wraps cloudinary upload behind a clean promise-based interface.
 */
class PostService {
  /**
   * Uploads a file buffer to Cloudinary and returns the media metadata object.
   * @param {Express.Multer.File} file
   * @returns {Promise<object>} media metadata
   */
  async _uploadToCloudinary(file) {
    const mimeInfo = getMimeInfo(file.mimetype);
    if (mimeInfo && file.size > mimeInfo.maxBytes) {
      const limitMB = Math.round(mimeInfo.maxBytes / (1024 * 1024));
      const err = new AppError(`File too large. Max size for this type is ${limitMB}MB.`, 400);
      throw err;
    }

    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'proconnect_posts', resource_type: 'auto' },
        (error, result) => {
          if (error) reject(new AppError('Upload to cloud storage failed', 500));
          else resolve(result);
        },
      );
      stream.end(file.buffer);
    });

    return {
      url:              uploadResult.secure_url,
      resourceType:     uploadResult.resource_type,
      format:           uploadResult.format,
      originalFilename: file.originalname,
      bytes:            uploadResult.bytes,
    };
  }

  /**
   * Creates a new post with optional media.
   * @param {{ text: string, userId: string, file?: Express.Multer.File }} params
   * @returns {Promise<Post>}
   */
  async createPost({ text, userId, file }) {
    let media = null;

    if (file) {
      media = await this._uploadToCloudinary(file);
    }

    if (!text?.trim() && !media) {
      throw new AppError('A post must have text or an attachment.', 400);
    }

    const newPost = await Post.create({
      user:  userId,
      text:  text || '',
      media: media || undefined,
    });
    await newPost.populate('user', 'name institute');
    return newPost;
  }

  /**
   * Fetches a cursor-paginated list of posts.
   * @param {{ limit: number, cursor?: string }} params
   * @returns {Promise<{ posts: Post[], nextCursor: string|null, hasMore: boolean }>}
   */
  async getPosts({ limit = 10, cursor } = {}) {
    let query = {};

    if (cursor) {
      const decodedCursor = JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));
      const cursorDate = new Date(decodedCursor.createdAt);
      const cursorId = decodedCursor._id;
      query = {
        $or: [
          { createdAt: { $lt: cursorDate } },
          { createdAt: cursorDate, _id: { $lt: cursorId } },
        ],
      };
    }

    const posts = await Post.find(query)
      .populate('user', 'name profilePicture institute')
      .populate({ path: 'comments.user', select: 'name profilePicture institute' })
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .lean();

    const hasMore = posts.length === limit;
    let nextCursor = null;
    if (hasMore) {
      const lastPost = posts[posts.length - 1];
      nextCursor = Buffer.from(JSON.stringify({ createdAt: lastPost.createdAt, _id: lastPost._id })).toString('base64');
    }

    return { posts, nextCursor, hasMore };
  }

  /**
   * Toggles a like on a post.
   * @param {string} postId
   * @param {string} userId
   * @returns {Promise<Array>} updated likes array
   */
  async toggleLike(postId, userId) {
    const post = await Post.findById(postId);
    if (!post) throw new AppError('Post not found', 404);

    const isLiked = post.likes.includes(userId);
    if (isLiked) {
      post.likes = post.likes.filter((uid) => uid.toString() !== userId);
    } else {
      post.likes.push(userId);
    }
    await post.save();
    return post.likes;
  }

  /**
   * Adds a comment to a post.
   * @param {string} postId
   * @param {{ userId: string, text: string }} comment
   * @returns {Promise<Array>} updated comments array
   */
  async addComment(postId, { userId, text }) {
    const post = await Post.findById(postId);
    if (!post) throw new AppError('Post not found', 404);

    post.comments.push({ user: userId, text, createdAt: new Date() });
    await post.save();

    const updatedPost = await Post.findById(postId).populate('comments.user', 'name');
    return updatedPost.comments;
  }
}

export default new PostService();
