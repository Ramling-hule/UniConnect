/**
 * StorageService — Single Responsibility: Browser storage operations.
 *
 * SOLID applied:
 *  - SRP : Extracts side-effectful localStorage operations out of Redux reducers.
 *  - DIP : Redux reducers (and components) interact with this service rather than
 *          raw `window.localStorage` APIs directly.
 */
class StorageService {
  constructor() {
    this.isBrowser = typeof window !== 'undefined';
  }

  // --- Auth state persistence ---

  /**
   * Persists the user and token to local storage.
   * @param {object} user 
   * @param {string} token 
   */
  persistAuth(user, token) {
    if (!this.isBrowser) return;
    try {
      localStorage.setItem('userInfo', JSON.stringify(user));
      localStorage.setItem('token', token);
    } catch (err) {
      console.warn('Failed to persist auth state to localStorage', err);
    }
  }

  /**
   * Clears the user and token from local storage.
   */
  clearAuth() {
    if (!this.isBrowser) return;
    try {
      localStorage.removeItem('userInfo');
      localStorage.removeItem('token');
    } catch (err) {
      console.warn('Failed to clear auth state from localStorage', err);
    }
  }

  /**
   * Retrieves the persisted user object.
   * @returns {object|null}
   */
  getPersistedUser() {
    if (!this.isBrowser) return null;
    try {
      const item = localStorage.getItem('userInfo');
      return item ? JSON.parse(item) : null;
    } catch (err) {
      console.warn('Failed to parse persisted user info', err);
      return null;
    }
  }

  /**
   * Retrieves the persisted auth token.
   * @returns {string|null}
   */
  getPersistedToken() {
    if (!this.isBrowser) return null;
    return localStorage.getItem('token');
  }
}

const storageService = new StorageService();
export default storageService;
