import React, { useState } from 'react';
import { extractProductsFromList } from './services/geminiService';

function App() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8f9fa', fontFamily: 'sans-serif' }}>
      {/* Barra Lateral Izquierda */}
      <aside style={{ width: '280px', backgroundColor: 'white', borderRight: '1px solid #e9ecef', padding: '20px' }}>
        <div style={{ color: '#d90429', fontWeight: 'bold', marginBottom: '30px' }}>SISTEMA COMERCIAL <span style={{color: '#2b2d42'}}>PRO</span></div>
        
        <div style={{ marginBottom: '20px' }}>
          <p style={{ fontSize: '12px', color: '#adb5bd', fontWeight: 'bold' }}>INVENTARIO BASE</p>
          <div style={{ border: '2px dashed #dee2e6', borderRadius: '10px', padding: '20px', textAlign: 'center', color: '#adb5bd' }}>
            VINCULAR EXCEL
          </div>
        </div>

        <div>
          <p style={{ fontSize: '12px', color: '#adb5bd', fontWeight: 'bold' }}>OFERTA GLOBAL</p>
          <div style={{ display: 'flex', gap: '5px' }}>
            {['0%', '10%', '20%', '30%'].map(pct => (
              <button key={pct} style={{ flex: 1, padding: '5px', border: '1px solid #dee2e6', borderRadius: '5px', backgroundColor: pct === '0%' ? '#d90429' : 'white', color: pct === '0%' ? 'white' : 'black' }}>{pct}</button>
            ))}
          </div>
        </div>
      </aside>

      {/* Contenido Principal */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <button style={{ position: 'absolute', top: '20px', right: '20px', padding: '10px', borderRadius: '5px', border: '1px solid #dee2e6' }}>
          📷 ESCANEO IA
        </button>

        <div style={{ textAlign: 'center', maxWidth: '500px', width: '100%' }}>
          <h2 style={{ marginBottom: '20px', color: '#2b2d42' }}>CATÁLOGO PROFESIONAL</h2>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
            <textarea 
              placeholder="Pega aquí uno o varios SKUs..." 
              style={{ width: '100%', height: '150px', border: '1px solid #f1f3f5', borderRadius: '10px', padding: '15px', backgroundColor: '#f8f9fa', marginBottom: '20px' }}
            />
            <button style={{ width: '100%', padding: '15px', backgroundColor: '#d90429', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
              GENERAR FICHAS
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
