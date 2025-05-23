import React from 'react';

const Diagnosis = () => {
  return (
    <section style={{ padding: '80px', textAlign: 'center' }}>
      <h1>Diagnosis</h1>
      <p>Render test con imágenes incluidas.</p>
      <div style={ marginTop: '40px' }}>
        <img src="https://via.placeholder.com/300" alt="Imagen de prueba" style={{ maxWidth: "100%", height: "auto" }}} />
      </div>
    </section>
  );
};

export default Diagnosis;
