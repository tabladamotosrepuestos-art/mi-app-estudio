import React, { useState } from 'react';
import { extractProductsFromList } from './services/geminiService';
import * as XLSX from 'xlsx';

export default function App() {
  const [skus, setSkus] = useState("");
  const [dbPrecios, setDbPrecios] = useState<any[]>([]);
  const [bancoFotos, setBancoFotos] = useState<Record<string, string>>({});
  const [statusLog, setStatusLog] = useState<string[]>(["[SISTEMA] Listo"]);
  const [isScanning, setIsScanning] = useState(false);

  // CONFIGURACIÓN DINÁMICA DE STUDIO IA
  const [ofertaGlobal, setOfertaGlobal] = useState(0);
  const [cantidadParaPack, setCantidadParaPack] = useState(1); // X unidades
  const [reglasPack, setReglasPack] = useState([
    { x: 3, y: 5 },
    { x: 5, y: 7 },
    { x: 10, y: 10 }
  ]);

  const addLog = (msg: string) => setStatusLog(prev => [...prev.slice(-3), `> ${msg}`]);

  // --- FUNCIONES DE CARGA ---
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
        const nombre = file.name.split('.')[0].toLowerCase().trim();
        nuevoBanco[nombre] = reader.result as string;
        setBancoFotos({ ...nuevoBanco });
      };
      reader.readAsDataURL(file);
    });
    addLog("Fotos cargadas correctamente");
  };

  // --- MOTOR DE CÁLCULO SEGÚN TU PROMPT ---
  const calcularPrecioStudio = (costo: number, rent: number) => {
    // 1. Precio Base
    const precioBase = costo * (1 + rent / 100);

    // 2. Buscar la mejor regla de pack según la cantidad seleccionada
    const reglaAplicable = [...reglasPack]
      .sort((a, b) => b.x - a.x) // Mayor cantidad = Mayor prioridad
      .find(r => cantidadParaPack >= r.x);

    let descuentoFinal = 0;
    let esPack = false;

    if (reglaAplicable) {
      descuentoFinal = reglaAplicable.y; // Prioridad al Pack
      esPack = true;
    } else {
      descuentoFinal = ofertaGlobal; // Si no llega al pack, aplica Global
    }

    const unitario = precioBase * (1 - descuentoFinal / 100);
    return { unitario, descuentoFinal, esPack };
  };

  const renderCard = (linea: string, index: number) => {
    const cod = linea.trim();
    if (!cod) return null;
    const info = dbPrecios.find((p: any) => String(p.SKU).trim() === cod);
    const foto = bancoFotos[cod.toLowerCase()];

    const { unitario, descuentoFinal, esPack } = info 
      ? calcularPrecioStudio(parseFloat(info.costo), parseFloat(info["rentabilidad "]))
      : { unitario: 0, descuentoFinal: 0, esPack: false };

    return (
      <div key={index} style={{ width: '350px', backgroundColor: 'white', borderRadius: '40px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', margin: '15px' }}>
        <div style={{ position: 'relative', height: '350px', backgroundColor: '#f9f9f9' }}>
          <div style={{ position: 'absolute', top: '20px', left: '20px', backgroundColor: '#d90429', color: 'white', padding: '5px 15px', borderRadius: '20px', fontWeight: 'bold', fontSize: '11px', zIndex: 2 }}>SKU: {cod}</div>
          {foto && <img src={foto} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
        </div>
        <div style={{ backgroundColor: 'black', padding: '25px', color: 'white' }}>
          <h2 style={{ fontSize: '16px', margin: '0 0 10px 0', textTransform: 'uppercase', minHeight: '40px' }}>{info?.["NOMBRE "] || "PRODUCTO"}</h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <p style={{ fontSize: '11px', color: esPack ? '#4cc9f0' : '#d90429', fontWeight: 'bold', margin: 0 }}>
                {esPack ? `PACK ${cantidadParaPack} UN. -${descuentoFinal}%` : `OFERTA -${descuentoFinal}%`}
              </p>
              <p style={{ fontSize: '9px', color: '#555', margin: 0 }}>STUDIO IA - PRO</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#d90429', fontSize: '30px', fontWeight: 'bold' }}>${unitario.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</div>
              <p style={{ fontSize: '9px', color: '#555', margin: 0 }}>PVP UNITARIO</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f4f7f6', fontFamily: 'sans-serif' }}>
      <aside style={{ width: '320px', padding: '25px', backgroundColor: 'white', borderRight: '1px solid #eee', overflowY: 'auto' }}>
        <h1 style={{ color: '#d90429', fontSize: '18px', fontWeight: 'bold', marginBottom: '30px' }}>STUDIO IA PRO</h1>
        
        <label style={{ display: 'block', padding: '15px', border: '1px dashed #ddd', borderRadius: '12px', textAlign: 'center', cursor: 'pointer', marginBottom: '10px' }}>
          <input type="file" hidden onChange={handleExcelUpload} />
          {dbPrecios.length > 0 ? "✅ EXCEL VINCULADO" : "VINCULAR EXCEL"}
        </label>

        <label style={{ display: 'block', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '12px', textAlign: 'center', cursor: 'pointer', marginBottom: '25px' }}>
          <input type="file" hidden multiple onChange={handleBancoFotosUpload} />
          📁 CARGAR FOTOS
        </label>

        <p style={{ fontSize: '11px', color: '#bbb', fontWeight: 'bold', marginBottom: '10px' }}>SIMULAR CANTIDAD (PARA PACK)</p>
        <input type="number" value={cantidadParaPack} onChange={(e) => setCantidadParaPack(parseInt(e.target.value))} style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #d90429', marginBottom: '20px', fontWeight: 'bold', fontSize: '16px' }} />

        <p style={{ fontSize: '11px', color: '#bbb', fontWeight: 'bold', marginBottom: '10px' }}>REGLAS DE PACK (EDITABLES)</p>
        {reglasPack.map((r, i) => (
          <div key={i} style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
            <input type="number" value={r.x} onChange={(e) => {
              const n = [...reglasPack]; n[i].x = parseInt(e.target.value) || 0; setReglasPack(n);
            }} style={{ width: '50px', padding: '8px', border: '1px solid #eee', borderRadius: '8px' }} />
            <input type="number" value={r.y} onChange={(e) => {
              const n = [...reglasPack]; n[i].y = parseInt(e.target.value) || 0; setReglasPack(n);
            }} style={{ flex: 1, padding: '8px', border: '1px solid #eee', borderRadius: '8px', color: '#d90429', fontWeight: 'bold' }} />
          </div>
        ))}

        <p style={{ fontSize: '11px', color: '#bbb', fontWeight: 'bold', marginTop: '20px', marginBottom: '10px' }}>OFERTA GLOBAL</p>
        <div style={{ display: 'flex', gap: '5px' }}>
          {[0, 10, 20, 30].map(p => (
            <button key={p} onClick={() => setOfertaGlobal(p)} style={{ flex: 1, padding: '10px', borderRadius: '10px', backgroundColor: ofertaGlobal === p ? '#d90429' : 'white', color: ofertaGlobal === p ? 'white' : 'black', border: '1px solid #eee', fontWeight: 'bold', cursor: 'pointer' }}>{p}%</button>
          ))}
        </div>
      </aside>

      <main style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
        <textarea value={skus} onChange={(e) => setSkus(e.target.value)} placeholder="Pegar SKUs aquí..." style={{ width: '100%', height: '80px', borderRadius: '20px', padding: '15px', border: '1px solid #eee', marginBottom: '20px' }} />
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
          {skus.split('\n').map((l, i) => renderCard(l, i))}
        </div>
      </main>
    </div>
  );
}
