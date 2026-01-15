import React, { useState, useMemo } from 'react';
import { extractProductsFromList } from './services/geminiService';
import * as XLSX from 'xlsx';

export default function App() {
  const [skus, setSkus] = useState("");
  const [dbPrecios, setDbPrecios] = useState<any[]>([]);
  const [bancoFotos, setBancoFotos] = useState<Record<string, string>>({});
  const [statusLog, setStatusLog] = useState<string[]>(["[SISTEMA] Listo"]);
  
  // Estados para las Reglas de Pack y Oferta Global
  const [ofertaGlobal, setOfertaGlobal] = useState(0);
  const [reglasPack, setReglasPack] = useState({
    pack1: { un: 3, desc: 5 },
    pack2: { un: 6, desc: 10 },
    pack3: { un: 12, desc: 15 }
  });

  const addLog = (msg: string) => setStatusLog(prev => [...prev.slice(-3), `> ${msg}`]);

  // Función para calcular el precio final con descuentos
  const calcularPrecioFinal = (precioBase: number) => {
    const conDescuentoGlobal = precioBase * (1 - ofertaGlobal / 100);
    return conDescuentoGlobal.toLocaleString('es-AR', { minimumFractionDigits: 2 });
  };

  const renderCard = (linea: string, index: number) => {
    const cod = linea.trim().toLowerCase();
    if (!cod) return null;
    const info = dbPrecios.find((p: any) => String(p.codigo).toLowerCase() === cod);
    const foto = bancoFotos[cod];

    return (
      <div key={index} style={{ width: '380px', backgroundColor: 'white', borderRadius: '40px', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.15)', margin: '20px' }}>
        <div style={{ position: 'relative', height: '380px', backgroundColor: '#f9f9f9' }}>
          <div style={{ position: 'absolute', top: '25px', left: '25px', backgroundColor: '#d90429', color: 'white', padding: '6px 18px', borderRadius: '25px', fontWeight: 'bold', fontSize: '13px', zIndex: 2 }}>
            SKU: {cod.toUpperCase()}
          </div>
          {foto && <img src={foto} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
        </div>
        
        <div style={{ backgroundColor: '#000', padding: '30px', color: 'white', position: 'relative' }}>
          <h2 style={{ fontSize: '20px', margin: '0 0 10px 0', textTransform: 'uppercase', lineHeight: '1.2' }}>
            {info?.descripcion || "PRODUCTO"}
          </h2>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <p style={{ fontSize: '10px', color: '#666', margin: 0 }}>SISTEMA COMERCIAL PROFESIONAL</p>
              <p style={{ fontSize: '10px', color: '#666', margin: 0 }}>STUDIO IA</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ color: '#d90429', fontSize: '36px', fontWeight: 'bold' }}>
                ${info ? calcularPrecioFinal(info.precio) : "0,00"}
              </span>
              <p style={{ fontSize: '10px', color: '#666', margin: 0 }}>PVP UNITARIO</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f4f7f6', fontFamily: 'sans-serif' }}>
      {/* Sidebar de Configuración */}
      <aside style={{ width: '340px', padding: '25px', borderRight: '1px solid #e0e0e0', overflowY: 'auto', backgroundColor: '#fff' }}>
        <h1 style={{ fontSize: '16px', color: '#d90429', fontWeight: 'bold', marginBottom: '40px' }}>SISTEMA COMERCIAL <span style={{color:'#000'}}>PRO</span></h1>
        
        {/* Reglas de Pack */}
        <section style={{ marginBottom: '30px' }}>
          <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#ccc', marginBottom: '15px' }}>REGLAS DE PACK</p>
          {[1, 2, 3].map(n => (
            <div key={n} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <input type="number" style={{ width: '50px', padding: '8px', borderRadius: '8px', border: '1px solid #eee' }} defaultValue={n === 1 ? 3 : n === 2 ? 6 : 12} />
              <span style={{ fontSize: '12px', color: '#bbb' }}>UN. →</span>
              <input type="number" style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #eee', color: '#d90429', fontWeight: 'bold' }} defaultValue={n === 1 ? 5 : n === 2 ? 10 : 15} />
              <span style={{ fontSize: '12px', color: '#bbb' }}>%</span>
            </div>
          ))}
        </section>

        {/* Oferta Global */}
        <section style={{ marginBottom: '30px' }}>
          <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#ccc', marginBottom: '15px' }}>OFERTA GLOBAL</p>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[0, 10, 20, 30].map(pct => (
              <button key={pct} onClick={() => setOfertaGlobal(pct)} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid #eee', backgroundColor: ofertaGlobal === pct ? '#d90429' : 'white', color: ofertaGlobal === pct ? 'white' : 'black', fontWeight: 'bold', cursor: 'pointer' }}>
                {pct}%
              </button>
            ))}
          </div>
        </section>

        <div style={{ backgroundColor: '#0b132b', padding: '20px', borderRadius: '20px', color: '#4cc9f0', fontSize: '12px', fontFamily: 'monospace' }}>
          <p style={{ margin: '0 0 10px 0', color: '#fff' }}>STATUS SISTEMA</p>
          {statusLog.map((log, i) => <div key={i} style={{ marginBottom: '5px' }}>{log}</div>)}
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '40px' }}>
           <button style={{ backgroundColor: '#d90429', color: 'white', border: 'none', padding: '12px 30px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
             EXPORTAR ({skus.split('\n').filter(s => s.trim()).length})
           </button>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <textarea 
            value={skus} 
            onChange={(e) => setSkus(e.target.value)} 
            placeholder="Pega aquí los SKUs..." 
            style={{ width: '100%', maxWidth: '500px', height: '100px', borderRadius: '20px', padding: '20px', border: '1px solid #eee', boxShadow: '0 10px 20px rgba(0,0,0,0.02)', outline: 'none', marginBottom: '40px' }}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
            {skus.split('\n').map((linea, i) => renderCard(linea, i))}
          </div>
        </div>
      </main>
    </div>
  );
}
