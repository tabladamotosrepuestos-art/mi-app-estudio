import React, { useState } from 'react';
import * as XLSX from 'xlsx';

interface Regla { x: number; y: number; }
interface Producto {
  id: number; sku: string; nombre: string; costo: number; rent: number;
  cantidad: number; descuentoManual: number;
}

const FichaComercialPro = ({ producto, bancoFotos, reglasPack, onUpdate, onDelete }: { 
  producto: Producto, bancoFotos: Record<string, string>, reglasPack: Regla[], 
  onUpdate: (p: Producto) => void, onDelete: () => void 
}) => {
  const foto = bancoFotos[producto.sku.toLowerCase()];
  const precioBase = producto.costo * (1 + producto.rent / 100);
  
  // Lógica de mejor precio (Studio IA)
  const reglaPack = [...reglasPack].sort((a, b) => b.x - a.x).find(r => producto.cantidad >= r.x);
  const descFinal = reglaPack ? reglaPack.y : producto.descuentoManual;
  const unitarioFinal = precioBase * (1 - descFinal / 100);
  const valorTotal = unitarioFinal * producto.cantidad;

  return (
    <div style={{ width: '400px', fontFamily: 'sans-serif', marginBottom: '40px' }}>
      {/* PANEL DE CONTROL SUPERIOR (EDITOR) */}
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '30px 30px 0 0', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', borderBottom: '1px solid #eee' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
          <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#2ecc71' }}>● EN INVENTARIO</span>
          <button onClick={onDelete} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc' }}>✕</button>
        </div>
        <label style={{ fontSize: '9px', color: '#999', display: 'block' }}>DESCRIPCIÓN</label>
        <div style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: '10px', borderBottom: '1px solid #f0f0f0', paddingBottom: '5px' }}>{producto.nombre}</div>
        
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '9px', color: '#999' }}>PRECIO BASE</label>
            <div style={{ padding: '8px', backgroundColor: '#f9f9f9', borderRadius: '8px', fontSize: '13px' }}>${precioBase.toFixed(2)}</div>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '9px', color: '#999' }}>DCTO (%)</label>
            <input type="number" value={producto.descuentoManual} onChange={(e) => onUpdate({...producto, descuentoManual: parseInt(e.target.value) || 0})} 
                   style={{ width: '100%', padding: '8px', border: '1px solid #ffebee', borderRadius: '8px', backgroundColor: '#fff5f5', color: '#d90429', fontWeight: 'bold' }} />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#d90429' }}>PACK COMERCIAL</span>
          <div style={{ display: 'flex', gap: '5px' }}>
            {[1, 3, 6, 12].map(n => (
              <button key={n} onClick={() => onUpdate({...producto, cantidad: n})} 
                      style={{ padding: '5px 10px', borderRadius: '8px', border: 'none', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer',
                               backgroundColor: producto.cantidad === n ? '#d90429' : '#f0f0f0', color: producto.cantidad === n ? 'white' : '#666' }}>x{n}</button>
            ))}
          </div>
        </div>
      </div>

      {/* FICHA VISUAL (PARA EL CLIENTE) */}
      <div style={{ backgroundColor: 'white', borderRadius: '0 0 40px 40px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', position: 'relative' }}>
        <div style={{ position: 'relative', height: '380px' }}>
          {descFinal > 0 && (
            <div style={{ position: 'absolute', top: '20px', right: '20px', backgroundColor: '#d90429', color: 'white', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 5, boxShadow: '0 5px 15px rgba(217,4,4,0.4)' }}>
              <span style={{ fontSize: '10px', fontWeight: 'bold' }}>AHORRA</span>
              <span style={{ fontSize: '16px', fontWeight: '900' }}>{descFinal}%</span>
              <span style={{ fontSize: '8px' }}>OFF</span>
            </div>
          )}
          <div style={{ position: 'absolute', top: '20px', left: '20px', backgroundColor: '#d90429', color: 'white', padding: '5px 15px', borderRadius: '20px', fontWeight: 'bold', fontSize: '11px', zIndex: 2 }}>SKU: {producto.sku}</div>
          {foto && <img src={foto} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
        </div>

        <div style={{ backgroundColor: 'black', padding: '30px', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: '20px', margin: '0 0 5px 0', textTransform: 'uppercase', fontWeight: '900', lineHeight: '1.1' }}>{producto.nombre}</h2>
              <p style={{ fontSize: '11px', color: '#999', margin: '0 0 20px 0' }}>{producto.nombre}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', color: '#666', textDecoration: 'line-through' }}>${precioBase.toFixed(2)}</div>
              <div style={{ fontSize: '32px', color: '#d90429', fontWeight: '900' }}>${unitarioFinal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</div>
              <div style={{ fontSize: '9px', color: '#666' }}>PVP UNITARIO</div>
            </div>
          </div>

          <div style={{ backgroundColor: '#d90429', borderRadius: '25px', padding: '20px', marginTop: '10px', position: 'relative' }}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: '10px 15px', borderRadius: '15px', fontSize: '11px', fontWeight: 'bold', flex: 1 }}>LLEVANDO {producto.cantidad} UNIDADES</div>
              <div style={{ backgroundColor: '#f1c40f', color: 'black', padding: '10px 15px', borderRadius: '15px', fontSize: '11px', fontWeight: '900', flex: 0.8, textAlign: 'center' }}>¡MEJOR PRECIO!</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <div style={{ fontSize: '10px', fontWeight: 'bold', opacity: 0.8 }}>VALOR TOTAL</div>
                <div style={{ fontSize: '20px', fontWeight: '900', backgroundColor: 'white', color: '#d90429', padding: '5px 15px', borderRadius: '15px', display: 'inline-block' }}>${valorTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '10px', fontWeight: 'bold' }}>EL PRECIO BAJA A</div>
                <div style={{ fontSize: '24px', fontWeight: '900' }}>${unitarioFinal.toLocaleString('es-AR', { minimumFractionDigits: 2 })} <span style={{ fontSize: '12px' }}>c/u</span></div>
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
  const [reglasPack, setReglasPack] = useState<Regla[]>([{ x: 3, y: 10 }, { x: 6, y: 15 }, { x: 12, y: 20 }]);

  const agregarProducto = () => {
    const cod = skuInput.trim();
    if (!cod) return;
    const info = dbPrecios.find((p: any) => String(p.SKU).trim() === cod);
    const nuevo: Producto = {
      id: Date.now(), sku: cod, nombre: info?.["NOMBRE "] || "PRODUCTO NO VINCULADO",
      costo: parseFloat(info?.costo) || 0, rent: parseFloat(info?.["rentabilidad "]) || 0,
      cantidad: 1, descuentoManual: 0
    };
    setItems([nuevo, ...items]);
    setSkuInput("");
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f0f2f5' }}>
      <aside style={{ width: '300px', padding: '25px', backgroundColor: 'white', borderRight: '1px solid #ddd', overflowY: 'auto' }}>
        <h2 style={{ color: '#d90429' }}>CONFIGURACIÓN PRO</h2>
        <input type="file" onChange={(e) => {
          const reader = new FileReader();
          reader.onload = (evt) => {
            const wb = XLSX.read(evt.target?.result, { type: 'binary' });
            setDbPrecios(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]));
          };
          reader.readAsBinaryString(e.target.files![0]);
        }} style={{ marginBottom: '20px', fontSize: '12px' }} />
        
        <p style={{ fontSize: '10px', fontWeight: 'bold' }}>REGLAS DE PACK</p>
        {reglasPack.map((r, i) => (
          <div key={i} style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
            <input type="number" value={r.x} onChange={(e) => { const n = [...reglasPack]; n[i].x = parseInt(e.target.value); setReglasPack(n); }} style={{ width: '50px' }} />
            <input type="number" value={r.y} onChange={(e) => { const n = [...reglasPack]; n[i].y = parseInt(e.target.value); setReglasPack(n); }} style={{ flex: 1 }} />
          </div>
        ))}

        <input type="file" multiple onChange={(e) => {
          Array.from(e.target.files!).forEach(f => {
            const r = new FileReader();
            r.onloadend = () => setBancoFotos(prev => ({ ...prev, [f.name.split('.')[0].toLowerCase().trim()]: r.result as string }));
            r.readAsDataURL(f);
          });
        }} style={{ marginTop: '20px', fontSize: '11px' }} />
      </aside>

      <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto 40px', display: 'flex', gap: '10px' }}>
          <input type="text" value={skuInput} onChange={(e) => setSkuInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && agregarProducto()}
                 placeholder="Ingresa SKU y genera Ficha PRO..." style={{ flex: 1, padding: '15px', borderRadius: '15px', border: '1px solid #ddd' }} />
          <button onClick={agregarProducto} style={{ padding: '15px 30px', borderRadius: '15px', backgroundColor: '#d90429', color: 'white', border: 'none', fontWeight: 'bold' }}>GENERAR</button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px', justifyContent: 'center' }}>
          {items.map(item => (
            <FichaComercialPro key={item.id} producto={item} bancoFotos={bancoFotos} reglasPack={reglasPack}
                               onUpdate={(u) => setItems(items.map(i => i.id === item.id ? u : i))}
                               onDelete={() => setItems(items.filter(i => i.id !== item.id))} />
          ))}
        </div>
      </main>
    </div>
  );
}
