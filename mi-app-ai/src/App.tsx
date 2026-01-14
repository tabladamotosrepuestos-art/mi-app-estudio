import React, { useState } from 'react';
import { extractProductsFromList } from './services/geminiService';

function App() {
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState("");

  return (
    <div style={{ 
      fontFamily: 'sans-serif', 
      padding: '40px', 
      textAlign: 'center',
      backgroundColor: '#f4f7f6',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#2c3e50' }}>Analizador de Repuestos IA</h1>
      <p style={{ color: '#7f8c8d' }}>Sube una foto de tu lista de repuestos para procesarla.</p>
      
      <div style={{ 
        background: 'white', 
        padding: '30px', 
        borderRadius: '12px', 
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        display: 'inline-block',
        marginTop: '20px'
      }}>
        <input type="file" accept="image/*" style={{ marginBottom: '20px' }} />
        <br />
        <button 
          style={{ 
            backgroundColor: '#3498db', 
            color: 'white', 
            border: 'none', 
            padding: '10px 20px', 
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
          onClick={() => alert('¡IA lista! Selecciona un archivo primero.')}
        >
          {loading ? 'Procesando...' : 'Analizar con Gemini'}
        </button>
      </div>

      {resultado && (
        <div style={{ marginTop: '30px', textAlign: 'left', display: 'inline-block', width: '100%', maxWidth: '600px' }}>
          <h3>Resultado:</h3>
          <pre style={{ background: '#eee', padding: '15px', borderRadius: '5px' }}>{resultado}</pre>
        </div>
      )}
    </div>
  );
}

export default App;
