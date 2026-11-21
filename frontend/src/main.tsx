import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { PERSIST_MAX_AGE, persister, queryClient } from './api/queryClient';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister, maxAge: PERSIST_MAX_AGE, buster: 'v1' }}
    >
      <AuthProvider>
        <App />
        <Toaster
          position="top-center"
          gutter={8}
          containerStyle={{ top: 'calc(env(safe-area-inset-top) + 12px)' }}
          toastOptions={{
            duration: 2500,
            style: {
              borderRadius: '14px',
              background: '#0f172a',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 500,
              padding: '10px 14px',
            },
            success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
            error: { duration: 4000, iconTheme: { primary: '#f43f5e', secondary: '#fff' } },
          }}
        />
      </AuthProvider>
    </PersistQueryClientProvider>
  </StrictMode>,
);
