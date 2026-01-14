import React, { useState } from 'react';
import { extractProductsFromList } from './services/geminiService';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

function App() {
  const [loading, setLoading] = useState(false);
  const [skus, setSkus] = useState("");
  const [dbPrecios, setDbPrecios] = useState<any[]>([]);
  const [productosDetectados, setProductosDetectados] = useState<any[]>([]);

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws);
      setDbPrecios(data);
      alert(`¡Excel vinculado! ${data.length} productos listos.`);
    };
    reader.readAsBinaryString(file);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const data = await extractProductsFromList(reader.result as string);
        if (data.productos) {
          const procesados = data.productos.map((prodIA: any) => {
            const match = dbPrecios.find((p: any) => 
              String(p.codigo).toLowerCase() === String(prodIA.codigo).toLowerCase()
            );
            return {
              codigo: prodIA.codigo,
              descripcion: match?.descripcion || prodIA.descripcion,
              precio: match?.precio || "Consultar"
            };
          });
          setProductosDetectados(procesados);
          setSkus(procesados.map((p: any) => `${p.codigo} - ${p.descripcion} - $${p.precio}`).join("\n"));
        }
      } catch (error) {
        alert("Error en el escaneo.");
      } finally { setLoading(false); }
    };
    reader.readAsDataURL(file);
  };

  const generarPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("SISTEMA COMERCIAL PRO - COTIZACIÓN", 14, 20);
    
    // El parámetro 'p' ahora tiene tipo 'any' para evitar el error TS7006
    const tableRows = productosDetectados.map((p: any) => [p.codigo, p.descripcion, `$${p.precio}`]);
    
    (doc as any).autoTable({
      head: [['Código', 'Descripción', 'Precio']],
      body: tableRows,
      startY: 40,
      theme: 'striped',
      headStyles: { fillColor: [217, 4, 41] }
    });

    doc.save("Cotizacion_Repuestos.pdf");
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8f9fa', fontFamily: 'sans-serif' }}>
      <aside style={{ width: '280px', backgroundColor: 'white', borderRight: '1px solid #e9ecef', padding: '20px' }}>
        <div style={{ color: '#d90429', fontWeight: 'bold', marginBottom: '30px', fontSize: '18px' }}>
          SISTEMA COMERCIAL <span style={{color: '#2b2d42'}}>PRO</span>
        </div>
        <p style={{ fontSize: '12px', color: '#adb5bd', fontWeight: 'bold' }}>INVENTARIO BASE</p>
        <label style={{ display: 'block', border: '2px dashed #dee2e6', borderRadius: '10px', padding: '20px', textAlign: 'center', cursor: 'pointer', marginBottom: '30px' }}>
          <input type="file" accept=".xlsx, .xls" hidden onChange={handleExcelUpload} />
          {dbPrecios.length > 0 ? '✅ EXCEL VINCULADO' : 'VINCULAR EXCEL'}
        </label>
        <p style={{ fontSize: '12px', color: '#adb5bd', fontWeight: 'bold' }}>OFERTA GLOBAL</p>
        <div style={{ display: 'flex', gap: '5px' }}>
          {['0%', '10%', '20%', '30%'].map((pct: string) => (
            <button key={pct} style={{ flex: 1, padding: '8px', border: '1px solid #dee2e6', borderRadius: '5px', backgroundColor: pct === '0%' ? '#d90429' : 'white', color: pct === '0%' ? 'white' : 'black' }}>{pct}</button>
          ))}
        </div>
      </aside>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <label style={{ position: 'absolute', top: '20px', right: '20px', padding: '10px 20px', borderRadius: '5px', border: '1px solid #dee2e6', backgroundColor: 'white', cursor: 'pointer' }}>
          <input type="file" accept="image/*" hidden onChange={handleFileUpload} />
          📷 {loading ? 'PROCESANDO...' : 'ESCANEO IA'}
        </label>

        <div style={{ textAlign: 'center', maxWidth: '550px', width: '100%' }}>
          <h2 style={{ marginBottom: '25px', color: '#2b2d42' }}>CATÁLOGO PROFESIONAL</h2>
          <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '25px', boxShadow: '0 15px 35px rgba(0,0,0,0.05)' }}>
            <textarea 
              value={skus}
              readOnly
              placeholder="1. Vincula Excel\n2. Escanea Foto" 
              style={{ width: '100%', height: '180px', border: '1px solid #f1f3f5', borderRadius: '15px', padding: '20px', backgroundColor: '#f8f9fa', marginBottom: '25px' }}
            />
            <button 
              onClick={generarPDF}
              disabled={productosDetectados.length === 0}
              style={{ width: '100%', padding: '18px', backgroundColor: productosDetectados.length > 0 ? '#d90429' : '#ccc', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              GENERAR FICHAS (PDF)
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
