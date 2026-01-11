import { createSlice } from '@reduxjs/toolkit';

// Helper to get user from local storage (if page refreshes)
const getUserFromStorage = () => {
  if (typeof window !== 'undefined') {
    const user = localStorage.getItem('userInfo');
    return user ? JSON.parse(user) : null;
  }
  return null;
};

const initialState = {
  user: getUserFromStorage(),
  isLoading: false,
  error: null,
  success: false, // Useful for showing "Registration Successful" messages
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Login Actions
    authStart: (state) => {
      state.isLoading = true;
      state.error = null;
      state.success = false;
    },
    authSuccess: (state, action) => {
      state.isLoading = false;
      state.user = action.payload;
      state.success = true;
      state.error = null;
      localStorage.setItem('userInfo', JSON.stringify(action.payload));
    },
    authFailure: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
      state.success = false;
    },
    // Logout Action
    logout: (state) => {
      state.user = null;
      state.success = false;
      state.error = null;
      localStorage.removeItem('userInfo');
    },
    // Reset Error/Success (useful when switching pages)
    resetAuthStatus: (state) => {
      state.isLoading = false;
      state.error = null;
      state.success = false;
    }
  },
});

export const { authStart, authSuccess, authFailure, logout, resetAuthStatus } = authSlice.actions;
export default authSlice.reducer;