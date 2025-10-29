import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { Analytics } from '@vercel/analytics/react';
import hybridAnalyticsService from '../lib/hybrid-analytics';

// Inicializar el tracking automático
console.log('🚀 Analytics híbridas inicializadas');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Analytics />
  </StrictMode>
);