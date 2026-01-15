import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';

// --- INTERFACES ---
interface Regla { x: number; y: number; }
interface Producto {
  id: number; sku: string; nombre: string; costo: number; rent: number;
  cantidad: number; descuentoManual: number;
}

// --- COMPONENTE DE LA FICHA ---
const FichaStudioIA = ({ producto, bancoFotos, reglasPack, reglaCaja, logoEmpresa, logoMarca, onUpdate, onDelete }: {
  producto: Producto, bancoFotos: Record<string, string>, reglasPack: Regla[], reglaCaja: Regla,
  logoEmpresa: string | null, logoMarca: string | null,
  onUpdate: (p: Producto) => void, onDelete: () => void
}) => {
  const fichaRef = useRef<HTMLDivElement>(null);
  const foto = bancoFotos[producto.sku.toLowerCase().trim()];
  const precioBase = producto.costo * (1 + producto.rent / 100);
  
  // Lógica de Descuento: Prioriza Caja Cerrada, luego reglas normales
  let descFinal = producto.descuentoManual;
  let esCajaCerrada = false;

  if (producto.cantidad >= reglaCaja.x) {
    descFinal = reglaCaja.y;
    esCajaCerrada = true;
  } else {
    const reglaPack = [...reglasPack].sort((a, b) => b.x - a.x).find(r => producto.cantidad >= r.x);
    if (reglaPack) descFinal = reglaPack.y;
  }

  const unitarioFinal = precioBase * (1 - descFinal / 100);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '380px' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '25px', padding: '18px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' }}>
          <span style={{ backgroundColor: esCajaCerrada ? '#000' : '#e8f5e9', color: esCajaCerrada ? '#fff' : '#2ecc71', padding: '4px 10px', borderRadius: '10px', fontSize: '9px', fontWeight: 'bold' }}>
            {esCajaCerrada ? '📦 MODO CAJA' : 'UNIDADES'}
          </span>
          <button onClick={onDelete} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ddd', fontSize: '18px' }}>✕</button>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[1, 3, 6, 12, reglaCaja.x].map(n => (
            <button key={n} onClick={() => onUpdate({...producto, cantidad: n})} 
              style={{ flex: '1 0 18%', padding: '10px 0', borderRadius: '12px', border: 'none', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', backgroundColor: producto.cantidad === n ? (n === reglaCaja.x ? 'black' : '#d90429') : '#f0f0f0', color: producto.cantidad === n ? 'white' : '#666' }}>
              {n === reglaCaja.x ? `CAJA x${n}` : `x${n}`}
            </button>
          ))}
        </div>
      </div>

      <div ref={fichaRef} className="area-captura" style={{ backgroundColor: 'white', borderRadius: '35px', overflow: 'hidden', boxShadow: '0 20px 45px rgba(0,0,0,0.12)', position: 'relative' }}>
        <div style={{ height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', padding: '20px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '15px', left: '15px', background: '#d90429', color: 'white', padding: '5px 12px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold' }}>SKU: {producto.sku}</div>
          {logoMarca && <img src={logoMarca} alt="marca" style={{ position: 'absolute', top: '10px', right: '10px', height: '60px', maxWidth: '110px', objectFit: 'contain' }} />}
          
          <div style={{ position: 'absolute', top: '80px', right: '15px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {descFinal > 0 && (
              <div style={{ background: esCajaCerrada ? 'black' : '#d90429', color: 'white', width: '55px', height: '55px', borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontWeight: '900' }}>
                <span style={{ fontSize: '8px' }}>{esCajaCerrada ? 'CAJA' : 'AHORRA'}</span>
                <span style={{ fontSize: '16px' }}>{descFinal}%</span>
              </div>
            )}
            <div style={{ background: 'black', color: 'white', width: '55px', height: '55px', borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontWeight: '900' }}>
                <span style={{ fontSize: '7px' }}>CANT.</span>
                <span style={{ fontSize: '16px' }}>x{producto.cantidad}</span>
            </div>
          </div>
          {logoEmpresa && <img src={logoEmpresa} alt="empresa" style={{ position: 'absolute', bottom: '15px', right: '15px', height: '55px', maxWidth: '110px', objectFit: 'contain' }} />}
          {foto ? <img src={foto} alt="prod" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} /> : <div style={{ color: '#eee', fontWeight: 'bold' }}>Sin Foto</div>}
        </div>
        
        <div style={{ backgroundColor: 'black', padding: '25px', color: 'white' }}>
          <h4 style={{ margin: '0 0 15px 0', fontSize: '15px', textTransform: 'uppercase', fontWeight: '900' }}>{producto.nombre}</h4>
          <div style={{ backgroundColor: esCajaCerrada ? '#ffd700' : '#d90429', borderRadius: '22px', padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '9px', fontWeight: 'bold', color: esCajaCerrada ? 'black' : 'white' }}>PRECIO {esCajaCerrada ? 'CAJA CERRADA' : 'BAJA A'}</div>
                <div style={{ fontSize: '30px', fontWeight: '900', color: esCajaCerrada ? 'black' : 'white', lineHeight: '1' }}>
                  ${unitarioFinal.toLocaleString('es-AR', { maximumFractionDigits: 0 })}<span style={{ fontSize: '12px', marginLeft: '4px' }}>c/u</span>
                </div>
              </div>
              <div style={{ textAlign: 'right', color: esCajaCerrada ? 'black' : 'white' }}>
                <div style={{ fontSize: '9px', fontWeight: 'bold' }}>TOTAL</div>
                <div style={{ fontSize: '16px', fontWeight: '900', background: 'rgba(0,0,0,0.1)', padding: '4px 10px', borderRadius: '10px' }}>
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
  const [reglasPack, setReglasPack] = useState<Regla[]>([{ x: 3, y: 10 }, { x: 6, y: 15 }]);
  const [reglaCaja, setReglaCaja] = useState<Regla>({ x: 20, y: 25 }); // REGLA DE CAJA
  const [whatsapp, setWhatsapp] = useState("3513755526");
  const [instagram, setInstagram] = useState("tablada_motos");
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files) Array.from(files).forEach(f => {
      const r = new FileReader();
      r.onloadend = () => setBancoFotos(p => ({ ...p, [f.name.split('.')[0].toLowerCase().trim()]: r.result as string }));
      r.readAsDataURL(f);
    });
  };

  const generarPDF = async () => {
    const html2canvas = (await import('html2canvas')).default;
    const { jsPDF } = await import('jspdf');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pW = pdf.internal.pageSize.getWidth();
    const pH = pdf.internal.pageSize.getHeight();

    // Portada
    pdf.setFillColor(0, 0, 0); pdf.rect(0, 0, pW, pH, 'F');
    if (logoEmpresa) pdf.addImage(logoEmpresa, 'PNG', pW/2 - 45, pH/2 - 80, 90, 90);
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(30); pdf.text("CATÁLOGO DE OFERTAS", pW/2, pH/2 + 30, { align: 'center' });
    pdf.setFontSize(14); pdf.text(`WhatsApp: ${whatsapp}`, pW/2, pH/2 + 50, { align: 'center' });

    // Fichas (6xHoja)
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

  const procesarSku = (sku: string) => {
    const c = sku.trim(); if (!c) return;
    const info = dbPrecios.find((p: any) => String(p.SKU).trim() === c);
    setItems(prev => [{
      id: Date.now() + Math.random(), sku: c,
      nombre: info ? (info["NOMBRE "] || info["NOMBRE"] || "PRODUCTO") : "PRODUCTO",
      costo: info ? (parseFloat(info["costo"]) || 0) : 0,
      rent: info ? (parseFloat(info["rentabilidad "]) || 0) : 0,
      cantidad: 1, descuentoManual: 0
    }, ...prev]);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f4f7f9', fontFamily: 'sans-serif' }}>
      <aside style={{ width: '340px', background: 'white', padding: '30px', borderRight: '1px solid #ddd', overflowY: 'auto' }}>
        <h2 style={{ color: '#d90429', fontWeight: '900' }}>STUDIO IA</h2>
        
        {/* NUEVA REGLA DE CAJA */}
        <div style={{ background: '#000', padding: '15px', borderRadius: '15px', marginBottom: '20px', color: '#fff' }}>
          <p style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '10px' }}>📦 REGLA CAJA CERRADA</p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '9px' }}>CANT.</span>
              <input type="number" value={reglaCaja.x} onChange={e => setReglaCaja({...reglaCaja, x: parseInt(e.target.value)})} style={{ width: '100%', padding: '5px' }} />
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '9px' }}>DESC %</span>
              <input type="number" value={reglaCaja.y} onChange={e => setReglaCaja({...reglaCaja, y: parseInt(e.target.value)})} style={{ width: '100%', padding: '5px' }} />
            </div>
          </div>
        </div>

        <button onClick={generarPDF} style={{ width: '100%', padding: '15px', background: 'black', color: 'white', borderRadius: '15px', fontWeight: 'bold', marginBottom: '20px', cursor: 'pointer' }}>📑 GENERAR PDF</button>

        <div style={{ marginBottom: '20px', background: '#f9f9f9', padding: '15px', borderRadius: '15px' }}>
          <p style={{ fontSize: '10px', fontWeight: 'bold' }}>REGLAS PACKS</p>
          {reglasPack.map((r, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '5px', marginBottom: '5px', alignItems: 'center' }}>
              <input type="number" value={r.x} onChange={e => { const n = [...reglasPack]; n[idx].x = parseInt(e.target.value); setReglasPack(n); }} style={{ width: '45px' }} />
              <span style={{ fontSize: '11px' }}>u. →</span>
              <input type="number" value={r.y} onChange={e => { const n = [...reglasPack]; n[idx].y = parseInt(e.target.value); setReglasPack(n); }} style={{ width: '55px', color: '#d90429', fontWeight: 'bold' }} />
            </div>
          ))}
        </div>

        <div 
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          style={{ padding: '30px 10px', background: isDragging ? '#ffebee' : '#d90429', color: 'white', borderRadius: '20px', textAlign: 'center', cursor: 'pointer' }}
        >
          {isDragging ? "SUELTA LA CARPETA" : "📁 ARRASTRA FOTOS AQUÍ"}
        </div>
        
        <button onClick={() => setItems([])} style={{ width: '100%', marginTop: '20px' }}>🗑️ LIMPIAR</button>
      </aside>

      <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        <textarea value={skuInput} onChange={(e) => setSkuInput(e.target.value)} placeholder="Pegar SKUs..." style={{ width: '100%', height: '80px', borderRadius: '20px', padding: '15px' }} />
        <button onClick={() => { skuInput.split('\n').forEach(procesarSku); setSkuInput(""); }} style={{ width: '100%', padding: '15px', background: '#d90429', color: 'white', borderRadius: '15px', marginTop: '10px' }}>GENERAR FICHAS</button>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '30px', marginTop: '30px' }}>
          {items.map(item => (
            <FichaStudioIA key={item.id} producto={item} bancoFotos={bancoFotos} reglasPack={reglasPack} reglaCaja={reglaCaja} logoEmpresa={logoEmpresa} logoMarca={logoMarca} onUpdate={(u) => setItems(items.map(i => i.id === item.id ? u : i))} onDelete={() => setItems(items.filter(i => i.id !== item.id))} />
          ))}
        </div>
      </main>
    </div>
  );
}
