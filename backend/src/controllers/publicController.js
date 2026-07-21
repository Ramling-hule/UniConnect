import User from '../models/User.js';
import Post from '../models/Post.js';
import Group from '../models/Group.js';
import mongoose from 'mongoose';

export const getPublicProfile = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ 
      username, 
      visibility: 'PUBLIC' 
    }).select(
      'name username headline about profilePicture skills experience education badges points instituteName following createdAt'
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found or is private' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching public profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getPublicPost = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid post ID' });
    }

    const post = await Post.findOne({ 
      _id: id, 
      visibility: 'PUBLIC' 
    }).populate(
      'user', 
      'name username profilePicture headline'
    ).select('-comments.user');

    if (!post) {
      return res.status(404).json({ message: 'Post not found or is private' });
    }

    const sanitizedPost = {
      _id: post._id,
      text: post.text,
      media: post.media,
      image: post.image,
      createdAt: post.createdAt,
      likesCount: post.likes.length,
      commentsCount: post.comments.length,
      author: post.user,
      postType: post.postType,
      hackathonMeta: post.hackathonMeta
    };

    res.status(200).json(sanitizedPost);
  } catch (error) {
    console.error('Error fetching public post:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getPublicGroup = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid group ID' });
    }

    const group = await Group.findOne({ 
      _id: id, 
      privacy: 'public' 
    }).select('name description image institute createdAt members');

    if (!group) {
      return res.status(404).json({ message: 'Group not found or is private' });
    }

    const sanitizedGroup = {
      _id: group._id,
      name: group.name,
      description: group.description,
      image: group.image,
      institute: group.institute,
      createdAt: group.createdAt,
      memberCount: group.members.length
    };

    res.status(200).json(sanitizedGroup);
  } catch (error) {
    console.error('Error fetching public group:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getSitemapData = async (req, res) => {
  try {
    const users = await User.find({ visibility: 'PUBLIC' }).select('username updatedAt').limit(1000);
    const posts = await Post.find({ visibility: 'PUBLIC' }).select('_id updatedAt').limit(1000);
    const groups = await Group.find({ privacy: 'public' }).select('_id updatedAt').limit(1000);

    res.status(200).json({
      users: users.map(u => ({ username: u.username, updatedAt: u.updatedAt || new Date() })),
      posts: posts.map(p => ({ id: p._id, updatedAt: p.updatedAt || new Date() })),
      groups: groups.map(g => ({ id: g._id, updatedAt: g.updatedAt || new Date() }))
    });
  } catch (error) {
    console.error('Error fetching sitemap data:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
