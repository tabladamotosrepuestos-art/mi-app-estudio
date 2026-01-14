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
  const [bancoFotos, setBancoFotos] = useState<Record<string, string>>({}); // Almacena SKU -> Imagen (Base64)
  const [showPreview, setShowPreview] = useState(false);

  // 1. Vincular Banco de Fotos (Carga masiva)
  const handleBancoFotosUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const nuevoBanco: Record<string, string> = { ...bancoFotos };
    
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const nombreSinExt = file.name.split('.')[0].toLowerCase();
        nuevoBanco[nombreSinExt] = reader.result as string;
        setBancoFotos({ ...nuevoBanco });
      };
      reader.readAsDataURL(file);
    });
    alert(`¡Banco de fotos actualizado! ${files.length} imágenes cargadas.`);
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
      setDbPrecios(data);
      alert("✅ Inventario y Precios Vinculados");
    };
    reader.readAsBinaryString(file);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setLogoEmpresa(reader.result as string);
    reader.readAsDataURL(file);
  };

  const generarPDF = () => {
    const doc = new jsPDF();
    doc.text("FICHA COMERCIAL PROFESIONAL", 14, 20);
    if (logoEmpresa) doc.addImage(logoEmpresa, 'PNG', 160, 10, 30, 30);

    const lista = skus.split('\n').filter(s => s.trim() !== "").map(linea => {
      const codigo = linea.split('-')[0].trim().toLowerCase();
      const match = dbPrecios.find((p: any) => String(p.codigo).toLowerCase() === codigo);
      return {
        codigo: codigo.toUpperCase(),
        descripcion: match?.descripcion || "Repuesto",
        precio: `$${match?.precio || '0'}`,
        foto: bancoFotos[codigo] || null
      };
    });

    (doc as any).autoTable({
      head: [['Imagen', 'Código', 'Descripción', 'Precio']],
      body: lista.map(p => ["", p.codigo, p.descripcion, p.precio]),
      startY: 45,
      didDrawCell: (data: any) => {
        if (data.column.index === 0 && data.cell.section === 'body') {
          const prod = lista[data.row.index];
          if (prod.foto) {
            doc.addImage(prod.foto, 'JPEG', data.cell.x + 2, data.cell.y + 2, 16, 16);
          }
        }
      },
      headStyles: { fillColor: [217, 4, 41] },
      styles: { minCellHeight: 20 }
    });
    doc.save("Cotizacion_Final.pdf");
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f4f7f6', fontFamily: 'sans-serif' }}>
      <aside style={{ width: '300px', backgroundColor: 'white', padding: '25px', borderRight: '1px solid #ddd' }}>
        <h2 style={{ color: '#d90429', fontSize: '18px', marginBottom: '30px' }}>SISTEMA COMERCIAL <span style={{color:'#000'}}>PRO</span></h2>
        
        <p style={{ fontSize: '11px', color: '#999', fontWeight: 'bold' }}>1. DATOS</p>
        <label style={{ display: 'block', padding: '15px', border: '2px dashed #ccc', borderRadius: '10px', textAlign: 'center', cursor: 'pointer', marginBottom: '20px' }}>
          <input type="file" hidden onChange={handleExcelUpload} />
          {dbPrecios.length > 0 ? '✅ EXCEL CONECTADO' : '📄 VINCULAR EXCEL'}
        </label>

        <p style={{ fontSize: '11px', color: '#999', fontWeight: 'bold' }}>2. IMÁGENES</p>
        <label style={{ display: 'block', padding: '10px', border: '1px solid #eee', borderRadius: '8px', textAlign: 'center', cursor: 'pointer', marginBottom: '10px' }}>
          <input type="file" hidden onChange={handleLogoUpload} />
          {logoEmpresa ? '✅ LOGO CARGADO' : '🖼️ LOGO EMPRESA'}
        </label>

        <label style={{ display: 'block', padding: '15px', border: '2px solid #d90429', color: '#d90429', borderRadius: '10px', textAlign: 'center', cursor: 'pointer', fontWeight: 'bold' }}>
          <input type="file" hidden multiple accept="image/*" onChange={handleBancoFotosUpload} />
          📂 BANCO FOTOS SKUS
        </label>
      </aside>

      <main style={{ flex: 1, display: 'flex', flexWrap: 'wrap', padding: '40px', gap: '20px', justifyContent: 'center' }}>
        <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', width: '100%', maxWidth: '500px' }}>
          <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>CATÁLOGO PROFESIONAL</h3>
          <textarea 
            value={skus}
            onChange={(e) => setSkus(e.target.value)}
            placeholder="Pega aquí tus SKUs..."
            style={{ width: '100%', height: '150px', borderRadius: '10px', border: '1px solid #eee', padding: '15px', marginBottom: '20px' }}
          />
          <button 
            onClick={() => setShowPreview(true)}
            style={{ width: '100%', padding: '15px', backgroundColor: '#d90429', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            GENERAR FICHAS
          </button>
        </div>

        {/* Visor de Fotos Detectadas (Estilo Studio IA) */}
        <div style={{ width: '100%', maxWidth: '500px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          {skus.split('\n').filter(s => s.trim() !== "").map((linea, idx) => {
            const cod = linea.split('-')[0].trim().toLowerCase();
            return (
              <div key={idx} style={{ padding: '10px', background: 'white', borderRadius: '10px', textAlign: 'center', fontSize: '10px', border: '1px solid #eee' }}>
                <div style={{ width: '100%', height: '80px', background: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '5px' }}>
                  {bancoFotos[cod] ? <img src={bancoFotos[cod]} style={{ maxWidth: '100%', maxHeight: '100%' }} /> : '❌ SIN FOTO'}
                </div>
                {cod.toUpperCase()}
              </div>
            );
          })}
        </div>
      </main>

      {showPreview && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '15px', width: '80%', maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto' }}>
            <h4>VISTA PREVIA - {skus.split('\n').filter(s => s.trim() !== "").length} PRODUCTOS</h4>
            <button onClick={generarPDF} style={{ padding: '15px 30px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '10px', width: '100%', fontWeight: 'bold', cursor: 'pointer' }}>DESCARGAR PDF CON FOTOS</button>
            <button onClick={() => setShowPreview(false)} style={{ padding: '10px', color: '#666', border: 'none', background: 'none', width: '100%', cursor: 'pointer', marginTop: '10px' }}>CANCELAR</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
