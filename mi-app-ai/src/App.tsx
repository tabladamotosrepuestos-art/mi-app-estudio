import React, { useState } from 'react';
import { extractProductsFromList } from './services/geminiService';
import * as XLSX from 'xlsx';

export default function App() {
  // 1. Estados Globales
  const [skus, setSkus] = useState("");
  const [dbPrecios, setDbPrecios] = useState<any[]>([]);
  const [bancoFotos, setBancoFotos] = useState<Record<string, string>>({});
  const [statusLog, setStatusLog] = useState<string[]>(["[SISTEMA] Listo"]);
  const [isScanning, setIsScanning] = useState(false);
  const [ofertaGlobal, setOfertaGlobal] = useState(0);

  const addLog = (msg: string) => setStatusLog(prev => [...prev.slice(-3), `> ${msg}`]);

  // 2. Funciones de Carga
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        setDbPrecios(data);
        addLog(`${data.length} productos vinculados`);
      } catch (err) { addLog("Error al leer Excel"); }
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
      };
      reader.readAsDataURL(file);
    });
    addLog("Fotos cargadas");
  };

  const handleIA = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsScanning(true);
    addLog("Escaneando con IA...");
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const result = await extractProductsFromList(reader.result as string);
        setSkus(result);
        addLog("Escaneo completado");
      } catch (err) { addLog("Error en IA"); }
      finally { setIsScanning(false); }
    };
    reader.readAsDataURL(file);
  };

  // 3. Renderizado de Tarjeta (Ajustado a tu Excel 'lista app.xls')
  const renderCard = (linea: string, index: number) => {
    const codOriginal = linea.trim();
    const codBusqueda = codOriginal.toLowerCase();
    if (!codOriginal) return null;

    // Buscamos por la columna 'SKU' de tu Excel
    const info = dbPrecios.find((p: any) => String(p.SKU).trim() === codOriginal);
    const foto = bancoFotos[codBusqueda];
    
    // Columnas exactas de tu archivo: 'costo' y 'NOMBRE '
    const precioBase = parseFloat(info?.costo) || 0;
    const descripcion = info?.["NOMBRE "] || "BUSCANDO PRODUCTO...";
    const precioFinal = precioBase * (1 - ofertaGlobal / 100);

    return (
      <div key={index} style={{ width: '350px', backgroundColor: 'white', borderRadius: '35px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', margin: '15px' }}>
        <div style={{ position: 'relative', height: '350px', backgroundColor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ position: 'absolute', top: '20px', left: '20px', backgroundColor: '#d90429', color: 'white', padding: '5px 15px', borderRadius: '20px', fontWeight: 'bold', fontSize: '11px', zIndex: 2 }}>
            SKU: {codOriginal.toUpperCase()}
          </span>
          {foto ? (
            <img src={foto} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ color: '#ccc', fontSize: '11px' }}>SIN FOTO</div>
          )}
        </div>
        <div style={{ backgroundColor: 'black', padding: '25px', color: 'white' }}>
          <h2 style={{ fontSize: '16px', margin: '0 0 10px 0', textTransform: 'uppercase', minHeight: '40px' }}>
            {descripcion}
          </h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '9px', color: '#555' }}>STUDIO IA - PRO</span>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#d90429', fontSize: '30px', fontWeight: 'bold' }}>
                ${precioFinal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: '9px', color: '#555' }}>PVP UNITARIO</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f8f9fa', fontFamily: 'sans-serif' }}>
      <aside style={{ width: '320px', padding: '25px', borderRight: '1px solid #eee', backgroundColor: 'white' }}>
        <h1 style={{ color: '#d90429', fontSize: '16px', fontWeight: 'bold', marginBottom: '30px' }}>SISTEMA COMERCIAL PRO</h1>
        
        <label style={{ display: 'block', padding: '15px', border: '1px dashed #ddd', borderRadius: '12px', textAlign: 'center', cursor: 'pointer', marginBottom: '10px' }}>
          <input type="file" hidden onChange={handleExcelUpload} />
          {dbPrecios.length > 0 ? "✅ EXCEL CONECTADO" : "VINCULAR EXCEL"}
        </label>
        
        <label style={{ display: 'block', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '12px', textAlign: 'center', cursor: 'pointer', marginBottom: '25px' }}>
          <input type="file" hidden multiple onChange={handleBancoFotosUpload} />
          📁 BANCO FOTOS SKUS
        </label>

        <p style={{ fontSize: '10px', color: '#ccc', fontWeight: 'bold', marginBottom: '10px' }}>OFERTA GLOBAL</p>
        <div style={{ display: 'flex', gap: '5px', marginBottom: '25px' }}>
          {[0, 10, 20, 30].map(p => (
            <button key={p} onClick={() => setOfertaGlobal(p)} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #eee', backgroundColor: ofertaGlobal === p ? '#d90429' : 'white', color: ofertaGlobal === p ? 'white' : 'black', fontSize: '12px', fontWeight: 'bold' }}>{p}%</button>
          ))}
        </div>

        <div style={{ backgroundColor: '#0b132b', padding: '15px', borderRadius: '15px', color: '#4cc9f0', fontSize: '11px', fontFamily: 'monospace' }}>
          <p style={{ color: '#fff', marginBottom: '10px' }}>STATUS SISTEMA</p>
          {statusLog.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      </aside>

      <main style={{ flex: 1, padding: '30px', overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: '30px' }}>
          <label style={{ backgroundColor: 'white', border: '1px solid #ddd', padding: '10px 20px', borderRadius: '20px', cursor: 'pointer' }}>
            <input type="file" hidden onChange={handleIA} />
            📷 {isScanning ? "PROCESANDO..." : "ESCANEO IA"}
          </label>
          <button style={{ backgroundColor: '#d90429', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold' }}>
            EXPORTAR ({skus.split('\n').filter(s => s.trim()).length})
          </button>
        </div>

        <textarea 
          value={skus} 
          onChange={(e) => setSkus(e.target.value)}
          placeholder="Pega SKUs aquí..." 
          style={{ width: '100%', maxWidth: '500px', height: '80px', padding: '15px', borderRadius: '15px', border: '1px solid #eee', marginBottom: '20px' }}
        />

        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
          {skus.split('\n').map((l, i) => renderCard(l, i))}
        </div>
      </main>
    </div>
  );
}
