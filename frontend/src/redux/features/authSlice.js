import { createSlice } from '@reduxjs/toolkit';
import storageService from '../../services/storageService';

const initialState = {
  user: storageService.getPersistedUser(),
  token: storageService.getPersistedToken(),
  isLoading: false,
  error: null,
  success: false,
  mfaRequired: false,
  tempMfaToken: null,
  tempUserId: null,
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

      if (action.payload.mfaRequired) {
        state.mfaRequired = true;
        state.tempMfaToken = action.payload.tempToken;
        state.tempUserId = action.payload.userId;
        return;
      }

      state.mfaRequired = false;
      state.tempMfaToken = null;
      state.tempUserId = null;

      // Backend returns: { accessToken, user: { _id, name, username, email, institute } }
      const { accessToken, user: apiUser } = action.payload;
      const { _id, name, username, email, institute, profilePicture } = apiUser || {};

      // 1. Create a clean user object
      const userData = {
        _id: _id,
        id: _id,            // Map _id to id for easier frontend use
        name: name,
        username: username,
        email: email,
        token: accessToken,
        institute: institute,
        profilePicture: profilePicture || '',
      };

      // 2. Update Redux State
      state.user = userData;
      state.token = accessToken;

      // 3. Persist via StorageService (SRP)
      storageService.persistAuth(userData, accessToken);
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
      state.mfaRequired = false;
      state.tempMfaToken = null;
      state.tempUserId = null;

      storageService.clearAuth();
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
