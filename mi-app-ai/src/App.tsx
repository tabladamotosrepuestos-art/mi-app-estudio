import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';

// --- INTERFACES ---
interface Regla { x: number; y: number; }
interface Producto {
  id: number; sku: string; nombre: string; costo: number; rent: number;
  cantidad: number; descuentoManual: number;
}

// --- COMPONENTE DE LA FICHA (DISEÑO ORIGINAL RESTAURADO) ---
const FichaStudioIA = ({ producto, bancoFotos, reglasPack, reglaCaja, logoEmpresa, logoMarca, onUpdate, onDelete }: {
  producto: Producto, bancoFotos: Record<string, string>, reglasPack: Regla[], reglaCaja: Regla,
  logoEmpresa: string | null, logoMarca: string | null,
  onUpdate: (p: Producto) => void, onDelete: () => void
}) => {
  const fichaRef = useRef<HTMLDivElement>(null);
  const foto = bancoFotos[producto.sku.toLowerCase().trim()];
  const precioBase = producto.costo * (1 + producto.rent / 100);
  
  let descFinal = producto.descuentoManual;
  if (producto.cantidad === reglaCaja.x) {
    descFinal = reglaCaja.y;
  } else {
    const reglaPack = [...reglasPack].sort((a, b) => b.x - a.x).find(r => producto.cantidad >= r.x);
    if (reglaPack) descFinal = reglaPack.y;
  }

  const unitarioFinal = precioBase * (1 - descFinal / 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '380px' }}>
      {/* Selector de Cantidades */}
      <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '15px', border: '1px solid #eee' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#666' }}>CANTIDAD</span>
          <button onClick={onDelete} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ccc' }}>✕</button>
        </div>
        <div style={{ display: 'flex', gap: '5px' }}>
          {[1, 3, 6, 12, reglaCaja.x].map(n => (
            <button key={n} onClick={() => onUpdate({...producto, cantidad: n})} 
              style={{ flex: '1', padding: '10px 0', borderRadius: '10px', border: 'none', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: producto.cantidad === n ? '#d90429' : '#f0f0f0', color: producto.cantidad === n ? 'white' : '#666' }}>
              {n === reglaCaja.x ? `CAJA` : `x${n}`}
            </button>
          ))}
        </div>
      </div>

      {/* Ficha Visual (Estilo PDF Original) */}
      <div ref={fichaRef} className="area-captura" style={{ backgroundColor: 'white', borderRadius: '30px', overflow: 'hidden', border: '1px solid #eee', position: 'relative' }}>
        <div style={{ height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', padding: '20px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '15px', left: '15px', background: '#d90429', color: 'white', padding: '5px 12px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold' }}>SKU: {producto.sku}</div>
          
          {logoMarca && <img src={logoMarca} alt="marca" style={{ position: 'absolute', top: '10px', right: '10px', height: '60px', maxWidth: '110px', objectFit: 'contain' }} />}
          
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
          
          {/* Foto sin efectos para máxima claridad */}
          {foto ? <img src={foto} alt="prod" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} /> : <div style={{ color: '#eee', fontWeight: 'bold' }}>SIN FOTO</div>}
        </div>
        
        <div style={{ backgroundColor: 'black', padding: '20px', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
            <div style={{ flex: 1, paddingRight: '10px' }}><h4 style={{ margin: 0, fontSize: '15px', textTransform: 'uppercase', fontWeight: '900' }}>{producto.nombre}</h4></div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '10px', textDecoration: 'line-through', color: '#555' }}>${precioBase.toLocaleString('es-AR')}</div>
              <div style={{ fontSize: '24px', color: '#d90429', fontWeight: '900' }}>${unitarioFinal.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</div>
            </div>
          </div>

          <div style={{ backgroundColor: '#d90429', borderRadius: '20px', padding: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '9px', fontWeight: 'bold' }}>PRECIO BAJA A</div>
                <div style={{ fontSize: '28px', fontWeight: '900', color: 'white', lineHeight: '1' }}>
                  ${unitarioFinal.toLocaleString('es-AR', { maximumFractionDigits: 0 })}<span style={{ fontSize: '12px', marginLeft: '4px' }}>c/u</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '9px', fontWeight: 'bold', opacity: 0.8 }}>VALOR TOTAL</div>
                <div style={{ fontSize: '16px', fontWeight: '900', background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '10px' }}>
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

