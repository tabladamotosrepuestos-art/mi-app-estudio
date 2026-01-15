import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';

// --- INTERFACES ---
interface Regla { x: number; y: number; }
interface Producto {
  id: number; sku: string; nombre: string; costo: number; rent: number;
  cantidad: number; descuentoManual: number;
}

// --- COMPONENTE DE LA FICHA (DISEÑO PREMIUM ACTUALIZADO) ---
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

  const copiarImagen = async () => {
    const html2canvas = (await import('html2canvas')).default;
    if (fichaRef.current) {
      const canvas = await html2canvas(fichaRef.current, { useCORS: true, scale: 2, backgroundColor: '#ffffff' });
      canvas.toBlob(async (blob) => {
        if (blob) {
          try {
            const data = [new ClipboardItem({ [blob.type]: blob })];
            await navigator.clipboard.write(data);
            alert("✅ Diseño copiado al portapapeles.");
          } catch (err) { alert("Error al copiar."); }
        }
      }, 'image/png');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '380px' }}>
      {/* Controles del Editor Modernizados */}
      <div style={{ backgroundColor: 'white', borderRadius: '24px', padding: '15px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
          <span style={{ color: '#888', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px' }}>CONFIGURAR OFERTA</span>
          <button onClick={onDelete} style={{ border: 'none', background: '#fee2e2', color: '#ef4444', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', fontSize: '12px' }}>✕</button>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[1, 3, 6, 12, reglaCaja.x].map(n => (
            <button key={n} onClick={() => onUpdate({...producto, cantidad: n})} 
              style={{ 
                flex: '1', padding: '10px 0', borderRadius: '10px', border: 'none', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: producto.cantidad === n ? '#d90429' : '#f3f4f6',
                color: producto.cantidad === n ? 'white' : '#4b5563',
                boxShadow: producto.cantidad === n ? '0 4px 10px rgba(217,4,41,0.3)' : 'none'
              }}>
              {n === reglaCaja.x ? `CAJA` : `x${n}`}
            </button>
          ))}
          <button onClick={copiarImagen} style={{ padding: '0 10px', borderRadius: '10px', border: '1px solid #ddd', background: 'white', cursor: 'pointer' }}>📋</button>
        </div>
      </div>

      {/* Ficha Visual (Área de Captura) */}
      <div ref={fichaRef} className="area-captura" style={{ backgroundColor: 'white', borderRadius: '40px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', position: 'relative' }}>
        
        {/* Contenedor de Imagen con Degradado y Profundidad */}
        <div style={{ 
          height: '300px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          background: 'radial-gradient(circle, #ffffff 0%, #f8f9fa 100%)', 
          padding: '30px', 
          position: 'relative' 
        }}>
          <div style={{ position: 'absolute', top: '20px', left: '25px', background: 'rgba(217,4,41,0.1)', color: '#d90429', padding: '4px 12px', borderRadius: '8px', fontSize: '10px', fontWeight: '800', border: '1px solid rgba(217,4,41,0.2)' }}>SKU: {producto.sku}</div>
          
          {logoMarca && <img src={logoMarca} alt="marca" style={{ position: 'absolute', top: '15px', right: '20px', height: '50px', maxWidth: '100px', objectFit: 'contain', filter: 'grayscale(0.2)' }} />}
          
          <div style={{ position: 'absolute', top: '80px', right: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {descFinal > 0 && (
              <div style={{ background: '#d90429', color: 'white', width: '58px', height: '58px', borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontWeight: '900', boxShadow: '0 8px 15px rgba(217,4,41,0.4)', border: '2px solid white' }}>
                <span style={{ fontSize: '8px' }}>AHORRA</span>
                <span style={{ fontSize: '17px' }}>{descFinal}%</span>
              </div>
            )}
            {producto.cantidad > 1 && (
              <div style={{ background: '#1a1a1a', color: 'white', width: '58px', height: '58px', borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontWeight: '900', boxShadow: '0 8px 15px rgba(0,0,0,0.2)', border: '2px solid white' }}>
                <span style={{ fontSize: '7px' }}>CANT.</span>
                <span style={{ fontSize: '17px' }}>x{producto.cantidad}</span>
              </div>
            )}
          </div>

          {logoEmpresa && <img src={logoEmpresa} alt="empresa" style={{ position: 'absolute', bottom: '20px', right: '25px', height: '50px', maxWidth: '100px', objectFit: 'contain', opacity: 0.9 }} />}
          
          {/* Imagen con Sombra Proyectada (Efecto 3D) */}
          {foto ? <img src={foto} alt="prod" style={{ maxWidth: '85%', maxHeight: '85%', objectFit: 'contain', filter: 'drop-shadow(0 15px 25px rgba(0,0,0,0.15))' }} /> : <div style={{ color: '#ddd', fontWeight: 'bold', fontSize: '12px' }}>SIN IMAGEN</div>}
        </div>
        
        {/* Pie de Ficha Negro e Impactante */}
        <div style={{ backgroundColor: '#0f172a', padding: '25px 30px', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
            <div style={{ flex: 1 }}><h4 style={{ margin: 0, fontSize: '16px', textTransform: 'uppercase', fontWeight: '900', lineHeight: '1.1', color: '#f8fafc' }}>{producto.nombre}</h4></div>
            <div style={{ textAlign: 'right', marginLeft: '15px' }}>
              <div style={{ fontSize: '11px', textDecoration: 'line-through', color: '#64748b', marginBottom: '2px' }}>${precioBase.toLocaleString('es-AR')}</div>
              <div style={{ fontSize: '28px', color: '#fb7185', fontWeight: '900', lineHeight: '1' }}>${unitarioFinal.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</div>
            </div>
          </div>

          <div style={{ background: 'linear-gradient(135deg, #d90429 0%, #991b1b 100%)', borderRadius: '24px', padding: '20px', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9, marginBottom: '4px' }}>PRECIO MAYORISTA</div>
                <div style={{ fontSize: '32px', fontWeight: '900', color: 'white', lineHeight: '1' }}>
                  ${unitarioFinal.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                  <span style={{ fontSize: '12px', marginLeft: '5px', fontWeight: 'normal' }}>c/u</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '9px', fontWeight: 'bold', opacity: 0.8, marginBottom: '4px' }}>TOTAL PACK</div>
                <div style={{ fontSize: '18px', fontWeight: '900', background: 'rgba(0,0,0,0.2)', padding: '6px 14px', borderRadius: '12px' }}>
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
  const [whatsapp, setWhatsapp] = useState("3513755526");
  const [instagram, setInstagram] = useState("tablada_motos");
  const [isDragging, setIsDragging] = useState(false);

  // Lógica de procesamiento de carpetas y archivos
  const procesarArchivo = (file: File) => {
    if (file.type.startsWith('image/')) {
      const r = new FileReader();
      r.onloadend = () => {
        const sku = file.name.split('.')[0].toLowerCase().trim();
        setBancoFotos(prev => ({ ...prev, [sku]: r.result as string }));
      };
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

    // Portada de Alta Calidad
    pdf.setFillColor(15, 23, 42); pdf.rect(0, 0, pW, pH, 'F');
    if (logoEmpresa) pdf.addImage(logoEmpresa, 'PNG', pW/2 - 45, pH/2 - 80, 90, 90);
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(32); pdf.setFont("helvetica", "bold");
    pdf.text("CATÁLOGO DE OFERTAS", pW/2, pH/2 + 30, { align: 'center' });
    pdf.setFontSize(14); pdf.setFont("helvetica", "normal");
    pdf.setTextColor(200, 200, 200);
    pdf.text(`WhatsApp: ${whatsapp}  |  @${instagram}`, pW/2, pH/2 + 50, { align: 'center' });

    const fichas = document.querySelectorAll('.area-captura');
    const mX = 10, mY = 15;
    const wF = (pW - (mX * 3)) / 2;
    const hF = (pH - (mY * 4)) / 3;

    for (let i = 0; i < fichas.length; i++) {
        const canvas = await html2canvas(fichas[i] as HTMLElement, { scale: 2, useCORS: true });
        if (i % 6 === 0) pdf.addPage();
        const col = i % 2;
        const fila = Math.floor((i % 6) / 2);
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', mX + (col*(wF+mX)), mY + (fila*(hF+mY)), wF, hF);
    }
    pdf.save("Catalogo_Premium_Tablada.pdf");
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      <aside style={{ width: '350px', background: 'white', padding: '30px', borderRight: '1px solid #e2e8f0', overflowY: 'auto', boxShadow: '10px 0 30px rgba(0,0,0,0.02)' }}>
        <h2 style={{ color: '#d90429', fontWeight: '900', letterSpacing: '-1px', marginBottom: '25px' }}>STUDIO IA <span style={{fontSize: '10px', color: '#94a3b8', verticalAlign: 'middle'}}>V3.0</span></h2>
        
        {/* REGLA CAJA */}
        <div style={{ background: '#0f172a', padding: '20px', borderRadius: '20px', marginBottom: '20px', color: 'white' }}>
          <p style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '12px', color: '#94a3b8' }}>📦 CONFIGURACIÓN DE CAJA</p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}><span style={{ fontSize: '9px', opacity: 0.7 }}>CANTIDAD</span><input type="number" value={reglaCaja.x} onChange={e => setReglaCaja({...reglaCaja, x: parseInt(e.target.value)})} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: 'none', marginTop: '4px' }} /></div>
            <div style={{ flex: 1 }}><span style={{ fontSize: '9px', opacity: 0.7 }}>% DESC</span><input type="number" value={reglaCaja.y} onChange={e => setReglaCaja({...reglaCaja, y: parseInt(e.target.value)})} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: 'none', marginTop: '4px', color: '#f43f5e', fontWeight: 'bold' }} /></div>
          </div>
        </div>

        {/* REGLAS PACKS */}
        <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '20px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
          <p style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '10px' }}>REGLAS DE PACKS %</p>
          {reglasPack.map((r, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
              <input type="number" value={r.x} onChange={e => { const n = [...reglasPack]; n[idx].x = parseInt(e.target.value); setReglasPack(n); }} style={{ width: '50px', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
              <span style={{ fontSize: '12px', color: '#64748b' }}>u. →</span>
              <input type="number" value={r.y} onChange={e => { const n = [...reglasPack]; n[idx].y = parseInt(e.target.value); setReglasPack(n); }} style={{ width: '60px', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', color: '#d90429', fontWeight: 'bold' }} />
            </div>
          ))}
        </div>

        <button onClick={generarPDF} style={{ width: '100%', padding: '18px', background: '#0f172a', color: 'white', borderRadius: '18px', fontWeight: 'bold', marginBottom: '20px', cursor: 'pointer', border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}>📑 GENERAR PDF PREMIUM</button>

        <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div><p style={{marginBottom: '5px'}}>LOGO EMPRESA</p><input type="file" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => setLogoEmpresa(r.result as string); r.readAsDataURL(f); } }} /></div>
          <div><p style={{marginBottom: '5px'}}>LOGO MARCA (CKM)</p><input type="file" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onload = () => setLogoMarca(r.result as string); r.readAsDataURL(f); } }} /></div>
          <div><p style={{marginBottom: '5px'}}>EXCEL PRECIOS</p><input type="file" onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = (evt) => { const wb = XLSX.read(evt.target?.result, { type: 'binary' }); setDbPrecios(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]])); }; r.readAsBinaryString(f); }} /></div>
        </div>

        <div onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={handleDrop}
          style={{ marginTop: '25px', padding: '40px 20px', background: isDragging ? '#fff1f2' : '#d90429', color: 'white', borderRadius: '25px', textAlign: 'center', cursor: 'pointer', border: isDragging ? '2px dashed #d90429' : 'none', transition: 'all 0.3s' }}>
          <span style={{fontSize: '30px', display: 'block', marginBottom: '10px'}}>📁</span>
          <span style={{fontWeight: 'bold', fontSize: '13px'}}>{isDragging ? "¡SUELTA LA CARPETA!" : "ARRASTRA TU CARPETA AQUÍ"}</span>
        </div>
      </aside>

      <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        <div style={{ maxWidth: '850px', margin: '0 auto' }}>
          <textarea value={skuInput} onChange={(e) => setSkuInput(e.target.value)} placeholder="Escribe o pega los SKUs aquí..." style={{ width: '100%', height: '100px', borderRadius: '25px', padding: '25px', border: '1px solid #e2e8f0', marginBottom: '15px', fontSize: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', outline: 'none' }} />
          <button onClick={() => { skuInput.split('\n').forEach(s => {
            const c = s.trim(); if (!c) return;
            const info = dbPrecios.find((p: any) => String(p.SKU).trim() === c);
            setItems(prev => [{ id: Date.now() + Math.random(), sku: c, nombre: info ? (info["NOMBRE "] || info["NOMBRE"] || "PRODUCTO") : "PRODUCTO", costo: info ? (parseFloat(info["costo"]) || 0) : 0, rent: info ? (parseFloat(info["rentabilidad "]) || 0) : 0, cantidad: 1, descuentoManual: 0 }, ...prev]);
          }); setSkuInput(""); }} style={{ width: '100%', padding: '20px', background: '#d90429', color: 'white', borderRadius: '20px', fontWeight: 'bold', border: 'none', cursor: 'pointer', fontSize: '16px', boxShadow: '0 10px 25px rgba(217,4,41,0.2)' }}>GENERAR FICHAS DE OFERTA</button>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '40px', marginTop: '50px' }}>
            {items.map(item => (
              <FichaStudioIA key={item.id} producto={item} bancoFotos={bancoFotos} reglasPack={reglasPack} reglaCaja={reglaCaja} logoEmpresa={logoEmpresa} logoMarca={logoMarca} onUpdate={(u) => setItems(items.map(i => i.id === item.id ? u : i))} onDelete={() => setItems(items.filter(i => i.id !== item.id))} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
