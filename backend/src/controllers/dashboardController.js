import { asyncHandler } from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';
import PostService from '../services/PostService.js';
import ConnectionService from '../services/ConnectionService.js';
import UserService from '../services/UserService.js';

/**
 * dashboardController — Thin HTTP adapter layer.
 *
 * SOLID applied:
 *  - SRP : controller only handles HTTP concerns (parse → delegate → respond → error).
 *  - DIP : depends on service abstractions, not concrete DB/cache implementations.
 *
 * All business logic lives in:
 *  - PostService       (posts, likes, comments)
 *  - ConnectionService (network, invites, discover)
 *  - UserService       (profile, suggestions)
 */

// ─── POSTS ────────────────────────────────────────────────────────────────────

export const createPost = asyncHandler(async (req, res, next) => {
  try {
    const post = await PostService.createPost({
      text:   req.body.text,
      userId: req.body.userId,
      file:   req.file,
    });
    res.status(201).json(post);
  } catch (err) {
    return next(err instanceof AppError ? err : new AppError(err.message, err.statusCode || 500));
  }
});

export const getPosts = asyncHandler(async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const result = await PostService.getPosts({ limit, cursor: req.query.cursor });
    res.status(200).json(result);
  } catch (err) {
    return next(err instanceof AppError ? err : new AppError(err.message, 400));
  }
});

export const toggleLike = asyncHandler(async (req, res, next) => {
  try {
    const likes = await PostService.toggleLike(req.params.id, req.body.userId);
    res.json(likes);
  } catch (err) {
    return next(err instanceof AppError ? err : new AppError(err.message, err.statusCode || 500));
  }
});

export const addComment = asyncHandler(async (req, res, next) => {
  try {
    const comments = await PostService.addComment(req.params.id, {
      userId: req.body.userId,
      text:   req.body.text,
    });
    res.json(comments);
  } catch (err) {
    return next(err instanceof AppError ? err : new AppError(err.message, err.statusCode || 500));
  }
});

// ─── NETWORK / CONNECTIONS ────────────────────────────────────────────────────

export const sendConnectionRequest = asyncHandler(async (req, res, next) => {
  try {
    const result = await ConnectionService.sendRequest(req.user._id, req.body.receiverId);
    res.json(result);
  } catch (err) {
    return next(err instanceof AppError ? err : new AppError(err.message, err.statusCode || 500));
  }
});

export const respondToInvite = asyncHandler(async (req, res, next) => {
  try {
    const result = await ConnectionService.respondToInvite(
      req.user._id,
      req.body.connectionId,
      req.body.action,
    );
    res.json(result);
  } catch (err) {
    return next(err instanceof AppError ? err : new AppError(err.message, err.statusCode || 500));
  }
});

export const getNetwork = asyncHandler(async (req, res, next) => {
  const result = await ConnectionService.getNetwork(req.user._id);
  res.json(result);
});

export const getDiscoverUsers = asyncHandler(async (req, res, next) => {
  const users = await ConnectionService.getDiscoverUsers(req.user._id.toString());
  res.json(users);
});

// ─── USER PROFILE ─────────────────────────────────────────────────────────────

export const getUserByUsername = asyncHandler(async (req, res, next) => {
  try {
    const user = await UserService.getUserByUsername(req.params.username);
    res.json(user);
  } catch (err) {
    return next(err instanceof AppError ? err : new AppError(err.message, err.statusCode || 500));
  }
});

export const updateProfile = asyncHandler(async (req, res, next) => {
  const user = await UserService.updateProfile(req.user._id, req.body);
  res.json(user);
});

export const getSuggestions = asyncHandler(async (req, res, next) => {
  const userId = req.user?.id || req.userId;
  const suggestions = await UserService.getSuggestions(userId);
  res.status(200).json(suggestions);
});