import React from 'react';

function App() {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      fontFamily: 'sans-serif',
      backgroundColor: '#f4f7f6',
      textAlign: 'center',
      padding: '20px'
    }}>
      <header style={{ marginBottom: '30px' }}>
        <h1 style={{ color: '#2c3e50', fontSize: '2.5rem' }}>Analizador de Repuestos</h1>
        <p style={{ color: '#7f8c8d' }}>La aplicación se ha desplegado correctamente.</p>
      </header>
      
      <main style={{ 
        backgroundColor: 'white', 
        padding: '40px', 
        borderRadius: '12px', 
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        maxWidth: '500px',
        width: '100%'
      }}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
            Selecciona la imagen de la lista:
          </label>
          <input type="file" accept="image/*" style={{ width: '100%' }} />
        </div>
        <button style={{ 
          backgroundColor: '#3498db', 
          color: 'white', 
          border: 'none', 
          padding: '12px 24px', 
          borderRadius: '6px', 
          cursor: 'pointer',
          fontSize: '1rem',
          fontWeight: 'bold'
        }}>
          Analizar con IA
        </button>
      </main>
    </div>
  );
}

export default App;
