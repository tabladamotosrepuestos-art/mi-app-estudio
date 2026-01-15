import React, { useState } from 'react';
import { extractProductsFromList } from './services/geminiService';
import * as XLSX from 'xlsx';

export default function App() {
  const [skus, setSkus] = useState("");
  const [dbPrecios, setDbPrecios] = useState<any[]>([]);
  const [bancoFotos, setBancoFotos] = useState<Record<string, string>>({});
  const [statusLog, setStatusLog] = useState<string[]>(["[SISTEMA] Listo"]);
  const [isScanning, setIsScanning] = useState(false);

  // --- CONFIGURACIÓN DINÁMICA (Basada en tu Prompt) ---
  const [ofertaGlobal, setOfertaGlobal] = useState(0);
  const [reglasPack, setReglasPack] = useState([
    { x: 3, y: 5 },
    { x: 5, y: 7 },
    { x: 10, y: 10 }
  ]);

  // --- MOTOR DE CÁLCULO STUDIO IA (Puntos 4, 5 y 6) ---
  const calcularDetalleVenta = (costo: number, rentabilidad: number, cantidadDeseada: number = 1) => {
    // 1. Precio Base del producto (Costo + Rentabilidad del Excel)
    const precioBase = costo * (1 + rentabilidad / 100);

    // 2. Aplicar descuento por pack (si corresponde)
    // Buscamos la mejor regla (mayor cantidad) que se cumpla
    const reglaAplicable = [...reglasPack]
      .sort((a, b) => b.x - a.x) // Ordenadas por cantidad (mayor prioridad)
      .find(r => cantidadDeseada >= r.x);

    let descuentoFinal = 0;
    
    if (reglaAplicable) {
      // SI HAY PACK → Tiene prioridad
      descuentoFinal = reglaAplicable.y;
    } else {
      // SI NO HAY PACK → Aplicar descuento global
      descuentoFinal = ofertaGlobal;
    }

    // 3. Calcular precio final unitario
    const precioUnitarioFinal = precioBase * (1 - descuentoFinal / 100);
    
    // 4. Calcular precio total por cantidad
    const precioTotal = precioUnitarioFinal * cantidadDeseada;

    return {
      unitario: precioUnitarioFinal,
      total: precioTotal,
      aplicóPack: !!reglaAplicable,
      pct: descuentoFinal
    };
  };

  const renderCard = (linea: string, index: number) => {
    const cod = linea.trim();
    if (!cod) return null;
    const info = dbPrecios.find((p: any) => String(p.SKU).trim() === cod);
    const foto = bancoFotos[cod.toLowerCase()];

    // Calculamos para 1 unidad (Vista previa)
    const calculo = info 
      ? calcularDetalleVenta(parseFloat(info.costo), parseFloat(info["rentabilidad "])) 
      : { unitario: 0, pct: 0, aplicóPack: false };

    return (
      <div key={index} style={{ width: '360px', backgroundColor: 'white', borderRadius: '40px', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.1)', margin: '15px' }}>
        <div style={{ position: 'relative', height: '360px', backgroundColor: '#f9f9f9' }}>
          <div style={{ position: 'absolute', top: '25px', left: '25px', backgroundColor: '#d90429', color: 'white', padding: '6px 15px', borderRadius: '25px', fontWeight: 'bold', fontSize: '12px', zIndex: 1 }}>
            SKU: {cod}
          </div>
          {foto && <img src={foto} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
        </div>
        
        <div style={{ backgroundColor: 'black', padding: '25px', color: 'white' }}>
          <h2 style={{ fontSize: '17px', margin: '0 0 10px 0', textTransform: 'uppercase', minHeight: '40px' }}>
            {info?.["NOMBRE "] || "PRODUCTO NO ENCONTRADO"}
          </h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <p style={{ fontSize: '11px', color: calculo.aplicóPack ? '#4cc9f0' : '#d90429', fontWeight: 'bold', margin: 0 }}>
                DESC. APLICADO: {calculo.pct}%
              </p>
              <p style={{ fontSize: '9px', color: '#555', margin: 0 }}>ORDEN: {calculo.aplicóPack ? 'PACK PRIORITARIO' : 'GLOBAL UNITARIO'}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#d90429', fontSize: '32px', fontWeight: 'bold' }}>
                ${calculo.unitario.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </div>
              <p style={{ fontSize: '9px', color: '#555', margin: 0 }}>PVP UNITARIO FINAL</p>
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
        
        <label style={{ display: 'block', padding: '15px', border: '1px dashed #ddd', borderRadius: '12px', textAlign: 'center', cursor: 'pointer', marginBottom: '20px' }}>
          <input type="file" hidden onChange={(e) => {
            const file = e.target.files?.[0];
            const reader = new FileReader();
            reader.onload = (evt) => {
              const wb = XLSX.read(evt.target?.result, { type: 'binary' });
              setDbPrecios(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]));
            };
            reader.readAsBinaryString(file!);
          }} />
          {dbPrecios.length > 0 ? "✅ LISTA CONECTADA" : "VINCULAR EXCEL"}
        </label>

        <p style={{ fontSize: '11px', color: '#bbb', fontWeight: 'bold', marginBottom: '10px' }}>4. REGLAS DE PACK (EDITABLES)</p>
        {reglasPack.map((r, i) => (
          <div key={i} style={{ display: 'flex', gap: '5px', marginBottom: '8px' }}>
            <input type="number" value={r.x} onChange={(e) => {
              const n = [...reglasPack]; n[i].x = parseInt(e.target.value); setReglasPack(n);
            }} style={{ width: '60px', padding: '8px', borderRadius: '8px', border: '1px solid #eee' }} />
            <span style={{alignSelf:'center', fontSize:'12px'}}>un. →</span>
            <input type="number" value={r.y} onChange={(e) => {
              const n = [...reglasPack]; n[i].y = parseInt(e.target.value); setReglasPack(n);
            }} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #eee', color: '#d90429', fontWeight: 'bold' }} />
            <span style={{alignSelf:'center', fontSize:'12px'}}>%</span>
          </div>
        ))}

        <p style={{ fontSize: '11px', color: '#bbb', fontWeight: 'bold', marginTop: '20px', marginBottom: '10px' }}>5. DESCUENTO GLOBAL</p>
        <div style={{ display: 'flex', gap: '5px' }}>
          {[0, 10, 20, 30].map(p => (
            <button key={p} onClick={() => setOfertaGlobal(p)} style={{ flex: 1, padding: '10px', borderRadius: '10px', backgroundColor: ofertaGlobal === p ? '#d90429' : '#f8f9fa', color: ofertaGlobal === p ? 'white' : 'black', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>{p}%</button>
          ))}
        </div>

        <div style={{ marginTop: '30px', backgroundColor: '#0b132b', padding: '15px', borderRadius: '15px', color: '#4cc9f0', fontSize: '11px' }}>
          <p style={{ color: '#fff', marginBottom: '5px' }}>LÓGICA ACTIVA:</p>
          <p>1. Costo + Rentabilidad (Excel)</p>
          <p>2. Prioridad Pack s/ cantidad</p>
          <p>3. Global si no hay Pack</p>
        </div>
      </aside>

      <main style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
        <textarea value={skus} onChange={(e) => setSkus(e.target.value)} placeholder="Pegar SKUs aquí..." style={{ width: '100%', height: '80px', borderRadius: '20px', padding: '15px', border: '1px solid #eee', marginBottom: '20px', outline: 'none' }} />
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
          {skus.split('\n').map((l, i) => renderCard(l, i))}
        </div>
      </main>
    </div>
  );
}
