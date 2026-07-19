import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env.js';

/**
 * AiService — Single Responsibility: AI model interaction.
 *
 * Design patterns applied:
 *  - Service Layer (SRP): All Gemini SDK interaction in one place.
 *  - Dependency Inversion: Config injected via env abstraction, not process.env.
 *  - Lazy Initialisation: SDK client constructed only once, on first use.
 *  - Strategy (future-ready): The interface is generic enough to swap providers.
 */
class AiService {
  constructor() {
    /** @type {GoogleGenAI|null} */
    this._client = null;
  }

  /** Lazily initialises the Gemini client. Returns null if the key is missing. */
  _getClient() {
    if (this._client) return this._client;
    if (!env.geminiApiKey) return null;
    this._client = new GoogleGenAI({ apiKey: env.geminiApiKey });
    return this._client;
  }

  get isAvailable() {
    return Boolean(env.geminiApiKey);
  }

  /**
   * Generates content using the Gemini model.
   * @param {{ model?: string, contents: string, systemInstruction?: string, responseMimeType?: string }} params
   * @returns {Promise<string>} response text
   */
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
