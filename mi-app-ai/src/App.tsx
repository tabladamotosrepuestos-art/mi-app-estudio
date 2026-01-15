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
  const foto = bancoFotos[producto.sku.toLowerCase().trim()];
  const precioBase = producto.costo * (1 + producto.rent / 100);
  
  const reglaPack = [...reglasPack].sort((a, b) => b.x - a.x).find(r => producto.cantidad >= r.x);
  const descFinal = reglaPack ? reglaPack.y : producto.descuentoManual;
  const unitarioFinal = precioBase * (1 - descFinal / 100);
  const valorTotal = unitarioFinal * producto.cantidad;

  return (
    <div style={{ width: '450px', backgroundColor: '#f8f9fa', borderRadius: '40px', padding: '20px', boxShadow: '0 20px 50px rgba(0,0,0,0.05)', marginBottom: '40px' }}>
      {/* HEADER DE LA FICHA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', padding: '0 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
           <span style={{ color: '#2ecc71', fontSize: '18px' }}>●</span>
           <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#666', letterSpacing: '1px' }}>EN INVENTARIO</span>
        </div>
        <button onClick={onDelete} style={{ background: '#eee', border: 'none', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', color: '#999' }}>✕</button>
      </div>

      {/* INPUTS DE EDICIÓN ESTILO CLEAN */}
      <div style={{ backgroundColor: 'white', borderRadius: '25px', padding: '20px', marginBottom: '20px', border: '1px solid #f0f0f0' }}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ fontSize: '10px', color: '#aaa', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>DESCRIPCIÓN</label>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>{producto.nombre}</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div>
            <label style={{ fontSize: '10px', color: '#aaa', fontWeight: 'bold' }}>CANTIDAD</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '5px' }}>
               <button onClick={() => onUpdate({...producto, cantidad: Math.max(1, producto.cantidad - 1)})} style={{ border: '1px solid #ddd', background: 'white', borderRadius: '8px', width: '30px', height: '30px' }}>-</button>
               <span style={{ fontWeight: 'bold' }}>{producto.cantidad}</span>
               <button onClick={() => onUpdate({...producto, cantidad: producto.cantidad + 1})} style={{ border: '1px solid #ddd', background: 'white', borderRadius: '8px', width: '30px', height: '30px' }}>+</button>
            </div>
          </div>
          <div>
            <label style={{ fontSize: '10px', color: '#aaa', fontWeight: 'bold' }}>DESC. (%)</label>
            <input type="number" value={producto.descuentoManual} onChange={(e) => onUpdate({...producto, descuentoManual: parseInt(e.target.value) || 0})}
                   style={{ width: '100%', padding: '8px', border: '1px solid #ffebee', borderRadius: '10px', backgroundColor: '#fff5f5', color: '#d90429', fontWeight: 'bold', marginTop: '5px' }} />
          </div>
        </div>
      </div>

      {/* PREVIEW FINAL DE LA FICHA (LA QUE VE EL CLIENTE) */}
      <div style={{ backgroundColor: 'white', borderRadius: '35px', overflow: 'hidden', boxShadow: '0 15px 35px rgba(0,0,0,0.08)', position: 'relative' }}>
        <div style={{ height: '300px', backgroundColor: '#fff', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '20px', left: '20px', backgroundColor: '#d90429', color: 'white', padding: '6px 15px', borderRadius: '15px', fontWeight: 'bold', fontSize: '10px', zIndex: 2 }}>SKU: {producto.sku}</div>
          {descFinal > 0 && (
            <div style={{ position: 'absolute', top: '20px', right: '20px', backgroundColor: '#d90429', color: 'white', width: '55px', height: '55px', borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 5, fontWeight: 'bold' }}>
              <span style={{ fontSize: '8px' }}>AHORRA</span>
              <span style={{ fontSize: '14px' }}>{descFinal}%</span>
            </div>
          )}
          {foto ? <img src={foto} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '20px' }} /> : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#eee' }}>SIN IMAGEN</div>}
        </div>

        <div style={{ backgroundColor: 'black', padding: '25px', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '18px', margin: 0, fontWeight: '900', maxWidth: '200px' }}>{producto.nombre}</h3>
              <span style={{ fontSize: '10px', color: '#666' }}>PVP UNITARIO</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', color: '#666', textDecoration: 'line-through' }}>${precioBase.toFixed(2)}</div>
              <div style={{ fontSize: '32px', color: '#d90429', fontWeight: '900' }}>${unitarioFinal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</div>
            </div>
          </div>

          <div style={{ backgroundColor: '#d90429', borderRadius: '20px', padding: '15px' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                   <div style={{ fontSize: '10px', fontWeight: 'bold', opacity: 0.9 }}>VALOR TOTAL</div>
                   <div style={{ fontSize: '20px', fontWeight: '900', backgroundColor: 'white', color: '#d90429', padding: '4px 12px', borderRadius: '12px', marginTop: '5px' }}>
                      ${valorTotal.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                   </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                   <div style={{ fontSize: '9px', fontWeight: 'bold' }}>EL PRECIO BAJA A</div>
                   <div style={{ fontSize: '22px', fontWeight: '900' }}>${unitarioFinal.toLocaleString('es-AR', { minimumFractionDigits: 2 })} <span style={{fontSize:'10px'}}>c/u</span></div>
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
  const [reglasPack] = useState<Regla[]>([{ x: 3, y: 10 }, { x: 6, y: 15 }, { x: 12, y: 20 }]);

  const agregarProducto = () => {
    skuInput.split('\n').forEach(linea => {
      const cod = linea.trim();
      if (!cod) return;
      const info = dbPrecios.find((p: any) => String(p.SKU).trim() === cod);
      setItems(prev => [{
        id: Date.now() + Math.random(), sku: cod, 
        nombre: info?.["NOMBRE "] || "PRODUCTO NO ENCONTRADO",
        costo: parseFloat(info?.costo) || 0, rent: parseFloat(info?.["rentabilidad "]) || 0,
        cantidad: 1, descuentoManual: 0
      }, ...prev]);
    });
    setSkuInput("");
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f2f5', fontFamily: 'Inter, sans-serif', padding: '40px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* BARRA DE CARGA SUPERIOR */}
        <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', marginBottom: '40px', display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <textarea value={skuInput} onChange={(e) => setSkuInput(e.target.value)} placeholder="Pega tus SKUs aquí..." 
                      style={{ width: '100%', border: '1px solid #eee', borderRadius: '15px', padding: '15px', height: '60px', outline: 'none' }} />
          </div>
          <button onClick={agregarProducto} style={{ backgroundColor: '#d90429', color: 'white', border: 'none', padding: '20px 40px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' }}>GENERAR FICHAS</button>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <label style={{ cursor: 'pointer', padding: '15px', background: '#f8f9fa', borderRadius: '15px', fontSize: '12px' }}>
               <input type="file" hidden onChange={(e) => {
                 const reader = new FileReader();
                 reader.onload = (evt) => setDbPrecios(XLSX.utils.sheet_to_json(XLSX.read(evt.target?.result, {type:'binary'}).Sheets[XLSX.read(evt.target?.result, {type:'binary'}).SheetNames[0]]));
                 reader.readAsBinaryString(e.target.files![0]);
               }} /> {dbPrecios.length > 0 ? "✅ EXCEL" : "📁 EXCEL"}
            </label>
            <label style={{ cursor: 'pointer', padding: '15px', background: '#f8f9fa', borderRadius: '15px', fontSize: '12px' }}>
               <input type="file" hidden multiple onChange={(e) => {
                 Array.from(e.target.files!).forEach(f => {
                   const r = new FileReader();
                   r.onloadend = () => setBancoFotos(prev => ({ ...prev, [f.name.split('.')[0].toLowerCase().trim()]: r.result as string }));
                   r.readAsDataURL(f);
                 });
               }} /> 📷 FOTOS
            </label>
          </div>
        </div>

        {/* GRILLA DE FICHAS */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px', justifyContent: 'center' }}>
          {items.map(item => (
            <FichaComercialPro key={item.id} producto={item} bancoFotos={bancoFotos} reglasPack={reglasPack}
                               onUpdate={(u) => setItems(items.map(i => i.id === item.id ? u : i))}
                               onDelete={() => setItems(items.filter(i => i.id !== item.id))} />
          ))}
        </div>
      </div>
    </div>
  );
}
