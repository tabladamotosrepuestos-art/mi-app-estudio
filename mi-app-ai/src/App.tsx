import React, { useState } from 'react';
import { extractProductsFromList } from './services/geminiService';

function App() {
  const [loading, setLoading] = useState(false);
  const [skus, setSkus] = useState("");

  // Función para manejar el Escaneo de Imagen
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = reader.result as string;
      try {
        // Llamada real a tu servicio de Gemini
        const data = await extractProductsFromList(base64Data);
        if (data.productos) {
          const listaSkus = data.productos.map((p: any) => p.codigo || p.descripcion).join("\n");
          setSkus(listaSkus);
          alert("¡Lista extraída con éxito!");
        }
      } catch (error) {
        alert("Error al analizar la imagen.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8f9fa', fontFamily: 'sans-serif' }}>
      {/* Barra Lateral */}
      <aside style={{ width: '280px', backgroundColor: 'white', borderRight: '1px solid #e9ecef', padding: '20px' }}>
        <div style={{ color: '#d90429', fontWeight: 'bold', marginBottom: '30px', fontSize: '18px' }}>
          SISTEMA COMERCIAL <span style={{color: '#2b2d42'}}>PRO</span>
        </div>
        
        <p style={{ fontSize: '12px', color: '#adb5bd', fontWeight: 'bold', marginBottom: '10px' }}>INVENTARIO BASE</p>
        <div style={{ border: '2px dashed #dee2e6', borderRadius: '10px', padding: '20px', textAlign: 'center', color: '#adb5bd', cursor: 'pointer', marginBottom: '30px' }}>
          VINCULAR EXCEL
        </div>

        <p style={{ fontSize: '12px', color: '#adb5bd', fontWeight: 'bold', marginBottom: '10px' }}>OFERTA GLOBAL</p>
        <div style={{ display: 'flex', gap: '5px' }}>
          {['0%', '10%', '20%', '30%'].map(pct => (
            <button key={pct} style={{ flex: 1, padding: '8px', border: '1px solid #dee2e6', borderRadius: '5px', backgroundColor: pct === '0%' ? '#d90429' : 'white', color: pct === '0%' ? 'white' : 'black', cursor: 'pointer' }}>{pct}</button>
          ))}
        </div>
      </aside>

      {/* Contenido Principal */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        {/* Botón Escaneo IA con Input oculto */}
        <label style={{ position: 'absolute', top: '20px', right: '20px', padding: '10px 20px', borderRadius: '5px', border: '1px solid #dee2e6', backgroundColor: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input type="file" accept="image/*" hidden onChange={handleFileUpload} />
          📷 {loading ? 'PROCESANDO...' : 'ESCANEO IA'}
        </label>

        <div style={{ textAlign: 'center', maxWidth: '550px', width: '100%' }}>
          <h2 style={{ marginBottom: '25px', color: '#2b2d42', letterSpacing: '1px' }}>CATÁLOGO PROFESIONAL</h2>
          <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '25px', boxShadow: '0 15px 35px rgba(0,0,0,0.05)' }}>
            <textarea 
              value={skus}
              onChange={(e) => setSkus(e.target.value)}
              placeholder="Pega aquí uno o varios SKUs o usa Escaneo IA..." 
              style={{ width: '100%', height: '180px', border: '1px solid #f1f3f5', borderRadius: '15px', padding: '20px', backgroundColor: '#f8f9fa', marginBottom: '25px', fontSize: '16px', outline: 'none', resize: 'none' }}
            />
            <button 
              onClick={() => alert('Generando fichas para: ' + skus)}
              style={{ width: '100%', padding: '18px', backgroundColor: '#d90429', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}
            >
              GENERAR FICHAS
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
