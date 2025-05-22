import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './ErrorBoundary';
import Home from './Home';
import Appointment from './Appointment';
// Importa el resto de tus componentes según sea necesario

function App() {
  return (
    <ErrorBoundary>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/appointment" element={<Appointment />} />
          {/* Agrega aquí las demás rutas */}
        </Routes>
      </HashRouter>
    </ErrorBoundary>
  );
}

export default App;
