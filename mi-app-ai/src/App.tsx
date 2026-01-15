import React, { useState } from 'react';
import * as XLSX from 'xlsx';

// 1. Definimos las estructuras de datos para que TypeScript no de error
interface Regla {
  x: number;
  y: number;
}

interface Producto {
  id: number;
  sku: string;
  nombre: string;
  costo: number;
  rent: number;
  cantidad: number;
  descuentoManual: number;
}

// 2. Componente de Tarjeta Individual (Estilo Studio IA)
const ProductoCard = ({ 
  producto, 
  bancoFotos, 
  reglasPack, 
  onUpdate, 
  onDelete 
}: { 
  producto: Producto, 
  bancoFotos: Record<string, string>, 
  reglasPack: Regla[], 
  onUpdate: (p: Producto) => void, 
  onDelete: () => void 
}) => {
  const foto = bancoFotos[producto.sku.toLowerCase()];
  
  const precioBase = producto.costo * (1 + producto.rent / 100);
  const reglaPack = [...reglasPack]
    .sort((a, b) => b.x - a.x)
    .find(r => producto.cantidad >= r.x);

  const descFinal = reglaPack ? reglaPack.y : producto.descuentoManual;
  const unitario = precioBase * (1 - descFinal / 100);

  return (
    <div style={{ width: '360px', backgroundColor: 'white', borderRadius: '40px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', position: 'relative' }}>
      <button onClick={onDelete} style={{ position: 'absolute', top: '15px', right: '15px', border: 'none', background: 'rgba(0,0,0,0.5)', color: 'white', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', zIndex: 10 }}>×</button>
      
      <div style={{ position: 'relative', height: '320px', backgroundColor: '#f9f9f9' }}>
        <div style={{ position: 'absolute', top: '20px', left: '20px', backgroundColor: '#d90429', color: 'white', padding: '5px 15px', borderRadius: '20px', fontWeight: 'bold', fontSize: '11px', zIndex: 2 }}>SKU: {producto.sku}</div>
        {foto ? <img src={foto} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc', fontSize: '12px' }}>SIN IMAGEN</div>}
      </div>

      <div style={{ padding: '20px', display: 'flex', gap: '15px', backgroundColor: '#fff', borderTop: '1px solid #eee' }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: '10px', color: '#999', display: 'block', marginBottom: '5px' }}>CANTIDAD</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={() => onUpdate({ ...producto, cantidad: Math.max(1, producto.cantidad - 1) })} style={{ width: '30px', height: '30px', borderRadius: '8px', border: '1px solid #ddd', cursor: 'pointer' }}>-</button>
            <span style={{ fontWeight: 'bold' }}>{producto.cantidad}</span>
            <button onClick={() => onUpdate({ ...producto, cantidad: producto.cantidad + 1 })} style={{ width: '30px', height: '30px', borderRadius: '8px', border: '1px solid #ddd', cursor: 'pointer' }}>+</button>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: '10px', color: '#999', display: 'block', marginBottom: '5px' }}>DESC. %</label>
          <input 
            type="number" 
            value={producto.descuentoManual} 
            onChange={(e) => onUpdate({ ...producto, descuentoManual: parseInt(e.target.value) || 0 })}
            style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #eee', fontWeight: 'bold' }}
          />
        </div>
      </div>

      <div style={{ backgroundColor: 'black', padding: '25px', color: 'white' }}>
        <h2 style={{ fontSize: '15px', margin: '0 0 10px 0', textTransform: 'uppercase', height: '40px', overflow: 'hidden' }}>{producto.nombre}</h2>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <p style={{ fontSize: '11px', color: reglaPack ? '#4cc9f0' : '#d90429', fontWeight: 'bold', margin: 0 }}>
              {reglaPack ? `PACK ${reglaPack.x} UN. -${descFinal}%` : `OFERTA -${descFinal}%`}
            </p>
            <p style={{ fontSize: '9px', color: '#555', margin: 0 }}>TOTAL: ${(unitario * producto.cantidad).toLocaleString('es-AR')}</p>
          </div>
          <div style={{ color: '#d90429', fontSize: '30px', fontWeight: 'bold' }}>
            ${unitario.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>
    </div>
  );
};

// 3. Componente Principal
export default function App() {
  const [skuInput, setSkuInput] = useState("");
  const [items, setItems] = useState<Producto[]>([]);
  const [dbPrecios, setDbPrecios] = useState<any[]>([]);
  const [bancoFotos, setBancoFotos] = useState<Record<string, string>>({});
  const [reglasPack, setReglasPack] = useState<Regla[]>([{ x: 3, y: 5 }, { x: 5, y: 7 }, { x: 10, y: 10 }]);

  const agregarProducto = () => {
    const cod = skuInput.trim();
    if (!cod) return;
    const info = dbPrecios.find((p: any) => String(p.SKU).trim() === cod);
    const nuevo: Producto = {
      id: Date.now(),
      sku: cod,
      nombre: info?.["NOMBRE "] || "PRODUCTO NO VINCULADO",
      costo: parseFloat(info?.costo) || 0,
      rent: parseFloat(info?.["rentabilidad "]) || 0,
      cantidad: 1,
      descuentoManual: 0
    };
    setItems([nuevo, ...items]);
    setSkuInput("");
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f0f2f5', fontFamily: 'sans-serif' }}>
      <aside style={{ width: '320px', padding: '30px', backgroundColor: 'white', borderRight: '1px solid #e0e0e0', overflowY: 'auto' }}>
        <h1 style={{ color: '#d90429', fontSize: '20px', fontWeight: 'bold', marginBottom: '30px' }}>STUDIO IA</h1>
        
        <div style={{ marginBottom: '30px' }}>
          <p style={{ fontSize: '11px', color: '#999', fontWeight: 'bold', marginBottom: '10px' }}>1. BASE DE DATOS</p>
          <label style={{ display: 'block', padding: '15px', border: '2px dashed #eee', borderRadius: '15px', textAlign: 'center', cursor: 'pointer', fontSize: '12px' }}>
            <input type="file" hidden onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (evt) => {
                const wb = XLSX.read(evt.target?.result, { type: 'binary' });
                setDbPrecios(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]));
              };
              reader.readAsBinaryString(file);
            }} />
            {dbPrecios.length > 0 ? "✅ EXCEL CONECTADO" : "SUBIR EXCEL"}
          </label>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <p style={{ fontSize: '11px', color: '#999', fontWeight: 'bold', marginBottom: '10px' }}>2. IMÁGENES</p>
          <label style={{ display: 'block', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '15px', textAlign: 'center', cursor: 'pointer', fontSize: '12px' }}>
            <input type="file" hidden multiple onChange={(e) => {
              const files = Array.from(e.target.files || []);
              files.forEach(f => {
                const r = new FileReader();
                r.onloadend = () => setBancoFotos(prev => ({ ...prev, [f.name.split('.')[0].toLowerCase().trim()]: r.result as string }));
                r.readAsDataURL(f);
              });
            }} />
            CARGAR BANCO DE FOTOS
          </label>
        </div>

        <p style={{ fontSize: '11px', color: '#999', fontWeight: 'bold', marginBottom: '10px' }}>3. REGLAS DE PACK</p>
        {reglasPack.map((r, i) => (
          <div key={i} style={{ display: 'flex', gap: '5px', marginBottom: '8px' }}>
            <input type="number" value={r.x} onChange={(e) => { const n = [...reglasPack]; n[i].x = parseInt(e.target.value) || 0; setReglasPack(n); }} style={{ width: '60px', padding: '8px', border: '1px solid #eee', borderRadius: '8px' }} />
            <span style={{alignSelf:'center', fontSize:'11px'}}>un. →</span>
            <input type="number" value={r.y} onChange={(e) => { const n = [...reglasPack]; n[i].y = parseInt(e.target.value) || 0; setReglasPack(n); }} style={{ flex: 1, padding: '8px', border: '1px solid #eee', borderRadius: '8px', color: '#d90429', fontWeight: 'bold' }} />
            <span style={{alignSelf:'center', fontSize:'11px'}}>%</span>
          </div>
        ))}
      </aside>

      <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', marginBottom: '40px', display: 'flex', gap: '15px' }}>
          <input 
            type="text" 
            placeholder="Escribe SKU y presiona Enter..." 
            value={skuInput}
            onChange={(e) => setSkuInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && agregarProducto()}
            style={{ flex: 1, padding: '20px', borderRadius: '20px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', fontSize: '16px', outline: 'none' }}
          />
          <button onClick={agregarProducto} style={{ backgroundColor: '#d90429', color: 'white', border: 'none', padding: '0 30px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' }}>AÑADIR</button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px', justifyContent: 'center' }}>
          {items.map(item => (
            <ProductoCard 
              key={item.id} 
              producto={item} 
              bancoFotos={bancoFotos} 
              reglasPack={reglasPack}
              onUpdate={(updated: Producto) => setItems(items.map(i => i.id === item.id ? updated : i))}
              onDelete={() => setItems(items.filter(i => i.id !== item.id))}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
