// src/main.tsx
// Punto de entrada principal con configuración de analytics híbridas

import React from 'react'
import ReactDOM from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import App from './App.tsx'
import './index.css'
import hybridAnalyticsService from '../lib/hybrid-analytics'

// Inicializar el tracking automático
window.addEventListener('DOMContentLoaded', () => {
  // El servicio se inicializa automáticamente al importarse
  console.log('🚀 Analytics híbridas inicializadas');
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Analytics />
  </React.StrictMode>,
)