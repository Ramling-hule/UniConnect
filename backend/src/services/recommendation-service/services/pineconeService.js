import { Pinecone } from '@pinecone-database/pinecone';
import { env } from '../../../config/env.js';

class PineconeService {
  constructor() {
    if (env.pineconeApiKey) {
      this.pinecone = new Pinecone({ apiKey: env.pineconeApiKey });
      this.index = this.pinecone.index(env.pineconeIndexName || 'proconnect-mentors');
    }
  }

  async querySimilar(queryVector, filter = {}, topK = 100) {
    if (!this.index) return [];
    
    console.log(`[PineconeService] Querying top ${topK} matches with filter:`, filter);
    try {
      const results = await this.index.namespace('mentors').query({
        vector: queryVector,
        topK,
        includeMetadata: true,
        filter
      });
      return results.matches || [];
    } catch (err) {
      console.error('[PineconeService] Query failed:', err.message);
      return [];
    }
  }

  async upsertMentorVector(mentorId, vector, metadata) {
    if (!this.index) return;

    console.log(`[PineconeService] Upserting vector for mentor: ${mentorId}`);
    try {
      await this.index.namespace('mentors').upsert([{
        id: mentorId.toString(),
        values: vector,
        metadata
      }]);
    } catch (err) {
      console.error('[PineconeService] Upsert failed:', err.message);
    }
  }
}

export default new PineconeService();
