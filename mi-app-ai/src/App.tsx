import React from 'react';

function App() {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh',
      fontFamily: 'sans-serif',
      backgroundColor: '#f0f2f5'
    }}>
      <h1 style={{ color: '#1a73e8' }}>Analizador de Repuestos IA</h1>
      <p>Si ves este mensaje, ¡tu aplicación ya está funcionando correctamente!</p>
      <div style={{ 
        padding: '20px', 
        backgroundColor: 'white', 
        borderRadius: '8px', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
      }}>
        <input type="file" accept="image/*" />
        <button style={{ marginLeft: '10px', padding: '5px 15px' }}>Analizar Lista</button>
      </div>
    </div>
  );
}

export default App;
