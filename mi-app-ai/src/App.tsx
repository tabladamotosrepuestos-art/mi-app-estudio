import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';

// DEFINICIÓN DE INTERFACES PARA ESTABILIDAD DEL CÓDIGO
interface Regla { x: number; y: number; }
interface Producto {
  id: number; sku: string; nombre: string; costo: number; rent: number;
  cantidad: number; descuentoManual: number;
}

const FichaStudioIA = ({ producto, bancoFotos, reglasPack, onUpdate, onDelete }: {
  producto: Producto, bancoFotos: Record<string, string>, reglasPack: Regla[],
  onUpdate: (p: Producto) => void, onDelete: () => void
}) => {
  const fichaRef = useRef<HTMLDivElement>(null);
  const foto = bancoFotos[producto.sku.toLowerCase().trim()];
  const precioBase = producto.costo * (1 + producto.rent / 100);
  
  // LÓGICA DE CÁLCULO DE PACK
  const reglaPack = [...reglasPack].sort((a, b) => b.x - a.x).find(r => producto.cantidad >= r.x);
  const descFinal = reglaPack ? reglaPack.y : producto.descuentoManual;
  const unitarioFinal = precioBase * (1 - descFinal / 100);

  // FUNCIÓN PARA COPIAR AL PORTAPAPELES (IDEAL PARA WHATSAPP)
  const copiarImagen = async () => {
    const html2canvas = (await import('html2canvas')).default;
    if (fichaRef.current) {
      const canvas = await html2canvas(fichaRef.current, { useCORS: true, scale: 2, backgroundColor: '#ffffff' });
      canvas.toBlob(async (blob) => {
        if (blob) {
          try {
            const data = [new ClipboardItem({ [blob.type]: blob })];
            await navigator.clipboard.write(data);
            alert("✅ Imagen copiada. ¡Ya podés pegarla en WhatsApp!");
          } catch (err) {
            alert("Error al copiar. Intentá descargándola.");
          }
        }
      }, 'image/png');
    }
  };

  const descargarImagen = async () => {
    const html2canvas = (await import('html2canvas')).default;
    if (fichaRef.current) {
      const canvas = await html2canvas(fichaRef.current, { useCORS: true, scale: 2, backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.download = `Ficha-${producto.sku}-x${producto.cantidad}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%', maxWidth: '380px' }}>
      {/* PANEL DE CONTROL SUPERIOR */}
      <div style={{ backgroundColor: 'white', borderRadius: '25px', padding: '18px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' }}>
          <span style={{ backgroundColor: '#e8f5e9', color: '#2ecc71', padding: '4px 10px', borderRadius: '10px', fontSize: '9px', fontWeight: 'bold' }}>CONTROL</span>
          <div style={{ display: 'flex', gap: '5px' }}>
            <button onClick={copiarImagen} style={{ background: '#f8f9fa', border: '1px solid #ddd', borderRadius: '8px', padding: '5px 8px', fontSize: '10px', cursor: 'pointer', fontWeight: 'bold' }}>📋 COPIAR</button>
            <button onClick={descargarImagen} style={{ background: '#f8f9fa', border: '1px solid #ddd', borderRadius: '8px', padding: '5px 8px', fontSize: '10px', cursor: 'pointer', fontWeight: 'bold' }}>💾 GUARDAR</button>
            <button onClick={onDelete} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ddd', fontSize: '18px' }}>✕</button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[1, 3, 6, 12].map(n => (
            <button key={n} onClick={() => onUpdate({...producto, cantidad: n})} 
              style={{ flex: 1, padding: '12px 0', borderRadius: '12px', border: 'none', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: producto.cantidad === n ? '#d90429' : '#f0f0f0', color: producto.cantidad === n ? 'white' : '#666' }}>x{n}</button>
          ))}
        </div>
      </div>

      {/* DISEÑO DE LA FICHA */}
      <div ref={fichaRef} style={{ backgroundColor: 'white', borderRadius: '35px', overflow: 'hidden', boxShadow: '0 20px 45px rgba(0,0,0,0.12)', position: 'relative' }}>
        <div style={{ height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', padding: '20px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '15px', left: '15px', background: '#d90429', color: 'white', padding: '5px 12px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold' }}>SKU: {producto.sku}</div>
          
          <div style={{ position: 'absolute', top: '15px', right: '15px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {descFinal > 0 && (
              <div style={{ background: '#d90429', color: 'white', width: '55px', height: '55px', borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontWeight: '900' }}>
                <span style={{ fontSize: '8px' }}>AHORRA</span>
                <span style={{ fontSize: '16px' }}>{descFinal}%</span>
              </div>
            )}
            {producto.cantidad > 1 && (
              <div style={{ background: 'black', color: 'white', width: '55px', height: '55px', borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontWeight: '900' }}>
                <span style={{ fontSize: '7px' }}>LLEVANDO</span>
                <span style={{ fontSize: '16px' }}>x{producto.cantidad}</span>
              </div>
            )}
          </div>
          
          {foto ? <img src={foto} alt="prod" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} /> : <div style={{ color: '#eee', fontWeight: 'bold' }}>Cargar Foto</div>}
        </div>
        
        <div style={{ backgroundColor: 'black', padding: '25px', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
            <div style={{ flex: 1 }}><h4 style={{ margin: 0, fontSize: '15px', textTransform: 'uppercase', fontWeight: '900', lineHeight: '1.2' }}>{producto.nombre}</h4></div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '10px', textDecoration: 'line-through', color: '#555' }}>${precioBase.toLocaleString('es-AR')}</div>
              <div style={{ fontSize: '26px', color: '#d90429', fontWeight: '900' }}>${unitarioFinal.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</div>
            </div>
          </div>

          <div style={{ backgroundColor: '#d90429', borderRadius: '22px', padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '9px', fontWeight: 'bold', marginBottom: '5px' }}>PRECIO BAJA A</div>
                <div style={{ fontSize: '30px', fontWeight: '900', color: 'white', lineHeight: '1' }}>
                  ${unitarioFinal.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                  <span style={{ fontSize: '12px', marginLeft: '4px' }}>c/u</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '9px', fontWeight: 'bold', opacity: 0.8 }}>VALOR TOTAL</div>
                <div style={{ fontSize: '16px', fontWeight: '900', background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '10px', marginTop: '5px' }}>
                  ${(unitarioFinal * producto.cantidad).toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                </div>
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

  const agregar = () => {
    skuInput.split('\n').forEach(s => {
      const c = s.trim(); if (!c) return;
      const info = dbPrecios.find((p: any) => String(p.SKU).trim() === c);
      
      const nombreExtraido = info ? (info["NOMBRE "] || info["NOMBRE"] || "PRODUCTO") : "PRODUCTO";
      const costoExtraido = info ? (parseFloat(info["costo"]) || 0) : 0;
      const rentExtraida = info ? (parseFloat(info["rentabilidad "]) || parseFloat(info["rentabilidad"]) || 0) : 0;

      setItems(prev => [{
        id: Date.now() + Math.random(),
        sku: c,
        nombre: nombreExtraido,
        costo: costoExtraido,
        rent: rentExtraida,
        cantidad: 1,
        descuentoManual: 0
      }, ...prev]);
    });
    setSkuInput("");
  };

  return (
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', height: '100vh', background: '#f4f7f9', fontFamily: 'sans-serif', overflow: 'hidden' }}>
      <aside style={{ width: isMobile ? '100%' : '340px', background: 'white', padding: '30px', borderRight: '1px solid #e0e6ed', overflowY: 'auto', flexShrink: 0 }}>
        <h2 style={{ color: '#d90429', fontSize: '22px', fontWeight: '900', marginBottom: '30px' }}>STUDIO IA</h2>
        <div style={{ marginBottom: '25px' }}>
           <p style={{ fontSize: '10px', fontWeight: 'bold', color: '#aaa', marginBottom: '10px' }}>EXCEL BASE</p>
           <input type="file" onChange={(e) => {
             const f = e.target.files?.[0]; if (!f) return;
             const r = new FileReader();
             r.onload = (evt) => {
               const wb = XLSX.read(evt.target?.result, { type: 'binary' });
               setDbPrecios(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]));
             };
             r.readAsBinaryString(f);
           }} />
        </div>
        <div style={{ marginBottom: '25px' }}>
           <p style={{ fontSize: '10px', fontWeight: 'bold', color: '#aaa', marginBottom: '10px' }}>REGLAS %</p>
           {reglasPack.map((r, i) => (
             <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px', background: '#f8f9fa', padding: '10px', borderRadius: '12px' }}>
                <input type="number" value={r.x} onChange={(e) => { const n = [...reglasPack]; n[i].x = parseInt(e.target.value) || 0; setReglasPack(n); }} style={{ width: '45px', border: '1px solid #ddd', borderRadius: '6px', textAlign: 'center' }} />
                <span style={{fontSize:'10px', alignSelf:'center'}}>un. →</span>
                <input type="number" value={r.y} onChange={(e) => { const n = [...reglasPack]; n[i].y = parseInt(e.target.value) || 0; setReglasPack(n); }} style={{ flex: 1, border: '1px solid #ddd', borderRadius: '6px', textAlign: 'center', fontWeight: 'bold', color: '#d90429' }} />
             </div>
           ))}
        </div>
        <label style={{ display: 'block', padding: '15px', background: '#d90429', color: 'white', borderRadius: '15px', textAlign: 'center', cursor: 'pointer', fontWeight: 'bold', marginBottom: '15px' }}>
          📷 CARGAR FOTOS
          <input type="file" hidden multiple onChange={(e) => {
            const files = e.target.files; if (!files) return;
            Array.from(files).forEach(f => {
              const r = new FileReader(); r.onloadend = () => setBancoFotos(prev => ({ ...prev, [f.name.split('.')[0].toLowerCase().trim()]: r.result as string }));
              r.readAsDataURL(f);
            });
          }} />
        </label>
        
        {/* BOTÓN LIMPIAR TODO */}
        <button onClick={() => setItems([])} style={{ width: '100%', padding: '12px', background: '#f8f9fa', color: '#666', border: '1px solid #ddd', borderRadius: '15px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>🗑️ LIMPIAR PANTALLA</button>
      </aside>
      
      <main style={{ flex: 1, padding: isMobile ? '20px' : '40px', overflowY: 'auto' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto 40px' }}>
           <textarea value={skuInput} onChange={(e) => setSkuInput(e.target.value)} placeholder="Pega los SKUs aquí..." 
                style={{ width: '100%', height: '80px', padding: '20px', borderRadius: '20px', border: '1px solid #ddd', outline: 'none', fontSize: '16px' }} />
           <button onClick={agregar} style={{ width: '100%', marginTop: '10px', padding: '15px', background: '#d90429', color: 'white', border: 'none', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer' }}>GENERAR FICHAS</button>
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
