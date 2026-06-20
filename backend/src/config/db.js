import mongoose from 'mongoose';
import { env } from './env.js';

const connectDB = async () => {
  const mongoUri = env.mongoUri?.trim();

  if (!mongoUri) {
    console.error('MongoDB connection failed: MONGO_URI is not defined in your environment.');
    console.error('Please add MONGO_URI to backend/.env or use a valid MongoDB connection string.');
    return false;
  }

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log(`MongoDB Connected: `);
    return true;
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    console.error('Please verify MONGO_URI and ensure your network can reach the MongoDB host.');
    return false;
  }
};

export default connectDB;