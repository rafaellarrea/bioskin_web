import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import ErrorBoundary from './pages/ErrorBoundary';
import Home from './pages/Home';
import Appointment from './pages/Appointment';

function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/appointment" element={<Appointment />} />
          {/* Agrega aquí las demás rutas si necesitas */}
        </Routes>
      </HashRouter>
    </ErrorBoundary>
  );
}

export default App;
