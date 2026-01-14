import React, { useState, useEffect } from 'react';
import { extractProductsFromList } from './services/geminiService';
import * as XLSX from 'xlsx';

function App() {
  const [skus, setSkus] = useState("");
  const [dbPrecios, setDbPrecios] = useState<any[]>([]);
  const [bancoFotos, setBancoFotos] = useState<Record<string, string>>({});
  const [statusLog, setStatusLog] = useState<string[]>(["> Sistema listo"]);

  const addLog = (msg: string) => setStatusLog(prev => [...prev.slice(-4), `> ${msg}`]);

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    addLog("Leyendo archivo...");
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
      setDbPrecios(data);
      addLog(`${data.length} productos vinculados`);
    };
    reader.readAsBinaryString(file);
  };

  const handleBancoFotosUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const nuevoBanco: Record<string, string> = { ...bancoFotos };
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const nombre = file.name.split('.')[0].toLowerCase();
        nuevoBanco[nombre] = reader.result as string;
        setBancoFotos({ ...nuevoBanco });
        addLog(`Foto ${nombre} vinculada`);
      };
      reader.readAsDataURL(file);
    });
  };

  // Renderizado de la Card estilo Studio IA
  const renderCard = (linea: string) => {
    const cod = linea.split('-')[0].trim().toLowerCase();
    const info = dbPrecios.find((p: any) => String(p.codigo).toLowerCase() === cod);
    const foto = bancoFotos[cod];

    return (
      <div style={{
        width: '350px', backgroundColor: 'white', borderRadius: '30px', 
        overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', margin: '20px auto'
      }}>
        <div style={{ position: 'relative', height: '350px', backgroundColor: '#eee' }}>
          <span style={{ 
            position: 'absolute', top: '20px', left: '20px', backgroundColor: '#d90429', 
            color: 'white', padding: '5px 15px', borderRadius: '20px', fontWeight: 'bold', fontSize: '12px' 
          }}>SKU: {cod.toUpperCase()}</span>
          {foto && <img src={foto} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
        </div>
        <div style={{ backgroundColor: 'black', padding: '30px', color: 'white' }}>
          <h2 style={{ fontSize: '18px', margin: 0, textTransform: 'uppercase' }}>{info?.descripcion || "PRODUCTO SIN VINCULAR"}</h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
            <span style={{ fontSize: '12px', color: '#999' }}>PVP UNITARIO</span>
            <span style={{ color: '#d90429', fontSize: '28px', fontWeight: 'bold' }}>${info?.precio || "0,00"}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f8f9fa' }}>
      {/* Sidebar Izquierda - Reglas y Status */}
      <aside style={{ width: '300px', padding: '20px', borderRight: '1px solid #eee', overflowY: 'auto' }}>
        <div style={{ color: '#d90429', fontWeight: 'bold', marginBottom: '30px' }}>SISTEMA COMERCIAL PRO</div>
        
        <p style={{ fontSize: '10px', fontWeight: 'bold', color: '#ccc' }}>INVENTARIO BASE</p>
        <label style={{ display: 'block', padding: '15px', border: '1px dashed #ddd', borderRadius: '10px', textAlign: 'center', cursor: 'pointer', marginBottom: '20px' }}>
           <input type="file" hidden onChange={handleExcelUpload} />
           {dbPrecios.length > 0 ? 'VINCULAR EXCEL' : 'VINCULAR EXCEL'}
        </label>

        <p style={{ fontSize: '10px', fontWeight: 'bold', color: '#ccc' }}>OFERTA GLOBAL</p>
        <div style={{ display: 'flex', gap: '5px', marginBottom: '20px' }}>
          {['0%', '10%', '20%', '30%'].map(p => <button key={p} style={{ flex: 1, padding: '5px', border: '1px solid #eee', borderRadius: '5px', backgroundColor: p === '0%' ? '#d90429' : 'white', color: p === '0%' ? 'white' : 'black' }}>{p}</button>)}
        </div>

        <div style={{ backgroundColor: '#0b132b', padding: '15px', borderRadius: '10px', color: '#4cc9f0', fontSize: '11px', fontFamily: 'monospace' }}>
          <p style={{ margin: '0 0 10px 0', color: '#eee' }}>STATUS SISTEMA</p>
          {statusLog.map((log, i) => <div key={i} style={{ marginBottom: '5px' }}>{log}</div>)}
        </div>

        <label style={{ display: 'block', marginTop: '20px', padding: '10px', backgroundColor: '#eee', borderRadius: '8px', textAlign: 'center', cursor: 'pointer' }}>
          <input type="file" multiple hidden onChange={handleBancoFotosUpload} />
          CARGAR BANCO FOTOS
        </label>
      </aside>

      {/* Área Central - Previsualización Card */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px' }}>
        <div style={{ width: '100%', textAlign: 'right', marginBottom: '20px' }}>
          <button style={{ backgroundColor: '#d90429', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' }}>EXPORTAR (1)</button>
        </div>

        <textarea 
          placeholder="Escribe el SKU aquí..."
          value={skus}
          onChange={(e) => setSkus(e.target.value)}
          style={{ width: '100%', maxWidth: '400px', padding: '10px', borderRadius: '10px', border: '1px solid #ddd', marginBottom: '20px' }}
        />

        {skus.split('\n').filter(s => s.trim() !== "").map(linea => renderCard(linea))}
      </main>
    </div>
  );
}

export default App;
