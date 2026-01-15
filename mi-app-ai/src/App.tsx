import React, { useState } from 'react';
import { extractProductsFromList } from './services/geminiService';
import * as XLSX from 'xlsx';

export default function App() {
  // 1. Estados de Datos
  const [skus, setSkus] = useState("");
  const [dbPrecios, setDbPrecios] = useState<any[]>([]);
  const [bancoFotos, setBancoFotos] = useState<Record<string, string>>({});
  const [statusLog, setStatusLog] = useState<string[]>(["[SISTEMA] Listo"]);
  
  // 2. Estados de Configuración (Studio IA Style)
  const [isScanning, setIsScanning] = useState(false);
  const [ofertaGlobal, setOfertaGlobal] = useState(0);

  // Funciones de Log y Utilidad
  const addLog = (msg: string) => setStatusLog(prev => [...prev.slice(-3), `> ${msg}`]);

  // --- CARGA DE EXCEL ---
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

  // --- CARGA DE FOTOS ---
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
    addLog("Fotos cargadas correctamente");
  };

  // --- ESCANEO IA ---
  const handleIA = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsScanning(true);
    addLog("Iniciando IA...");
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const result = await extractProductsFromList(reader.result as string);
        setSkus(result);
        addLog("Escaneo exitoso");
      } catch (err) { addLog("Fallo en lectura IA"); }
      finally { setIsScanning(false); }
    };
    reader.readAsDataURL(file);
  };

  // --- RENDERIZADO DE LA TARJETA (Studio IA) ---
  const renderCard = (linea: string, index: number) => {
    const cod = linea.trim().toLowerCase();
    if (!cod) return null;
    const info = dbPrecios.find((p: any) => String(p.codigo).toLowerCase() === cod);
    const foto = bancoFotos[cod];
    
    // Cálculo de precio con Oferta Global
    const precioFinal = info ? info.precio * (1 - ofertaGlobal / 100) : 0;

    return (
      <div key={index} style={{ width: '380px', backgroundColor: 'white', borderRadius: '40px', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.1)', margin: '20px' }}>
        <div style={{ position: 'relative', height: '380px', backgroundColor: '#f9f9f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', top: '25px', left: '25px', backgroundColor: '#d90429', color: 'white', padding: '6px 18px', borderRadius: '25px', fontWeight: 'bold', fontSize: '13px', zIndex: 10 }}>
            SKU: {cod.toUpperCase()}
          </div>
          {foto ? (
            <img src={foto} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ color: '#ccc', fontSize: '12px' }}>SIN IMAGEN VINCULADA</div>
          )}
        </div>
        <div style={{ backgroundColor: '#000', padding: '30px', color: 'white' }}>
          <h2 style={{ fontSize: '18px', margin: '0 0 15px 0', textTransform: 'uppercase', minHeight: '44px' }}>
            {info?.descripcion || "BUSCANDO EN INVENTARIO..."}
          </h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <p style={{ fontSize: '10px', color: '#444', margin: 0 }}>SISTEMA PROFESIONAL</p>
              <p style={{ fontSize: '10px', color: '#444', margin: 0 }}>STUDIO IA</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#d90429', fontSize: '34px', fontWeight: 'bold' }}>
                ${precioFinal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </div>
              <p style={{ fontSize: '10px', color: '#444', margin: 0 }}>PVP UNITARIO</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f4f7f6', fontFamily: 'sans-serif' }}>
      {/* SIDEBAR IZQUIERDO */}
      <aside style={{ width: '340px', padding: '30px', borderRight: '1px solid #eee', backgroundColor: 'white', display: 'flex', flexDirection: 'column' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: '#d90429', marginBottom: '40px' }}>SISTEMA COMERCIAL PRO</h1>
        
        <p style={{ fontSize: '11px', color: '#bbb', fontWeight: 'bold', marginBottom: '10px' }}>INVENTARIO BASE</p>
        <label style={{ display: 'block', padding: '20px', border: '2px dashed #eee', borderRadius: '15px', textAlign: 'center', cursor: 'pointer', marginBottom: '20px' }}>
          <input type="file" hidden onChange={handleExcelUpload} accept=".xlsx,.xls" />
          <span style={{ color: dbPrecios.length > 0 ? '#28a745' : '#666', fontWeight: 'bold' }}>
            {dbPrecios.length > 0 ? "✅ EXCEL VINCULADO" : "VINCULAR EXCEL"}
          </span>
        </label>

        <label style={{ display: 'block', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '12px', textAlign: 'center', cursor: 'pointer', marginBottom: '30px', fontSize: '14px' }}>
          <input type="file" hidden multiple onChange={handleBancoFotosUpload} accept="image/*" />
          📁 BANCO FOTOS SKUS
        </label>

        <p style={{ fontSize: '11px', color: '#bbb', fontWeight: 'bold', marginBottom: '15px' }}>OFERTA GLOBAL</p>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '40px' }}>
          {[0, 10, 20, 30].map(p => (
            <button key={p} onClick={() => setOfertaGlobal(p)} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid #eee', backgroundColor: ofertaGlobal === p ? '#d90429' : 'white', color: ofertaGlobal === p ? 'white' : 'black', fontWeight: 'bold', cursor: 'pointer' }}>
              {p}%
            </button>
          ))}
        </div>

        <div style={{ marginTop: 'auto', backgroundColor: '#0b132b', padding: '20px', borderRadius: '20px', color: '#4cc9f0', fontSize: '12px', fontFamily: 'monospace' }}>
          <p style={{ color: 'white', marginBottom: '10px' }}>STATUS SISTEMA</p>
          {statusLog.map((log, i) => <div key={i}>{log}</div>)}
        </div>
      </aside>

      {/* ÁREA CENTRAL */}
      <main style={{ flex: 1, padding: '40px', overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: '100%', maxWidth: '900px', display: 'flex', justifyContent: 'flex-end', gap: '15px', marginBottom: '40px' }}>
          <label style={{ backgroundColor: 'white', border: '1px solid #ddd', padding: '12px 25px', borderRadius: '25px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center' }}>
            <input type="file" hidden accept="image/*" onChange={handleIA} />
            📷 {isScanning ? "PROCESANDO..." : "ESCANEO IA"}
          </label>
          <button style={{ backgroundColor: '#d90429', color: 'white', border: 'none', padding: '12px 30px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
            EXPORTAR ({skus.split('\n').filter(s => s.trim()).length})
          </button>
        </div>

        <textarea 
          placeholder="Pega aquí los códigos de repuestos..."
          value={skus}
          onChange={(e) => setSkus(e.target.value)}
          style={{ width: '100%', maxWidth: '550px', height: '100px', padding: '20px', borderRadius: '20px', border: '1px solid #eee', marginBottom: '40px', outline: 'none', fontSize: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}
        />

        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', width: '100%' }}>
          {skus.split('\n').map((l, i) => renderCard(l, i))}
        </div>
      </main>
    </div>
  );
}
const renderCard = (linea: string, index: number) => {
    const cod = linea.trim(); // Quitamos espacios, mantenemos el formato del SKU (ej: 00001)
    if (!cod) return null;

    // Buscamos en el Excel usando la columna 'SKU'
    const info = dbPrecios.find((p: any) => String(p.SKU).trim() === cod);

    const foto = bancoFotos[cod.toLowerCase()]; // Las fotos suelen estar en minúsculas
    
    // Usamos los nombres reales de tus columnas: 'costo' y 'NOMBRE '
    const precioBase = parseFloat(info?.costo) || 0;
    const descripcion = info?.["NOMBRE "] || "PRODUCTO NO ENCONTRADO";

    // Aplicamos la Oferta Global sobre el costo
    const precioFinal = precioBase * (1 - ofertaGlobal / 100);

    return (
      <div key={index} style={{ width: '380px', backgroundColor: 'white', borderRadius: '40px', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.1)', margin: '20px' }}>
        <div style={{ position: 'relative', height: '380px', backgroundColor: '#f9f9f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', top: '25px', left: '25px', backgroundColor: '#d90429', color: 'white', padding: '6px 18px', borderRadius: '25px', fontWeight: 'bold', fontSize: '13px', zIndex: 10 }}>
            SKU: {cod.toUpperCase()}
          </div>
          {foto ? (
            <img src={foto} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ color: '#ccc', fontSize: '12px' }}>SIN FOTO (Vincular {cod})</div>
          )}
        </div>
        <div style={{ backgroundColor: '#000', padding: '30px', color: 'white' }}>
          <h2 style={{ fontSize: '18px', margin: '0 0 15px 0', textTransform: 'uppercase', minHeight: '44px' }}>
            {descripcion}
          </h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <p style={{ fontSize: '10px', color: '#444', margin: 0 }}>SISTEMA PROFESIONAL</p>
              <p style={{ fontSize: '10px', color: '#444', margin: 0 }}>STUDIO IA</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#d90429', fontSize: '34px', fontWeight: 'bold' }}>
                ${precioFinal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </div>
              <p style={{ fontSize: '10px', color: '#444', margin: 0 }}>PVP UNITARIO</p>
            </div>
          </div>
        </div>
      </div>
    );
  };
