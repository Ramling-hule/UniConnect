"use client";
import { Provider } from 'react-redux';
import { store } from '../redux/store';
import ThemeWrapper from '../Components/ThemeWrapper';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useState } from 'react';
import './globals.css';

export default function RootLayout({ children }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <html lang="en">
      <body>
        <Provider store={store}>
          <QueryClientProvider client={queryClient}>
            <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'dummy-client-id'}>
              <ThemeWrapper>
                <Toaster position="top-right" />
                {children}
              </ThemeWrapper>
            </GoogleOAuthProvider>
          </QueryClientProvider>
        </Provider>
      </body>
    </html>
  );
}