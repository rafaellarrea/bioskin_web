import React from 'react';
import { MedicalProtocols } from '../components/MedicalProtocols';

const Protocols = () => {
  return (
    <div className="container-custom py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-serif font-bold text-gray-900 mb-4">
          Protocolos Clínicos IA
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Asistente inteligente especializado en aparatología médica estética. 
          Consulta parámetros, guías de tratamiento y contraindicaciones para Nd:YAG, CO2, IPL, HIFU y más.
        </p>
      </div>
      <MedicalProtocols />
    </div>
  );
};

export default Protocols;