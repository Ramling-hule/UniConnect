import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

export const env = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'super_secret_key',
  mongoUri: process.env.MONGO_URI || '',
  redisUrl: process.env.REDIS_URL || '',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  openaiEmbeddingModel: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
  chromaApiUrl: process.env.CHROMA_API_URL || 'http://localhost:8000',
  chromaApiKey: process.env.CHROMA_API_KEY || '',
  chromaCollectionName: process.env.CHROMA_COLLECTION_NAME || 'educational_resources',
  pineconeApiKey: process.env.PINECONE_API_KEY || '',
  pineconeIndexName: process.env.PINECONE_INDEX_NAME || '',
  sessionSecret: process.env.SESSION_SECRET || 'your_secret_key',
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || '',
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || '',
  emailUser: process.env.EMAIL_USER || '',
  emailPass: process.env.EMAIL_PASS || '',
  baseUrl: process.env.BASE_URL || '',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
};

const requiredInProd = [
  'GEMINI_API_KEY',
  'MONGO_URI',
  'JWT_SECRET',
  'CHROMA_API_URL',
];

export const validateEnv = () => {
  const missing = requiredInProd.filter((k) => !process.env[k]);
  if (missing.length === 0) return true;

  const msg = `Missing required environment variables: ${missing.join(', ')}`;
  if (env.nodeEnv === 'production') {
    // In production we want to fail fast
    // eslint-disable-next-line no-console
    console.error(msg);
    throw new Error(msg);
  }

  // In non-production, just warn so devs can proceed.
  // eslint-disable-next-line no-console
  console.warn(msg);
  return false;
};

// Validate immediately on import to catch misconfiguration early.
try {
  validateEnv();
} catch (e) {
  // Re-throw so the process exits in production environments.
  throw e;
}
