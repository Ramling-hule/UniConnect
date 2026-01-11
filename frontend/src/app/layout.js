"use client";
import { Provider } from 'react-redux';
import { store } from '../redux/store';
import ThemeWrapper from '../Components/ThemeWrapper'; 
import './globals.css';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Provider store={store}>
          {/* The Wrapper now handles the global dark/light background */}
          <ThemeWrapper>
            {children}
          </ThemeWrapper>
        </Provider>
      </body>
    </html>
  );
}