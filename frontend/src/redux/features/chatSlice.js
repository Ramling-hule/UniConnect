import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isOpen: false,
  activeChatUser: null, // The user object we are chatting with
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    openChat: (state, action) => {
      state.isOpen = true;
      state.activeChatUser = action.payload; // Pass the target user object
    },
    closeChat: (state) => {
      state.isOpen = false;
      state.activeChatUser = null;
    }
  },
});

export const { openChat, closeChat } = chatSlice.actions;
export default chatSlice.reducer;