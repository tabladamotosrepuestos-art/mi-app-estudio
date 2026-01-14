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
  const [showPreview, setShowPreview] = useState(false);

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
    doc.text("COTIZACIÓN DE REPUESTOS", 14, 20);
    if (logoEmpresa) doc.addImage(logoEmpresa, 'PNG', 150, 10, 40, 40);

    const lista = skus.split('\n').filter(s => s.trim() !== "").map(linea => {
      const codigo = linea.split('-')[0].trim();
      const match = dbPrecios.find((p: any) => String(p.codigo).toLowerCase() === codigo.toLowerCase());
      return [codigo, match?.descripcion || "Repuesto", `$${match?.precio || '0'}`];
    });

    (doc as any).autoTable({
      head: [['Código', 'Descripción', 'Precio']],
      body: lista,
      startY: 50,
      headStyles: { fillColor: [217, 4, 41] }
    });
    doc.save("Ficha_Tecnica.pdf");
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f4f7f6', fontFamily: 'sans-serif' }}>
      {/* Sidebar - Panel de Vinculación */}
      <aside style={{ width: '300px', backgroundColor: 'white', padding: '25px', borderRight: '1px solid #ddd' }}>
        <h2 style={{ color: '#d90429', fontSize: '18px', marginBottom: '30px' }}>SISTEMA COMERCIAL <span style={{color:'#000'}}>PRO</span></h2>
        
        <label style={{ display: 'block', padding: '15px', border: '2px dashed #ccc', borderRadius: '10px', textAlign: 'center', cursor: 'pointer', marginBottom: '20px' }}>
          <input type="file" hidden onChange={handleExcelUpload} />
          {dbPrecios.length > 0 ? '✅ EXCEL CONECTADO' : '📄 VINCULAR EXCEL'}
        </label>

        <label style={{ display: 'block', padding: '10px', border: '1px solid #eee', borderRadius: '8px', textAlign: 'center', cursor: 'pointer' }}>
          <input type="file" hidden onChange={handleLogoUpload} />
          {logoEmpresa ? '✅ LOGO CARGADO' : '🖼️ LOGO EMPRESA'}
        </label>
      </aside>

      {/* Main - Área de Trabajo */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', width: '500px' }}>
          <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>CATÁLOGO PROFESIONAL</h3>
          <textarea 
            value={skus}
            onChange={(e) => setSkus(e.target.value)}
            placeholder="Pega aquí tus SKUs o usa Escaneo IA..."
            style={{ width: '100%', height: '150px', borderRadius: '10px', border: '1px solid #eee', padding: '15px', marginBottom: '20px' }}
          />
          <button 
            onClick={() => setShowPreview(true)}
            style={{ width: '100%', padding: '15px', backgroundColor: '#d90429', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            GENERAR FICHAS
          </button>
        </div>
      </main>

      {/* Visor / Modal de Previsualización */}
      {showPreview && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '15px', width: '80%', maxWidth: '600px' }}>
            <h4>VISTA PREVIA DE FICHA</h4>
            <div style={{ border: '1px solid #eee', padding: '20px', minHeight: '200px', margin: '20px 0' }}>
               {skus.split('\n').map((s, i) => <div key={i}>{s}</div>)}
            </div>
            <button onClick={generarPDF} style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', marginRight: '10px' }}>DESCARGAR PDF</button>
            <button onClick={() => setShowPreview(false)} style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px' }}>CERRAR</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
