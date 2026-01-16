import { createSlice } from '@reduxjs/toolkit';

// Helper to safely get data from localStorage
const getFromStorage = (key) => {
  if (typeof window !== 'undefined') {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  }
  return null;
};

const initialState = {
  user: getFromStorage('userInfo'),
  token: typeof window !== 'undefined' ? localStorage.getItem('userToken') : null,
  isLoading: false,
  error: null,
  success: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    authStart: (state) => {
      state.isLoading = true;
      state.error = null;
      state.success = false;
    },
    authSuccess: (state, action) => {
      state.isLoading = false;
      state.success = true;
      state.error = null;

      // --- CRITICAL CHANGE FOR YOUR API ---
      // Your API returns: { _id, name, username, email, institute, token }
      // Everything is at the top level of action.payload
      const { token, _id, name, username, email, institute, profilePicture } = action.payload;

      // 1. Create a clean user object (excluding the token)
      const userData = {
        id: _id,            // Map _id to id for easier frontend use
        name: name,
        username: username,
        email: email,
        token : token,
        institute: institute,
        profilePicture: profilePicture || '', // Handle if it exists or not
      };

      // 2. Update Redux State
      state.user = userData;
      state.token = token;

      // 3. Update Local Storage
      if (typeof window !== 'undefined') {
        localStorage.setItem('userInfo', JSON.stringify(userData));
        localStorage.setItem('token', token);
      }
    },
    authFailure: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
      state.success = false;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.success = false;
      state.error = null;
      
      if (typeof window !== 'undefined') {
        localStorage.removeItem('userInfo');
        localStorage.removeItem('userToken');
      }
    },
    resetAuthStatus: (state) => {
      state.isLoading = false;
      state.error = null;
      state.success = false;
    }
  },
});

export const { authStart, authSuccess, authFailure, logout, resetAuthStatus } = authSlice.actions;
export default authSlice.reducer;