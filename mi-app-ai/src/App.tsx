import React, { useState } from 'react';
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '380px' }}>
      {/* PANEL EDITOR (CONTROL) */}
      <div style={{ backgroundColor: 'white', borderRadius: '25px', padding: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ backgroundColor: '#e8f5e9', color: '#2ecc71', padding: '4px 10px', borderRadius: '10px', fontSize: '10px', fontWeight: 'bold' }}>EN INVENTARIO</span>
          <button onClick={onDelete} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ddd' }}>✕</button>
        </div>
        <input style={{ width: '100%', border: 'none', fontSize: '13px', fontWeight: 'bold', marginBottom: '10px', outline: 'none' }} value={producto.nombre} readOnly />
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '9px', color: '#aaa' }}>PRECIO BASE</label>
            <div style={{ padding: '8px', background: '#f8f9fa', borderRadius: '10px', fontSize: '12px' }}>${precioBase.toLocaleString()}</div>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '9px', color: '#aaa' }}>PACK COMERCIAL</label>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[1, 3, 6, 12].map(n => (
                <button key={n} onClick={() => onUpdate({...producto, cantidad: n})} 
                  style={{ flex: 1, padding: '5px 0', borderRadius: '6px', border: 'none', fontSize: '10px', cursor: 'pointer', backgroundColor: producto.cantidad === n ? '#d90429' : '#f0f0f0', color: producto.cantidad === n ? 'white' : '#666' }}>x{n}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* FICHA VISUAL (CLIENTE) */}
      <div style={{ backgroundColor: 'white', borderRadius: '35px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', position: 'relative' }}>
        <div style={{ height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', padding: '20px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '15px', left: '15px', background: '#d90429', color: 'white', padding: '4px 12px', borderRadius: '10px', fontSize: '10px', fontWeight: 'bold' }}>SKU: {producto.sku}</div>
          {descFinal > 0 && (
            <div style={{ position: 'absolute', top: '15px', right: '15px', background: '#d90429', color: 'white', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', boxShadow: '0 5px 15px rgba(217,4,4,0.3)' }}>
              <span style={{ fontSize: '7px' }}>AHORRA</span>
              <span style={{ fontSize: '14px' }}>{descFinal}%</span>
            </div>
          )}
          {foto ? <img src={foto} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} /> : <div style={{ color: '#eee', fontWeight: 'bold' }}>SIN IMAGEN</div>}
        </div>
        <div style={{ backgroundColor: 'black', padding: '25px', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
            <div style={{ flex: 1 }}><h4 style={{ margin: 0, fontSize: '16px', textTransform: 'uppercase', fontWeight: '900' }}>{producto.nombre}</h4></div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', textDecoration: 'line-through', color: '#555' }}>${precioBase.toFixed(2)}</div>
              <div style={{ fontSize: '28px', color: '#d90429', fontWeight: '900' }}>${unitarioFinal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</div>
            </div>
          </div>
          <div style={{ backgroundColor: '#d90429', borderRadius: '20px', padding: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '9px', fontWeight: 'bold', opacity: 0.8 }}>VALOR TOTAL</div>
                <div style={{ fontSize: '18px', fontWeight: '900', background: 'white', color: '#d90429', padding: '3px 10px', borderRadius: '10px', marginTop: '4px' }}>${(unitarioFinal * producto.cantidad).toLocaleString('es-AR')}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '9px', fontWeight: 'bold' }}>EL PRECIO BAJA A</div>
                <div style={{ fontSize: '20px', fontWeight: '900' }}>${unitarioFinal.toLocaleString('es-AR', { minimumFractionDigits: 2 })} <span style={{fontSize:'10px'}}>c/u</span></div>
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
  const [reglasPack, setReglasPack] = useState<Regla[]>([{ x: 3, y: 10 }, { x: 7, y: 5 }, { x: 12, y: 15 }]);

  const agregar = () => {
    skuInput.split('\n').forEach(s => {
      const c = s.trim(); if (!c) return;
      const info = dbPrecios.find((p: any) => String(p.SKU).trim() === c);
      setItems(prev => [{ id: Date.now() + Math.random(), sku: c, nombre: info?.["NOMBRE "] || "Buscando...", costo: parseFloat(info?.costo) || 0, rent: parseFloat(info?.["rentabilidad "]) || 0, cantidad: 1, descuentoManual: 0 }, ...prev]);
    });
    setSkuInput("");
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f4f7f9', fontFamily: 'sans-serif' }}>
      {/* SIDEBAR DE CONTROL - IGUAL A STUDIO IA */}
      <aside style={{ width: '340px', background: 'white', padding: '30px', borderRight: '1px solid #e0e6ed', overflowY: 'auto' }}>
        <h2 style={{ color: '#d90429', fontSize: '18px', fontWeight: '900', marginBottom: '30px' }}>SISTEMA COMERCIAL PRO</h2>
        
        <div style={{ marginBottom: '25px' }}>
           <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#aaa', marginBottom: '10px' }}>INVENTARIO BASE</p>
           <label style={{ display: 'block', padding: '15px', border: '2px dashed #eee', borderRadius: '15px', textAlign: 'center', cursor: 'pointer', fontSize: '12px' }}>
              <input type="file" hidden onChange={(e) => {
                const r = new FileReader(); r.onload = (evt) => setDbPrecios(XLSX.utils.sheet_to_json(XLSX.read(evt.target?.result, {type:'binary'}).Sheets[XLSX.read(evt.target?.result, {type:'binary'}).SheetNames[0]]));
                r.readAsBinaryString(e.target.files![0]);
              }} /> {dbPrecios.length > 0 ? "✅ EXCEL CONECTADO" : "📁 SUBIR EXCEL"}
           </label>
        </div>

        <div style={{ marginBottom: '30px' }}>
           <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#aaa', marginBottom: '10px' }}>REGLAS DE PACK</p>
           {reglasPack.map((r, i) => (
             <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8f9fa', padding: '10px', borderRadius: '12px', marginBottom: '8px' }}>
                <input type="number" value={r.x} onChange={(e) => { const n = [...reglasPack]; n[i].x = parseInt(e.target.value) || 0; setReglasPack(n); }} style={{ width: '45px', border: '1px solid #ddd', borderRadius: '6px', textAlign: 'center' }} />
                <span style={{fontSize:'10px'}}>UN. →</span>
                <input type="number" value={r.y} onChange={(e) => { const n = [...reglasPack]; n[i].y = parseInt(e.target.value) || 0; setReglasPack(n); }} style={{ flex: 1, border: '1px solid #ddd', borderRadius: '6px', textAlign: 'center', fontWeight: 'bold', color: '#d90429' }} />
                <span style={{fontSize:'10px'}}>%</span>
             </div>
           ))}
        </div>

        <label style={{ display: 'block', padding: '15px', background: '#f8f9fa', borderRadius: '15px', textAlign: 'center', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
           <input type="file" hidden multiple onChange={(e) => {
             Array.from(e.target.files!).forEach(f => {
               const r = new FileReader(); r.onloadend = () => setBancoFotos(prev => ({ ...prev, [f.name.split('.')[0].toLowerCase().trim()]: r.result as string }));
               r.readAsDataURL(f);
             });
           }} /> 📷 BANCO FOTOS SKUS
        </label>
      </aside>

      {/* ÁREA DE TRABAJO */}
      <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        <div style={{ maxWidth: '400px', margin: '0 auto 50px', textAlign: 'center' }}>
           <div style={{ position: 'relative', marginBottom: '20px' }}>
              <textarea value={skuInput} onChange={(e) => setSkuInput(e.target.value)} placeholder="01570&#10;01539" 
                style={{ width: '100%', height: '100px', padding: '20px', borderRadius: '25px', border: '1px solid #ddd', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', outline: 'none', textAlign: 'center', fontSize: '16px' }} />
           </div>
           <button onClick={agregar} style={{ width: '100%', padding: '18px', background: '#d90429', color: 'white', border: 'none', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' }}>GENERAR FICHAS</button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', justifyContent: 'center' }}>
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
