import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';

interface Regla { x: number; y: number; }
interface Producto {
  id: number; sku: string; nombre: string; costo: number; rent: number;
  cantidad: number; descuentoManual: number;
}

const FichaStudioIA = ({ producto, bancoFotos, reglasPack, logoEmpresa, logoMarca, onUpdate, onDelete }: {
  producto: Producto, bancoFotos: Record<string, string>, reglasPack: Regla[], 
  logoEmpresa: string | null, logoMarca: string | null,
  onUpdate: (p: Producto) => void, onDelete: () => void
}) => {
  const fichaRef = useRef<HTMLDivElement>(null);
  const foto = bancoFotos[producto.sku.toLowerCase().trim()];
  const precioBase = producto.costo * (1 + producto.rent / 100);
  const reglaPack = [...reglasPack].sort((a, b) => b.x - a.x).find(r => producto.cantidad >= r.x);
  const descFinal = reglaPack ? reglaPack.y : producto.descuentoManual;
  const unitarioFinal = precioBase * (1 - descFinal / 100);

  const copiarImagen = async () => {
    const html2canvas = (await import('html2canvas')).default;
    if (fichaRef.current) {
      const canvas = await html2canvas(fichaRef.current, { useCORS: true, scale: 2, backgroundColor: '#ffffff' });
      canvas.toBlob(async (blob) => {
        if (blob) {
          try {
            const data = [new ClipboardItem({ [blob.type]: blob })];
            await navigator.clipboard.write(data);
            alert("✅ Imagen copiada.");
          } catch (err) { alert("Error al copiar."); }
        }
      }, 'image/png');
    }
  };

  return (
    <div style={{ width: '100%', maxWidth: '380px', margin: '0 auto', background: 'white', borderRadius: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
      {/* SECCIÓN DE BOTONES (Integrada arriba de la ficha) */}
      <div style={{ padding: '15px', borderBottom: '1px solid #eee', background: '#fcfcfc' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <button onClick={copiarImagen} style={{ flex: 1, marginRight: '8px', padding: '10px', background: 'white', border: '1px solid #ddd', borderRadius: '10px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}>📋 COPIAR IMAGEN</button>
          <button onClick={onDelete} style={{ padding: '10px 15px', background: '#eee', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ display: 'flex', gap: '5px' }}>
          {[1, 3, 6, 12].map(n => (
            <button key={n} onClick={() => onUpdate({...producto, cantidad: n})} 
              style={{ flex: 1, padding: '12px 0', borderRadius: '10px', border: 'none', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: producto.cantidad === n ? '#d90429' : '#eee', color: producto.cantidad === n ? 'white' : '#666' }}>x{n}</button>
          ))}
        </div>
      </div>

      {/* ÁREA DE CAPTURA (Lo que se copia) */}
      <div ref={fichaRef} style={{ background: 'white', position: 'relative' }}>
        <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '15px', left: '15px', background: '#d90429', color: 'white', padding: '5px 12px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold' }}>SKU: {producto.sku}</div>
          {logoMarca && <img src={logoMarca} alt="marca" style={{ position: 'absolute', top: '15px', right: '15px', height: '60px', maxWidth: '100px', objectFit: 'contain' }} />}
          
          <div style={{ position: 'absolute', top: '80px', right: '15px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
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

          {logoEmpresa && <img src={logoEmpresa} alt="empresa" style={{ position: 'absolute', bottom: '15px', right: '15px', height: '55px', maxWidth: '110px', objectFit: 'contain' }} />}
          {foto ? <img src={foto} alt="prod" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} /> : <div style={{ color: '#eee', fontWeight: 'bold' }}>Sin Foto</div>}
        </div>
        
        <div style={{ backgroundColor: 'black', padding: '25px', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
            <div style={{ flex: 1, paddingRight: '10px' }}><h4 style={{ margin: 0, fontSize: '15px', textTransform: 'uppercase', fontWeight: '900' }}>{producto.nombre}</h4></div>
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
  const [logoEmpresa, setLogoEmpresa] = useState<string | null>(null);
  const [logoMarca, setLogoMarca] = useState<string | null>(null);
  const [reglasPack, setReglasPack] = useState<Regla[]>([{ x: 3, y: 10 }, { x: 7, y: 15 }, { x: 12, y: 20 }]);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<any>(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://unpkg.com/html5-qrcode";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const procesarSku = (sku: string) => {
    const c = sku.trim(); if (!c) return;
    const info = dbPrecios.find((p: any) => String(p.SKU).trim() === c);
    setItems(prev => [{
      id: Date.now() + Math.random(),
      sku: c,
      nombre: info ? (info["NOMBRE "] || info["NOMBRE"] || "PRODUCTO") : "PRODUCTO",
      costo: info ? (parseFloat(info["costo"]) || 0) : 0,
      rent: info ? (parseFloat(info["rentabilidad "]) || 0) : 0,
      cantidad: 1, descuentoManual: 0
    }, ...prev]);
  };

  const toggleScanner = async () => {
    if (scanning) {
      if (scannerRef.current) { try { await scannerRef.current.stop(); } catch (e) {} }
      setScanning(false);
    } else {
      setScanning(true);
      setTimeout(() => {
        try {
          // @ts-ignore
          const html5QrCode = new window.Html5Qrcode("reader");
          scannerRef.current = html5QrCode;
          html5QrCode.start({ facingMode: "environment" }, { fps: 15, qrbox: 250 }, (text: string) => {
            procesarSku(text);
            html5QrCode.stop().then(() => setScanning(false));
          }, () => {}).catch(() => setScanning(false));
        } catch (e) { setScanning(false); }
      }, 500);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: window.innerWidth < 768 ? 'column' : 'row', height: '100vh', background: '#f4f7f9', fontFamily: 'sans-serif', overflow: 'hidden' }}>
      {/* SIDEBAR */}
      <aside style={{ width: window.innerWidth < 768 ? '100%' : '340px', background: 'white', padding: '25px', borderRight: '1px solid #eee', overflowY: 'auto', flexShrink: 0 }}>
        <h2 style={{ color: '#d90429', fontWeight: '900', marginBottom: '20px' }}>STUDIO IA</h2>
        <input type="file" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => setLogoEmpresa(r.result as string); r.readAsDataURL(f); } }} style={{ marginBottom: '15px', fontSize: '12px' }} />
        <input type="file" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => setLogoMarca(r.result as string); r.readAsDataURL(f); } }} style={{ marginBottom: '15px', fontSize: '12px' }} />
        <input type="file" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = (evt) => { const wb = XLSX.read(evt.target?.result, { type: 'binary' }); setDbPrecios(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]])); }; r.readAsBinaryString(f); } }} style={{ marginBottom: '15px', fontSize: '12px' }} />
        <label style={{ display: 'block', padding: '15px', background: '#d90429', color: 'white', borderRadius: '15px', textAlign: 'center', cursor: 'pointer', fontWeight: 'bold', marginBottom: '10px' }}>
          📷 FOTOS PRODUCTOS
          <input type="file" hidden multiple onChange={(e) => { const files = e.target.files; if (!files) return; Array.from(files).forEach(f => { const r = new FileReader(); r.onloadend = () => setBancoFotos(prev => ({ ...prev, [f.name.split('.')[0].toLowerCase().trim()]: r.result as string })); r.readAsDataURL(f); }); }} />
        </label>
        <button onClick={() => setItems([])} style={{ width: '100%', padding: '12px', background: '#f8f9fa', borderRadius: '15px', border: '1px solid #ddd', fontWeight: 'bold' }}>🗑️ LIMPIAR</button>
      </aside>

      {/* MAIN */}
      <main style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto 30px', textAlign: 'center' }}>
          <button onClick={toggleScanner} style={{ width: '100%', padding: '15px', background: '#2ecc71', color: 'white', border: 'none', borderRadius: '15px', fontWeight: 'bold', marginBottom: '10px' }}>
            {scanning ? "❌ CERRAR CÁMARA" : "📷 ESCANEAR CÓDIGO"}
          </button>
          {scanning && <div id="reader" style={{ width: '100%', margin: '0 auto 15px', borderRadius: '15px', overflow: 'hidden', border: '2px solid #2ecc71' }}></div>}
          <textarea value={skuInput} onChange={(e) => setSkuInput(e.target.value)} placeholder="Pegue SKUs aquí..." style={{ width: '100%', height: '60px', padding: '15px', borderRadius: '15px', border: '1px solid #ddd', marginBottom: '10px' }} />
          <button onClick={() => { skuInput.split('\n').forEach(procesarSku); setSkuInput(""); }} style={{ width: '100%', padding: '15px', background: '#d90429', color: 'white', border: 'none', borderRadius: '15px', fontWeight: 'bold' }}>GENERAR FICHAS</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {items.map(item => (
            <FichaStudioIA key={item.id} producto={item} bancoFotos={bancoFotos} reglasPack={reglasPack} logoEmpresa={logoEmpresa} logoMarca={logoMarca}
                           onUpdate={(u) => setItems(items.map(i => i.id === item.id ? u : i))}
                           onDelete={() => setItems(items.filter(i => i.id !== item.id))} />
          ))}
        </div>
      </main>
    </div>
  );
}
