import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env.js';
class AiService {
  constructor() {
    this._client = null;
  }
  _getClient() {
    if (this._client) return this._client;
    if (!env.geminiApiKey) return null;
    this._client = new GoogleGenAI({ apiKey: env.geminiApiKey });
    return this._client;
  }

  get isAvailable() {
    return Boolean(env.geminiApiKey);
  }
  async generateContent({ model, contents, systemInstruction, responseMimeType }) {
    const ai = this._getClient();
    if (!ai) {
      const err = new Error('AI service is misconfigured. Gemini API key is missing.');
      err.status = 500;
      throw err;
    }

    const config = {};
    if (systemInstruction) config.systemInstruction = systemInstruction;
    if (responseMimeType)  config.responseMimeType  = responseMimeType;

    const response = await ai.models.generateContent({
      model:    model || env.geminiModel || 'gemini-2.5-flash',
      contents,
      config,
    });

    return response.text;
  }
}

export default new AiService();
