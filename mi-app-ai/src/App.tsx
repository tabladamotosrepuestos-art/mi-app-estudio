import React, { useState } from 'react';
import { extractProductsFromList } from './services/geminiService';
import * as XLSX from 'xlsx';

function App() {
  const [loading, setLoading] = useState(false);
  const [skus, setSkus] = useState("");
  const [dbPrecios, setDbPrecios] = useState<any[]>([]); // Base de datos del Excel

  // Función para leer el Excel de precios
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const data = XLSX.utils.sheet_to_json(wb.Sheets[wsname]);
      setDbPrecios(data); // Guardamos la lista de precios
      alert(`¡Excel vinculado! Se cargaron ${data.length} productos.`);
    };
    reader.readAsBinaryString(file);
  };

  // Función de Escaneo IA mejorada
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = reader.result as string;
      try {
        const data = await extractProductsFromList(base64Data);
        if (data.productos) {
          // Buscamos los precios en el Excel vinculado
          const listaFinal = data.productos.map((prodIA: any) => {
            const coincidencia = dbPrecios.find(p => 
              p.codigo?.toString().toLowerCase() === prodIA.codigo?.toString().toLowerCase()
            );
            return coincidencia 
              ? `${prodIA.codigo} - ${prodIA.descripcion} - $${coincidencia.precio}`
              : `${prodIA.codigo} - ${prodIA.descripcion} (Precio no encontrado)`;
          }).join("\n");

          setSkus(listaFinal);
        }
      } catch (error) {
        alert("Error al procesar con IA.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8f9fa', fontFamily: 'sans-serif' }}>
      <aside style={{ width: '280px', backgroundColor: 'white', borderRight: '1px solid #e9ecef', padding: '20px' }}>
        <div style={{ color: '#d90429', fontWeight: 'bold', marginBottom: '30px', fontSize: '18px' }}>
          SISTEMA COMERCIAL <span style={{color: '#2b2d42'}}>PRO</span>
        </div>
        
        <p style={{ fontSize: '12px', color: '#adb5bd', fontWeight: 'bold', marginBottom: '10px' }}>INVENTARIO BASE</p>
        <label style={{ 
          display: 'block', border: '2px dashed #dee2e6', borderRadius: '10px', 
          padding: '20px', textAlign: 'center', color: dbPrecios.length > 0 ? '#27ae60' : '#adb5bd', 
          cursor: 'pointer', marginBottom: '30px' 
        }}>
          <input type="file" accept=".xlsx, .xls" hidden onChange={handleExcelUpload} />
          {dbPrecios.length > 0 ? '✅ EXCEL CONECTADO' : 'VINCULAR EXCEL'}
        </label>
        
        {/* Resto de la barra lateral (Oferta Global) */}
      </aside>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <label style={{ position: 'absolute', top: '20px', right: '20px', padding: '10px 20px', borderRadius: '5px', border: '1px solid #dee2e6', backgroundColor: 'white', cursor: 'pointer' }}>
          <input type="file" accept="image/*" hidden onChange={handleFileUpload} />
          📷 {loading ? 'PROCESANDO...' : 'ESCANEO IA'}
        </label>

        <div style={{ textAlign: 'center', maxWidth: '550px', width: '100%' }}>
          <h2 style={{ marginBottom: '25px', color: '#2b2d42' }}>CATÁLOGO PROFESIONAL</h2>
          <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '25px', boxShadow: '0 15px 35px rgba(0,0,0,0.05)' }}>
            <textarea 
              value={skus}
              onChange={(e) => setSkus(e.target.value)}
              placeholder="1. Vincula tu Excel\n2. Escanea una foto..." 
              style={{ width: '100%', height: '180px', border: '1px solid #f1f3f5', borderRadius: '15px', padding: '20px', backgroundColor: '#f8f9fa', marginBottom: '25px' }}
            />
            <button style={{ width: '100%', padding: '18px', backgroundColor: '#d90429', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
              GENERAR FICHAS
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
