import mongoose from 'mongoose';
import Message from '../models/Message.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';
export const getDirectMessages = asyncHandler(async (req, res, next) => {
  const { userId, otherId } = req.params;
  
  // Extract cursor and limit from the query string (e.g., ?limit=50&cursor=64a7...)
  const { cursor, limit = 50 } = req.query;

  if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(otherId)) {
    return next(new AppError('Invalid user ID format.', 400));
  }

  // Base query: messages between these two users
  const query = {
    $or: [
      { sender: userId, receiver: otherId },
      { sender: otherId, receiver: userId },
    ],
  };

  // If a cursor is provided, fetch messages strictly older than the cursor
  if (cursor) {
    if (!mongoose.Types.ObjectId.isValid(cursor)) {
      return next(new AppError('Invalid cursor format.', 400));
    }
    // In MongoDB, ObjectIds contain timestamps. Sorting by _id is slightly 
    // faster and safer than sorting by createdAt.
    query._id = { $lt: cursor }; 
  }

  // Fetch messages: newest first, capped by the limit
  const messages = await Message.find(query)
    .sort({ _id: -1 }) // -1 gets the most recent messages right before the cursor
    .limit(Number(limit));

  // Determine the next cursor to send to the frontend
  // If we got exactly the limit, there might be more messages.
  const nextCursor = messages.length === Number(limit) ? messages[messages.length - 1]._id : null;

  // Reverse the array before sending. 
  // We fetched newest-to-oldest to get the right batch, but the frontend 
  // needs them oldest-to-newest to render the chat chronologically.
  const chronologicalMessages = messages.reverse();

  res.json({ 
    success: true, 
    data: chronologicalMessages,
    nextCursor,
    hasMore: !!nextCursor
  });
});

export const searchMessages = asyncHandler(async (req, res, next) => {
  const { userId, otherId } = req.params;
  const { q } = req.query;

  if (!q || q.trim() === '') {
    return next(new AppError('Search query is required.', 400));
  }

  if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(otherId)) {
    return next(new AppError('Invalid user ID format.', 400));
  }

  const query = {
    $or: [
      { sender: userId, receiver: otherId },
      { sender: otherId, receiver: userId },
    ],
    text: { $regex: q, $options: 'i' }
  };

  const messages = await Message.find(query)
    .sort({ createdAt: 1 })
    .populate('sender', 'name profilePicture');

  res.json({
    success: true,
    data: messages
  });
});