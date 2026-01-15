import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

interface Regla { x: number; y: number; }
interface Producto {
  id: number; sku: string; nombre: string; costo: number; rent: number;
  cantidad: number; descuentoManual: number;
}

const FichaStudioIA = ({ producto, bancoFotos, reglasPack, onUpdate, onDelete }: { 
  producto: Producto, bancoFotos: Record<string, string>, reglasPack: Regla[], 
  onUpdate: (p: Producto) => void, onDelete: () => void 
}) => {
  const foto = bancoFotos[producto.sku.toLowerCase().trim()];
  const precioBase = producto.costo * (1 + producto.rent / 100);
  const reglaPack = [...reglasPack].sort((a, b) => b.x - a.x).find(r => producto.cantidad >= r.x);
  const descFinal = reglaPack ? reglaPack.y : producto.descuentoManual;
  const unitarioFinal = precioBase * (1 - descFinal / 100);

  return (
    <div className="card-container" style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', maxWidth: '380px', margin: '0 auto' }}>
      {/* EDITOR */}
      <div style={{ backgroundColor: 'white', borderRadius: '25px', padding: '15px', boxShadow: '0 5px 20px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ color: '#2ecc71', fontSize: '10px', fontWeight: 'bold' }}>● EN INVENTARIO</span>
          <button onClick={onDelete} style={{ border: 'none', background: 'none', color: '#ddd', fontSize: '18px' }}>✕</button>
        </div>
        <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '10px' }}>{producto.nombre}</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {/* Botones de Pack más grandes para móvil */}
          {[1, 3, 6, 12].map(n => (
            <button key={n} onClick={() => onUpdate({...producto, cantidad: n})} 
              style={{ flex: 1, padding: '10px 0', borderRadius: '10px', border: 'none', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: producto.cantidad === n ? '#d90429' : '#f0f0f0', color: producto.cantidad === n ? 'white' : '#666' }}>x{n}</button>
          ))}
        </div>
      </div>

      {/* FICHA VISUAL */}
      <div style={{ backgroundColor: 'white', borderRadius: '30px', overflow: 'hidden', boxShadow: '0 15px 30px rgba(0,0,0,0.1)', position: 'relative' }}>
        <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', padding: '15px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '15px', left: '15px', background: '#d90429', color: 'white', padding: '4px 10px', borderRadius: '10px', fontSize: '9px', fontWeight: 'bold', zIndex: 2 }}>SKU: {producto.sku}</div>
          {descFinal > 0 && (
            <div style={{ position: 'absolute', top: '15px', right: '15px', background: '#d90429', color: 'white', width: '45px', height: '45px', borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', zIndex: 2 }}>
              <span style={{ fontSize: '7px' }}>-{descFinal}%</span>
            </div>
          )}
          {foto ? <img src={foto} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} /> : <div style={{ color: '#eee', fontSize: '12px' }}>SIN IMAGEN</div>}
        </div>
        <div style={{ backgroundColor: 'black', padding: '20px', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h4 style={{ margin: 0, fontSize: '14px', textTransform: 'uppercase', fontWeight: '900', flex: 1 }}>{producto.nombre}</h4>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '10px', textDecoration: 'line-through', color: '#555' }}>${precioBase.toFixed(0)}</div>
              <div style={{ fontSize: '24px', color: '#d90429', fontWeight: '900' }}>${unitarioFinal.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</div>
            </div>
          </div>
          <div style={{ backgroundColor: '#d90429', borderRadius: '15px', padding: '12px' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                   <div style={{ fontSize: '8px', fontWeight: 'bold' }}>TOTAL PACK ({producto.cantidad} un.)</div>
                   <div style={{ fontSize: '16px', fontWeight: '900', background: 'white', color: '#d90429', padding: '2px 8px', borderRadius: '8px' }}>${(unitarioFinal * producto.cantidad).toLocaleString('es-AR', { maximumFractionDigits: 0 })}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                   <div style={{ fontSize: '8px', fontWeight: 'bold' }}>PRECIO BAJA A</div>
                   <div style={{ fontSize: '18px', fontWeight: '900' }}>${unitarioFinal.toLocaleString('es-AR', { maximumFractionDigits: 0 })} <span style={{fontSize:'8px'}}>c/u</span></div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [skuInput, setSkuInput] = useState("");
  const [items, setItems] = useState<Producto[]>([]);
  const [dbPrecios, setDbPrecios] = useState<any[]>([]);
  const [bancoFotos, setBancoFotos] = useState<Record<string, string>>({});
  const [reglasPack, setReglasPack] = useState<Regla[]>([{ x: 3, y: 10 }, { x: 7, y: 15 }, { x: 12, y: 20 }]);
  const [menuOpen, setMenuOpen] = useState(false);

  const agregar = () => {
    skuInput.split('\n').forEach(s => {
      const c = s.trim(); if (!c) return;
      const info = dbPrecios.find((p: any) => String(p.SKU).trim() === c);
      setItems(prev => [{ id: Date.now() + Math.random(), sku: c, nombre: info?.["NOMBRE "] || "PRODUCTO", costo: parseFloat(info?.costo) || 0, rent: parseFloat(info?.["rentabilidad "]) || 0, cantidad: 1, descuentoManual: 0 }, ...prev]);
    });
    setSkuInput("");
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f4f7f9', fontFamily: 'sans-serif' }}>
      
      {/* Botón Flotante para Configuración en Móvil */}
      <button onClick={() => setMenuOpen(!menuOpen)} style={{ position: 'fixed', bottom: '20px', right: '20px', width: '60px', height: '60px', borderRadius: '50%', background: '#d90429', color: 'white', border: 'none', boxShadow: '0 10px 20px rgba(217,4,4,0.3)', zIndex: 1000, fontWeight: 'bold', fontSize: '20px' }}>
        {menuOpen ? '✕' : '⚙️'}
      </button>

      {/* SIDEBAR ADAPTATIVO */}
      <aside style={{ 
        position: 'fixed', left: 0, top: 0, bottom: 0, width: '300px', background: 'white', padding: '30px', borderRight: '1px solid #ddd', zIndex: 999, transition: 'transform 0.3s ease',
        transform: menuOpen ? 'translateX(0)' : 'translateX(-100%)',
        boxShadow: menuOpen ? '0 0 50px rgba(0,0,0,0.1)' : 'none'
      }}>
        <h2 style={{ color: '#d90429', fontSize: '18px', fontWeight: '900' }}>STUDIO IA</h2>
        <div style={{ marginTop: '20px' }}>
          <p style={{ fontSize: '10px', fontWeight: 'bold', color: '#aaa' }}>EXCEL BASE</p>
          <input type="file" onChange={(e) => {
            const r = new FileReader(); r.onload = (evt) => setDbPrecios(XLSX.utils.sheet_to_json(XLSX.read(evt.target?.result, {type:'binary'}).Sheets[XLSX.read(evt.target?.result, {type:'binary'}).SheetNames[0]]));
            r.readAsBinaryString(e.target.files![0]);
          }} style={{ fontSize: '12px', width: '100%' }} />
        </div>
        <div style={{ marginTop: '20px' }}>
          <p style={{ fontSize: '10px', fontWeight: 'bold', color: '#aaa' }}>REGLAS %</p>
          {reglasPack.map((r, i) => (
            <div key={i} style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
              <input type="number" value={r.x} onChange={(e) => { const n = [...reglasPack]; n[i].x = parseInt(e.target.value); setReglasPack(n); }} style={{ width: '50px' }} />
              <input type="number" value={r.y} onChange={(e) => { const n = [...reglasPack]; n[i].y = parseInt(e.target.value); setReglasPack(n); }} style={{ flex: 1 }} />
            </div>
          ))}
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
           <textarea value={skuInput} onChange={(e) => setSkuInput(e.target.value)} placeholder="Pega SKUs aquí..." 
             style={{ width: '100%', maxWidth: '500px', height: '80px', borderRadius: '20px', border: '1px solid #ddd', padding: '15px', fontSize: '16px', outline: 'none' }} />
           <button onClick={agregar} style={{ width: '100%', maxWidth: '500px', marginTop: '10px', padding: '15px', background: '#d90429', color: 'white', border: 'none', borderRadius: '15px', fontWeight: 'bold' }}>GENERAR FICHAS</button>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: '20px',
          paddingBottom: '100px'
        }}>
          {items.map(item => (
            <FichaStudioIA key={item.id} producto={item} bancoFotos={bancoFotos} reglasPack={reglasPack}
                           onUpdate={(u) => setItems(items.map(i => i.id === item.id ? u : i))}
                           onDelete={() => setItems(items.filter(i => i.id !== item.id))} />
          ))}
        </div>
      </main>
    </div>
  );
}
