import mongoose from 'mongoose';
import Message from '../models/Message.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';
export const getDirectMessages = asyncHandler(async (req, res, next) => {
  const { userId, otherId } = req.params;
  const { cursor, limit = 50 } = req.query;

  if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(otherId)) {
    return next(new AppError('Invalid user ID format.', 400));
  }
  const query = {
    $or: [
      { sender: userId, receiver: otherId },
      { sender: otherId, receiver: userId },
    ],
  };
  if (cursor) {
    if (!mongoose.Types.ObjectId.isValid(cursor)) {
      return next(new AppError('Invalid cursor format.', 400));
    }
    query._id = { $lt: cursor }; 
  }
  const messages = await Message.find(query)
    .sort({ _id: -1 }) // -1 gets the most recent messages right before the cursor
    .limit(Number(limit));
  const nextCursor = messages.length === Number(limit) ? messages[messages.length - 1]._id : null;
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