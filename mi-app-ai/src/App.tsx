import React, { useState } from 'react';
// Corrección del nombre de la función importada
import { extractProductsFromList } from './services/geminiService';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

function App() {
  const [loading, setLoading] = useState(false);

  // Ejemplo de función de exportación corregida con tipos
  const exportToExcel = (data: any[], sheetName: string) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${sheetName}.xlsx`);
  };

  return (
    <div className="App">
      <h1>Mi Aplicación de Repuestos</h1>
      {/* Tu interfaz aquí */}
    </div>
  );
}

export default App;
