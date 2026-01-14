import React, { useState } from 'react';
import { extractProductsFromList } from './services/geminiService';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

function App() {
  const [loading, setLoading] = useState(false);
  const [skus, setSkus] = useState("");
  const [dbPrecios, setDbPrecios] = useState<any[]>([]);
  const [logoEmpresa, setLogoEmpresa] = useState<string | null>(null);
  const [logoMarca, setLogoMarca] = useState<string | null>(null);

  // 1. Vincular Excel de Inventario
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
      setDbPrecios(data);
      alert("✅ Inventario vinculado correctamente.");
    };
    reader.readAsBinaryString(file);
  };

  // 2. Cargar Logos (Empresa/Marca)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, tipo: 'empresa' | 'marca') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (tipo === 'empresa') setLogoEmpresa(reader.result as string);
      else setLogoMarca(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // 3. Generar Ficha Profesional (PDF)
  const generarFichas = () => {
    const doc = new jsPDF();
    const listaSkus = skus.split('\n').filter(s => s.trim() !== "");
    
    doc.setFontSize(20);
    doc.text("FICHA TÉCNICA DE PRODUCTOS", 14, 22);
    
    // Si hay logo de empresa, lo ponemos en la esquina
    if (logoEmpresa) doc.addImage(logoEmpresa, 'PNG', 160, 10, 30, 30);

    const filas = listaSkus.map(sku => {
      const info = dbPrecios.find((p: any) => String(p.codigo).toLowerCase() === sku.toLowerCase());
      return [sku, info?.descripcion || "Sin descripción", `$${info?.precio || "0"}`];
    });

    (doc as any).autoTable({
      head: [['SKU', 'Descripción', 'Precio']],
      body: filas,
      startY: 40,
      theme: 'grid',
      headStyles: { fillColor: [217, 4, 41] } // Rojo del Sistema Pro
    });

    doc.save("Fichas_Comerciales.pdf");
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8f9fa', fontFamily: 'sans-serif' }}>
      {/* Barra Lateral Izquierda - Tus herramientas de vinculación */}
      <aside style={{ width: '300px', backgroundColor: 'white', borderRight: '1px solid #e9ecef', padding: '25px' }}>
        <div style={{ color: '#d90429', fontWeight: 'bold', marginBottom: '30px', fontSize: '18px' }}>
          SISTEMA COMERCIAL <span style={{color: '#2b2d42'}}>PRO</span>
        </div>

        <div style={{ marginBottom: '25px' }}>
          <p style={{ fontSize: '11px', color: '#adb5bd', fontWeight: 'bold', textTransform: 'uppercase' }}>Inventario Base</p>
          <label style={{ display: 'block', border: '2px dashed #dee2e6', borderRadius: '12px', padding: '20px', textAlign: 'center', cursor: 'pointer', color: dbPrecios.length > 0 ? '#27ae60' : '#adb5bd' }}>
            <input type="file" accept=".xlsx, .xls" hidden onChange={handleExcelUpload} />
            {dbPrecios.length > 0 ? '✅ EXCEL VINCULADO' : '📄 VINCULAR EXCEL'}
          </label>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
          <label style={{ flex: 1, border: '1px solid #eee', padding: '10px', borderRadius: '8px', textAlign: 'center', cursor: 'pointer', fontSize: '12px' }}>
            <input type="file" hidden onChange={(e) => handleImageUpload(e, 'empresa')} />
            {logoEmpresa ? '✅ EMPRESA' : '🏢 LOGO EMPRESA'}
          </label>
          <label style={{ flex: 1, border: '1px solid #eee', padding: '10px', borderRadius: '8px', textAlign: 'center', cursor: 'pointer', fontSize: '12px' }}>
            <input type="file" hidden onChange={(e) => handleImageUpload(e, 'marca')} />
            {logoMarca ? '✅ MARCA' : '🛡️ LOGO MARCA'}
          </label>
        </div>

        <p style={{ fontSize: '11px', color: '#adb5bd', fontWeight: 'bold' }}>OFERTA GLOBAL</p>
        <div style={{ display: 'flex', gap: '5px' }}>
          {['0%', '10%', '20%', '30%'].map((pct: string) => (
            <button key={pct} style={{ flex: 1, padding: '8px', border: '1px solid #dee2e6', borderRadius: '6px', backgroundColor: pct === '0%' ? '#d90429' : 'white', color: pct === '0%' ? 'white' : 'black' }}>{pct}</button>
          ))}
        </div>
      </aside>

      {/* Contenido Central */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', width: '100%', maxWidth: '600px' }}>
          <h2 style={{ marginBottom: '30px', color: '#2b2d42', letterSpacing: '1px' }}>CATÁLOGO PROFESIONAL</h2>
          <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '30px', boxShadow: '0 20px 40px rgba(0,0,0,0.05)' }}>
             <p style={{ color: '#d90429', fontWeight: 'bold', fontSize: '12px', marginBottom: '10px', textAlign: 'left' }}>CARGA MANUAL DE SKUS</p>
             <textarea 
              value={skus}
              onChange={(e) => setSkus(e.target.value)}
              placeholder="Pega aquí uno o varios SKUs..." 
              style={{ width: '100%', height: '180px', border: '1px solid #f1f3f5', borderRadius: '15px', padding: '20px', backgroundColor: '#f8f9fa', marginBottom: '25px', outline: 'none', resize: 'none' }}
            />
            <button 
              onClick={generarFichas}
              style={{ width: '100%', padding: '20px', backgroundColor: '#d90429', color: 'white', border: 'none', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}
            >
              GENERAR FICHAS
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
