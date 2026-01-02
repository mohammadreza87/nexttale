import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initSupabase } from '@nexttale/shared';
import App from './App';
import './index.css';

// Initialize Supabase before rendering
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

initSupabase({ url: supabaseUrl, anonKey: supabaseAnonKey });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
