import React, { useState } from 'react';
import { extractProductsFromList } from './services/geminiService';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { pdfjs, Document, Page } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configuración para react-pdf (importante para que funcione el visor)
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

function App() {
  const [loading, setLoading] = useState(false);
  const [skus, setSkus] = useState("");
  const [dbPrecios, setDbPrecios] = useState<any[]>([]);
  const [logoEmpresa, setLogoEmpresa] = useState<string | null>(null);
  const [logoMarca, setLogoMarca] = useState<string | null>(null);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null); // Para el previsualizador
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);

  // Funciones existentes (Excel, Logos, Escaneo IA)
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

  const handleScanIA = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const data = await extractProductsFromList(reader.result as string);
        if (data.productos) {
          const processedSkus = data.productos.map((prodIA: any) => {
            const match = dbPrecios.find((p: any) => 
              String(p.codigo).toLowerCase() === String(prodIA.codigo).toLowerCase()
            );
            return `${prodIA.codigo} - ${match?.descripcion || prodIA.descripcion} - $${match?.precio || "0"}`;
          }).join("\n");
          setSkus(processedSkus);
          alert("¡Lista de SKUs escaneada!");
        }
      } catch (error) {
        alert("Error al escanear con IA.");
      } finally { setLoading(false); }
    };
    reader.readAsDataURL(file);
  };

  // Función de Generación y Previsualización de PDF
  const generarYPrevisualizarFichas = () => {
    const doc = new jsPDF();
    const listaSkus = skus.split('\n').filter(s => s.trim() !== "");
    
    doc.setFontSize(20);
    doc.text("FICHA TÉCNICA DE PRODUCTOS", 14, 22);
    
    if (logoEmpresa) doc.addImage(logoEmpresa, 'PNG', 160, 10, 30, 30);

    const filas = listaSkus.map(sku => {
      const info = dbPrecios.find((p: any) => String(p.codigo).toLowerCase() === sku.split(' - ')[0].toLowerCase());
      return [
        sku.split(' - ')[0], // SKU
        info?.descripcion || sku.split(' - ')[1] || "Sin descripción", // Descripción
        `$${info?.precio || sku.split(' - ')[2]?.replace('$', '') || "0"}` // Precio
      ];
    });

    (doc as any).autoTable({
      head: [['SKU', 'Descripción', 'Precio']],
      body: filas,
      startY: 40,
      theme: 'grid',
      headStyles: { fillColor: [217, 4, 41] }
    });

    const pdfOutput = doc.output('blob');
    setPdfBlob(pdfOutput); // Guarda el PDF para el previsualizador
  };

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8f9fa', fontFamily: 'sans-serif' }}>
      {/* Barra Lateral Izquierda */}
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
        <div style={{ textAlign: 'center', width: '100%', maxWidth: '600px', position: 'relative' }}>
          <label style={{ position: 'absolute', top: '-40px', right: '0px', padding: '10px 20px', borderRadius: '5px', border: '1px solid #dee2e6', backgroundColor: 'white', cursor: 'pointer', fontSize: '14px' }}>
            <input type="file" accept="image/*" hidden onChange={handleScanIA} />
            📷 {loading ? 'PROCESANDO...' : 'ESCANEO IA'}
          </label>

          <h2 style={{ marginBottom: '30px', color: '#2b2d42', letterSpacing: '1px' }}>CATÁLOGO PROFESIONAL</h2>
          <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '30px', boxShadow: '0 20px 40px rgba(0,0,0,0.05)' }}>
             <p style={{ color: '#d90429', fontWeight: 'bold', fontSize: '12px', marginBottom: '10px', textAlign: 'left' }}>CARGA MANUAL DE SKUS</p>
             <textarea 
              value={skus}
              onChange={(e) => setSkus(e.target.value)}
              placeholder="Pega aquí uno o varios SKUs o usa Escaneo IA..." 
              style={{ width: '100%', height: '180px', border: '1px solid #f1f3f5', borderRadius: '15px', padding: '20px', backgroundColor: '#f8f9fa', marginBottom: '25px', outline: 'none', resize: 'none' }}
            />
            <button 
              onClick={generarYPrevisualizarFichas}
              disabled={skus.trim().length === 0}
              style={{ width: '100%', padding: '20px', backgroundColor: skus.trim().length > 0 ? '#d90429' : '#ccc', color: 'white', border: 'none', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}
            >
              GENERAR FICHAS
            </button>
          </div>
        </div>
      </main>

      {/* Modal de Previsualización de PDF */}
      {pdfBlob && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex',
          justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '10px', position: 'relative', maxWidth: '90%', maxHeight: '90%', overflow: 'auto' }}>
            <button 
              onClick={() => setPdfBlob(null)} 
              style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}
            >
              &times;
            </button>
            <h3 style={{ textAlign: 'center', marginBottom: '15px' }}>Previsualización de Ficha</h3>
            
            <Document file={pdfBlob} onLoadSuccess={onDocumentLoadSuccess}>
              {Array.from(new Array(numPages), (el, index) => (
                <Page key={`page_${index + 1}`} pageNumber={index + 1} renderTextLayer={false} renderAnnotationLayer={false} />
              ))}
            </Document>
            <p style={{ textAlign: 'center', marginTop: '10px' }}>
              Página {pageNumber || (numPages ? 1 : '--')} de {numPages || '--'}
            </p>
            <button 
              onClick={() => {
                const doc = new jsPDF(); // Volvemos a generar el PDF para descargarlo
                const listaSkus = skus.split('\n').filter(s => s.trim() !== "");
                doc.setFontSize(20);
                doc.text("FICHA TÉCNICA DE PRODUCTOS", 14, 22);
                if (logoEmpresa) doc.addImage(logoEmpresa, 'PNG', 160, 10, 30, 30);
                const filas = listaSkus.map(sku => {
                  const info = dbPrecios.find((p: any) => String(p.codigo).toLowerCase() === sku.split(' - ')[0].toLowerCase());
                  return [
                    sku.split(' - ')[0], 
                    info?.descripcion || sku.split(' - ')[1] || "Sin descripción", 
                    `$${info?.precio || sku.split(' - ')[2]?.replace('$', '') || "0"}`
                  ];
                });
                (doc as any).autoTable({ head: [['SKU', 'Descripción', 'Precio']], body: filas, startY: 40, theme: 'grid', headStyles: { fillColor: [217, 4, 41] } });
                doc.save("Fichas_Comerciales.pdf");
              }}
              style={{ width: '100%', padding: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', marginTop: '20px', cursor: 'pointer' }}
            >
              Descargar PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
