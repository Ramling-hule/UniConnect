class StorageService {
  constructor() {
    this.isBrowser = typeof window !== 'undefined';
  }
  persistAuth(user, token) {
    if (!this.isBrowser) return;
    try {
      localStorage.setItem('userInfo', JSON.stringify(user));
      localStorage.setItem('token', token);
    } catch (err) {
      console.warn('Failed to persist auth state to localStorage', err);
    }
  }
  clearAuth() {
    if (!this.isBrowser) return;
    try {
      localStorage.removeItem('userInfo');
      localStorage.removeItem('token');
    } catch (err) {
      console.warn('Failed to clear auth state from localStorage', err);
    }
  }
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
  getPersistedToken() {
    if (!this.isBrowser) return null;
    return localStorage.getItem('token');
  }
}

const storageService = new StorageService();
export default storageService;
