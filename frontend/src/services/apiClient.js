import axios from 'axios';
import { API_BASE_URL } from '../utils/config';
import storageService from './storageService';

/**
 * ApiClient — Centralized Axios instance.
 *
 * SOLID applied:
 *  - SRP : All HTTP request setup, auth injection, and error interception live here.
 *          Components don't need to know how to attach tokens.
 *  - DIP : Components depend on this client abstraction rather than the raw `fetch` or `axios` API directly.
 */

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // For refresh token cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach access token
apiClient.interceptors.request.use(
  (config) => {
    const token = storageService.getPersistedToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response Interceptor: Global error handling (and hook for token rotation if needed)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Note: If you implement silent token rotation via the /api/auth/refresh-token endpoint,
    // you would catch 401s here, call the refresh endpoint, update storageService, and retry the request.

    if (error.response?.status === 401) {
      console.warn('Unauthorized access - token may be expired.');
      // Optional: Dispatch a logout action if rotation fails or isn't supported.
    }

    return Promise.reject(error);
  }
);

export default apiClient;
