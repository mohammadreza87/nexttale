import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import App from './App.tsx';
import { ResetPassword } from './components/ResetPassword.tsx';
import { queryClient } from './lib/queryClient';
import './index.css';

const root = document.getElementById('root');
const isReset = window.location.pathname.includes('reset-callback');

createRoot(root!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      {isReset ? <ResetPassword /> : <App />}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  </StrictMode>
);
