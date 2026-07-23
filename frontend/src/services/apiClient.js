import axios from 'axios';
import { API_BASE_URL } from '../utils/config';
import storageService from './storageService';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // For refresh token cookies
  headers: {
    'Content-Type': 'application/json',
  },
});
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
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {

    if (error.response?.status === 401) {
      console.warn('Unauthorized access - token may be expired.');
    }

    return Promise.reject(error);
  }
);

export default apiClient;
