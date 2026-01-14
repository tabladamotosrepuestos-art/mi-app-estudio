import React, { useState } from 'react';
// Cambiamos el nombre para que coincida con el servicio
import { extractProductsFromList } from './services/geminiService';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

function App() {
  const [loading, setLoading] = useState(false);

  // Agregamos tipos para evitar errores de TypeScript
  const exportToExcel = (data: any[], sheetName: string) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${sheetName}.xlsx`);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Analizador de Repuestos</h1>
      <p>Sube una lista o imagen para comenzar.</p>
    </div>
  );
}

export default App;
