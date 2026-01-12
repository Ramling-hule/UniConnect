import { configureStore } from '@reduxjs/toolkit';
import authReducer from './features/authSlice';
import themeReducer from './features/themeSlice';
import navReducer from './features/navSlice';
import chatReducer from './features/chatSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    theme: themeReducer,
    nav: navReducer,
    chat: chatReducer,
  },
});