// --- APP PRINCIPAL ---
export default function App() {
  const [skuInput, setSkuInput] = useState("");
  const [items, setItems] = useState<Producto[]>([]);
  const [dbPrecios, setDbPrecios] = useState<any[]>([]);
  const [bancoFotos, setBancoFotos] = useState<Record<string, string>>({});
  const [logoEmpresa, setLogoEmpresa] = useState<string | null>(null);
  const [logoMarca, setLogoMarca] = useState<string | null>(null);
  const [reglasPack, setReglasPack] = useState<Regla[]>([{ x: 3, y: 10 }, { x: 6, y: 15 }, { x: 12, y: 20 }]);
  const [reglaCaja, setReglaCaja] = useState<Regla>({ x: 50, y: 25 });
  const [isDragging, setIsDragging] = useState(false);

  const procesarArchivo = (file: File) => {
    if (file.type.startsWith('image/')) {
      const r = new FileReader();
      r.onloadend = () => setBancoFotos(prev => ({ ...prev, [file.name.split('.')[0].toLowerCase().trim()]: r.result as string }));
      r.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const dtItems = e.dataTransfer.items;
    if (dtItems) {
      for (let i = 0; i < dtItems.length; i++) {
        const item = dtItems[i].webkitGetAsEntry();
        if (item) {
            const traverse = (entry: any) => {
                if (entry.isFile) entry.file(procesarArchivo);
                else if (entry.isDirectory) {
                    const reader = entry.createReader();
                    reader.readEntries((entries: any[]) => entries.forEach(traverse));
                }
            };
            traverse(item);
        }
      }
    }
  };

  const generarPDF = async () => {
    const html2canvas = (await import('html2canvas')).default;
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pW = pdf.internal.pageSize.getWidth();
    const pH = pdf.internal.pageSize.getHeight();

    // Portada Negra Original
    pdf.setFillColor(0, 0, 0); pdf.rect(0, 0, pW, pH, 'F');
    if (logoEmpresa) pdf.addImage(logoEmpresa, 'PNG', pW/2 - 45, pH/2 - 80, 90, 90);
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(30); pdf.setFont("helvetica", "bold");
    pdf.text("CATÁLOGO DE OFERTAS", pW/2, pH/2 + 30, { align: 'center' });

    const fichas = document.querySelectorAll('.area-captura');
    const mX = 10, mY = 15;
    const wF = (pW - (mX * 3)) / 2;
    const hF = (pH - (mY * 4)) / 3;

    for (let i = 0; i < fichas.length; i++) {
        const canvas = await html2canvas(fichas[i] as HTMLElement, { scale: 2 });
        if (i % 6 === 0) pdf.addPage();
        const col = i % 2;
        const fila = Math.floor((i % 6) / 2);
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', mX + (col*(wF+mX)), mY + (fila*(hF+mY)), wF, hF);
    }
    pdf.save("Catalogo_Tablada_Motos.pdf");
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f5f5f5', fontFamily: 'sans-serif' }}>
      <aside style={{ width: '320px', background: 'white', padding: '25px', borderRight: '1px solid #ddd', overflowY: 'auto' }}>
        <h2 style={{ color: '#d90429', fontWeight: '900' }}>STUDIO IA</h2>
        
        <div style={{ background: '#f0f0f0', padding: '15px', borderRadius: '15px', marginBottom: '15px' }}>
          <p style={{ fontSize: '10px', fontWeight: 'bold' }}>📦 REGLA CAJA</p>
          <div style={{ display: 'flex', gap: '5px' }}>
            <input type="number" value={reglaCaja.x} onChange={e => setReglaCaja({...reglaCaja, x: parseInt(e.target.value)})} style={{ width: '50%' }} />
            <input type="number" value={reglaCaja.y} onChange={e => setReglaCaja({...reglaCaja, y: parseInt(e.target.value)})} style={{ width: '50%' }} />
          </div>
        </div>

        <div style={{ background: '#f9f9f9', padding: '15px', borderRadius: '15px', marginBottom: '15px' }}>
          <p style={{ fontSize: '10px', fontWeight: 'bold' }}>REGLAS PACKS %</p>
          {reglasPack.map((r, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
              <input type="number" value={r.x} onChange={e => { const n = [...reglasPack]; n[idx].x = parseInt(e.target.value); setReglasPack(n); }} style={{ width: '45px' }} />
              <input type="number" value={r.y} onChange={e => { const n = [...reglasPack]; n[idx].y = parseInt(e.target.value); setReglasPack(n); }} style={{ width: '55px', color: '#d90429', fontWeight: 'bold' }} />
            </div>
          ))}
        </div>

        <button onClick={generarPDF} style={{ width: '100%', padding: '15px', background: 'black', color: 'white', borderRadius: '15px', fontWeight: 'bold', marginBottom: '15px', border: 'none', cursor: 'pointer' }}>📑 GENERAR PDF</button>

        <div style={{ fontSize: '11px', color: '#666' }}>
          <p>LOGO EMPRESA / MARCA</p>
          <input type="file" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => setLogoEmpresa(r.result as string); r.readAsDataURL(f); } }} />
          <input type="file" style={{marginTop: '5px'}} onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => setLogoMarca(r.result as string); r.readAsDataURL(f); } }} />
          <p style={{marginTop: '10px'}}>EXCEL</p>
          <input type="file" onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = (evt) => { const wb = XLSX.read(evt.target?.result, { type: 'binary' }); setDbPrecios(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]])); }; r.readAsBinaryString(f); }} />
        </div>

        <div onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={handleDrop}
          style={{ marginTop: '20px', padding: '30px 10px', background: isDragging ? '#ffebee' : '#d90429', color: 'white', borderRadius: '20px', textAlign: 'center', cursor: 'pointer' }}>
          {isDragging ? "SUELTA" : "📁 ARRASTRA FOTOS"}
        </div>
      </aside>

      <main style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
        <textarea value={skuInput} onChange={(e) => setSkuInput(e.target.value)} placeholder="Pegar SKUs..." style={{ width: '100%', height: '80px', borderRadius: '20px', padding: '15px', border: '1px solid #ddd' }} />
        <button onClick={() => { skuInput.split('\n').forEach(s => {
          const c = s.trim(); if (!c) return;
          const info = dbPrecios.find((p: any) => String(p.SKU).trim() === c);
          setItems(prev => [{ id: Date.now() + Math.random(), sku: c, nombre: info ? (info["NOMBRE "] || info["NOMBRE"] || "PRODUCTO") : "PRODUCTO", costo: info ? (parseFloat(info["costo"]) || 0) : 0, rent: info ? (parseFloat(info["rentabilidad "]) || 0) : 0, cantidad: 1, descuentoManual: 0 }, ...prev]);
        }); setSkuInput(""); }} style={{ width: '100%', padding: '15px', background: '#d90429', color: 'white', borderRadius: '15px', fontWeight: 'bold', marginTop: '10px', border: 'none', cursor: 'pointer' }}>GENERAR FICHAS</button>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '20px', marginTop: '20px' }}>
          {items.map(item => (
            <FichaStudioIA key={item.id} producto={item} bancoFotos={bancoFotos} reglasPack={reglasPack} reglaCaja={reglaCaja} logoEmpresa={logoEmpresa} logoMarca={logoMarca} onUpdate={(u) => setItems(items.map(i => i.id === item.id ? u : i))} onDelete={() => setItems(items.filter(i => i.id !== item.id))} />
          ))}
        </div>
      </main>
    </div>
  );
}
