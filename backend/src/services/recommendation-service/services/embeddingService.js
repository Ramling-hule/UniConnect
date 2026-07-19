import OpenAI from 'openai';
import { env } from '../../../config/env.js';

class EmbeddingService {
  constructor() {
    this.openai = new OpenAI({ apiKey: env.openaiApiKey });
  }
  async generateEmbedding(text) {
    if (!text || text.trim() === '') return new Array(1536).fill(0);
    
    console.log(`[EmbeddingService] Generating embedding for text length: ${text.length}`);
    
    try {
      const response = await this.openai.embeddings.create({
        model: env.openaiEmbeddingModel || "text-embedding-3-small",
        input: text,
      });
      return response.data[0].embedding;
    } catch (err) {
      console.error('[EmbeddingService] Failed to generate embedding:', err.message);
      throw err;
    }
  }
}

export default new EmbeddingService();
