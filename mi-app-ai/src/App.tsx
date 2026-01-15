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
  // Buscamos la foto limpiando espacios y minúsculas para que coincida siempre
  const foto = bancoFotos[producto.sku.toLowerCase().trim()];
  const precioBase = producto.costo * (1 + producto.rent / 100);
  const reglaPack = [...reglasPack].sort((a, b) => b.x - a.x).find(r => producto.cantidad >= r.x);
  const descFinal = reglaPack ? reglaPack.y : producto.descuentoManual;
  const unitarioFinal = precioBase * (1 - descFinal / 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%', maxWidth: '380px' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '25px', padding: '18px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ backgroundColor: '#e8f5e9', color: '#2ecc71', padding: '4px 10px', borderRadius: '10px', fontSize: '9px', fontWeight: 'bold' }}>EN INVENTARIO</span>
          <button onClick={onDelete} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ddd' }}>✕</button>
        </div>
        <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '12px' }}>{producto.nombre}</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[1, 3, 6, 12].map(n => (
            <button key={n} onClick={() => onUpdate({...producto, cantidad: n})} 
              style={{ flex: 1, padding: '12px 0', borderRadius: '12px', border: 'none', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: producto.cantidad === n ? '#d90429' : '#f0f0f0', color: producto.cantidad === n ? 'white' : '#666' }}>x{n}</button>
          ))}
        </div>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '35px', overflow: 'hidden', boxShadow: '0 20px 45px rgba(0,0,0,0.12)', position: 'relative' }}>
        <div style={{ height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', padding: '20px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '15px', left: '15px', background: '#d90429', color: 'white', padding: '5px 12px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold', zIndex: 2 }}>SKU: {producto.sku}</div>
          {descFinal > 0 && (
            <div style={{ position: 'absolute', top: '15px', right: '15px', background: '#d90429', color: 'white', width: '55px', height: '55px', borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontWeight: '900', zIndex: 2 }}>
              <span style={{ fontSize: '8px' }}>AHORRA</span>
              <span style={{ fontSize: '16px' }}>{descFinal}%</span>
            </div>
          )}
          {foto ? <img src={foto} alt="producto" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} /> : <div style={{ color: '#eee', fontWeight: 'bold' }}>SIN IMAGEN</div>}
        </div>
        <div style={{ backgroundColor: 'black', padding: '25px', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
            <div style={{ flex: 1 }}><h4 style={{ margin: 0, fontSize: '15px', textTransform: 'uppercase', fontWeight: '900' }}>{producto.nombre}</h4></div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '10px', textDecoration: 'line-through', color: '#555' }}>${precioBase.toFixed(0)}</div>
              <div style={{ fontSize: '26px', color: '#d90429', fontWeight: '900' }}>${unitarioFinal.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</div>
            </div>
          </div>
          <div style={{ backgroundColor: '#d90429', borderRadius: '22px', padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '9px', fontWeight: 'bold', opacity: 0.9 }}>VALOR TOTAL</div>
                <div style={{ fontSize: '20px', fontWeight: '900', background: 'white', color: '#d90429', padding: '4px 12px', borderRadius: '12px', marginTop: '5px' }}>${(unitarioFinal * producto.cantidad).toLocaleString('es-AR', { maximumFractionDigits: 0 })}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '9px', fontWeight: 'bold' }}>PRECIO BAJA A</div>
                <div style={{ fontSize: '20px', fontWeight: '900' }}>${unitarioFinal.toLocaleString('es-AR', { maximumFractionDigits: 0 })} <span style={{fontSize: '10px'}}>c/u</span></div>
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
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkSize = () => setIsMobile(window.innerWidth < 1024);
    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, []);

  const manejarFotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(f => {
      const r = new FileReader();
      r.onloadend = () => {
        const nombreArchivo = f.name.split('.')[0].toLowerCase().trim();
        setBancoFotos(prev => ({ ...prev, [nombreArchivo]: r.result as string }));
      };
      r.readAsDataURL(f);
    });
  };

  const agregar = () => {
    skuInput.split('\n').forEach(s => {
      const c = s.trim(); if (!c) return;
      const info = dbPrecios.find((p: any) => String(p.SKU).trim() === c);
      setItems(prev => [{
        id: Date.now() + Math.random(),
        sku: c,
        nombre: info?.["NOMBRE "] || "PRODUCTO",
        costo: parseFloat(info?.costo) || 0,
        rent: parseFloat(info?.["rentabilidad "]) || 0,
        cantidad: 1,
        descuentoManual: 0
      }, ...prev]);
    });
    setSkuInput("");
  };

  return (
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', height: '100vh', background: '#f4f7f9', fontFamily: 'sans-serif', overflow: 'hidden' }}>
      
      <aside style={{ width: isMobile ? '100%' : '340px', background: 'white', padding: '30px', borderRight: '1px solid #e0e6ed', overflowY: 'auto', flexShrink: 0 }}>
        <h2 style={{ color: '#d90429', fontSize: '20px', fontWeight: '900', marginBottom: '30px' }}>STUDIO IA</h2>
        
        <div style={{ marginBottom: '25px' }}>
           <p style={{ fontSize: '10px', fontWeight: 'bold', color: '#aaa', marginBottom: '10px' }}>EXCEL BASE</p>
           <input type="file" onChange={(e) => {
             const file = e.target.files?.[0];
             if (!file) return;
             const r = new FileReader(); 
             r.onload = (evt) => {
               const bstr = evt.target?.result;
               const wb = XLSX.read(bstr, { type: 'binary' });
               setDbPrecios(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]));
             };
             r.readAsBinaryString(file);
           }} />
        </div>

        <div style={{ marginBottom: '25px' }}>
           <p style={{ fontSize: '10px', fontWeight: 'bold', color: '#aaa', marginBottom: '10px' }}>REGLAS DE PACK (%)</p>
           {reglasPack.map((r, i) => (
             <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input type="number" value={r.x} onChange={(e) => {
                  const n = [...reglasPack]; n[i].x = parseInt(e.target.value) || 0; setReglasPack(n);
                }} style={{ width: '50px', borderRadius: '8px', border: '1px solid #eee', padding: '5px', textAlign: 'center' }} />
                <input type="number" value={r.y} onChange={(e) => {
                  const n = [...reglasPack]; n[i].y = parseInt(e.target.value) || 0; setReglasPack(n);
                }} style={{ flex: 1, borderRadius: '8px', border: '1px solid #eee', padding: '5px', textAlign: 'center', color: '#d90429', fontWeight: 'bold' }} />
             </div>
           ))}
        </div>

        {/* BOTÓN DE FOTOS REPARADO */}
        <div style={{ position: 'relative', marginTop: '20px' }}>
          <label style={{ display: 'block', padding: '15px', background: '#d90429', color: 'white', borderRadius: '15px', textAlign: 'center', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
             📷 CARGAR FOTOS
             <input type="file" hidden multiple onChange={manejarFotos} accept="image/*" />
          </label>
          <p style={{ fontSize: '9px', color: '#999', marginTop: '5px', textAlign: 'center' }}>{Object.keys(bancoFotos).length} fotos cargadas</p>
        </div>
      </aside>

      <main style={{ flex: 1, padding: isMobile ? '20px' : '40px', overflowY: 'auto' }}>
        <div style={{ maxWidth: '500px', margin: '0 auto 40px', textAlign: 'center' }}>
           <textarea value={skuInput} onChange={(e) => setSkuInput(e.target.value)} placeholder="01570&#10;01539" 
                style={{ width: '100%', height: '80px', padding: '20px', borderRadius: '25px', border: '1px solid #eee', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', outline: 'none', fontSize: '18px' }} />
           <button onClick={agregar} style={{ width: '100%', marginTop: '15px', padding: '18px', background: '#d90429', color: 'white', border: 'none', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}>GENERAR FICHAS</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(380px, 1fr))', gap: '30px', justifyItems: 'center' }}>
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
