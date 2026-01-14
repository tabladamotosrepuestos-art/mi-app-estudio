import React, { useState } from 'react';
import { extractProductsFromList } from './services/geminiService';
import * as XLSX from 'xlsx';

// Definición del componente principal
export default function App() {
  // 1. Estados Globales
  const [skus, setSkus] = useState("");
  const [dbPrecios, setDbPrecios] = useState<any[]>([]);
  const [bancoFotos, setBancoFotos] = useState<Record<string, string>>({});
  const [statusLog, setStatusLog] = useState<string[]>(["[SISTEMA] Listo para operar"]);
  const [isScanning, setIsScanning] = useState(false);

  // 2. Funciones de Ayuda
  const addLog = (msg: string) => {
    setStatusLog(prev => [...prev.slice(-4), `> ${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  const handleIA = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsScanning(true);
    addLog("Iniciando Escaneo IA...");
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const textFound = await extractProductsFromList(reader.result as string);
        setSkus(textFound);
        addLog("Escaneo completado");
      } catch (err) {
        addLog("Error en el escaneo IA");
      } finally {
        setIsScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
      setDbPrecios(data);
      addLog(`${data.length} productos vinculados desde Excel`);
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
        if (Object.keys(nuevoBanco).length % 5 === 0) addLog("Cargando banco de fotos...");
      };
      reader.readAsDataURL(file);
    });
  };

  // 3. Renderizado de Card (Estilo Studio IA)
  const renderCard = (linea: string, index: number) => {
    const cod = linea.trim().toLowerCase();
    if (!cod) return null;
    const info = dbPrecios.find((p: any) => String(p.codigo).toLowerCase() === cod);
    const foto = bancoFotos[cod];

    return (
      <div key={index} style={{
        width: '350px', backgroundColor: 'white', borderRadius: '30px', 
        overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', margin: '20px auto',
        textAlign: 'left'
      }}>
        <div style={{ position: 'relative', height: '350px', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ 
            position: 'absolute', top: '20px', left: '20px', backgroundColor: '#d90429', 
            color: 'white', padding: '5px 15px', borderRadius: '20px', fontWeight: 'bold', fontSize: '12px', zIndex: 1
          }}>SKU: {cod.toUpperCase()}</span>
          {foto ? (
            <img src={foto} alt={cod} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ color: '#ccc' }}>SIN IMAGEN</span>
          )}
        </div>
        <div style={{ backgroundColor: 'black', padding: '25px', color: 'white' }}>
          <h2 style={{ fontSize: '18px', margin: 0, textTransform: 'uppercase', minHeight: '50px' }}>
            {info?.descripcion || "PRODUCTO NO ENCONTRADO"}
          </h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
            <span style={{ fontSize: '11px', color: '#666' }}>PVP UNITARIO</span>
            <span style={{ color: '#d90429', fontSize: '28px', fontWeight: 'bold' }}>
              ${info?.precio || "0,00"}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f8f9fa', fontFamily: 'sans-serif' }}>
      {/* Sidebar Izquierda */}
      <aside style={{ width: '320px', padding: '25px', borderRight: '1px solid #eee', display: 'flex', flexDirection: 'column' }}>
        <h1 style={{ color: '#d90429', fontSize: '16px', fontWeight: 'bold', marginBottom: '30px' }}>SISTEMA COMERCIAL PRO</h1>
        
        <div style={{ marginBottom: '25px' }}>
          <p style={{ fontSize: '11px', color: '#bbb', fontWeight: 'bold', marginBottom: '10px' }}>INVENTARIO BASE</p>
          <label style={{ display: 'block', padding: '20px', border: '2px dashed #ddd', borderRadius: '15px', textAlign: 'center', cursor: 'pointer' }}>
            <input type="file" hidden onChange={handleExcelUpload} accept=".xlsx,.xls" />
            <span style={{ color: '#666' }}>{dbPrecios.length > 0 ? "✅ EXCEL CONECTADO" : "VINCULAR EXCEL"}</span>
          </label>
        </div>

        <div style={{ marginBottom: '25px' }}>
          <p style={{ fontSize: '11px', color: '#bbb', fontWeight: 'bold', marginBottom: '10px' }}>BANCO DE FOTOS</p>
          <label style={{ display: 'block', padding: '15px', backgroundColor: '#eee', borderRadius: '10px', textAlign: 'center', cursor: 'pointer' }}>
            <input type="file" hidden multiple onChange={handleBancoFotosUpload} accept="image/*" />
            CARGAR IMÁGENES
          </label>
        </div>

        <div style={{ marginTop: 'auto', backgroundColor: '#0b132b', padding: '15px', borderRadius: '15px', color: '#4cc9f0', fontSize: '11px', fontFamily: 'monospace' }}>
          <p style={{ margin: '0 0 10px 0', color: '#888' }}>STATUS SISTEMA</p>
          {statusLog.map((log, i) => <div key={i} style={{ marginBottom: '5px' }}>{log}</div>)}
        </div>
      </aside>

      {/* Área Central */}
      <main style={{ flex: 1, padding: '30px', overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: '100%', maxWidth: '800px', display: 'flex', justifyContent: 'flex-end', gap: '15px', marginBottom: '30px' }}>
          <label style={{ 
            backgroundColor: 'white', color: '#555', border: '1px solid #ddd', padding: '10px 25px', 
            borderRadius: '25px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' 
          }}>
            <input type="file" hidden accept="image/*" onChange={handleIA} />
            📷 {isScanning ? "PROCESANDO..." : "ESCANEO IA"}
          </label>
          <button style={{ 
            backgroundColor: '#d90429', color: 'white', border: 'none', padding: '10px 25px', 
            borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' 
          }}>
            EXPORTAR ({skus.split('\n').filter(s => s.trim()).length})
          </button>
        </div>

        <textarea 
          placeholder="Escribe o pega los SKUs aquí..."
          value={skus}
          onChange={(e) => setSkus(e.target.value)}
          style={{ 
            width: '100%', maxWidth: '500px', height: '80px', padding: '15px', 
            borderRadius: '15px', border: '1px solid #ddd', marginBottom: '30px', outline: 'none' 
          }}
        />

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center', width: '100%' }}>
          {skus.split('\n').map((linea, i) => renderCard(linea, i))}
        </div>
      </main>
    </div>
  );
}
