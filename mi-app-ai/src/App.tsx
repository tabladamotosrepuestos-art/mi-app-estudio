import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';

export default function App() {
  const [skusInput, setSkusInput] = useState("");
  const [listaProductos, setListaProductos] = useState<any[]>([]); // Los productos que se ven en pantalla
  const [dbPrecios, setDbPrecios] = useState<any[]>([]);
  const [bancoFotos, setBancoFotos] = useState<Record<string, string>>({});
  
  // Configuración Global (se hereda a las tarjetas nuevas)
  const [ofertaGlobal, setOfertaGlobal] = useState(0);
  const [reglasPack, setReglasPack] = useState([
    { x: 3, y: 5 },
    { x: 5, y: 7 },
    { x: 10, y: 10 }
  ]);

  // Al escribir SKUs, generamos los objetos de producto editables
  useEffect(() => {
    const lineas = skusInput.split('\n').filter(l => l.trim() !== "");
    const nuevosProductos = lineas.map((linea, index) => {
      const cod = linea.trim();
      const info = dbPrecios.find((p: any) => String(p.SKU).trim() === cod);
      return {
        id: `${cod}-${index}`,
        sku: cod,
        nombre: info?.["NOMBRE "] || "PRODUCTO NO ENCONTRADO",
        costo: parseFloat(info?.costo) || 0,
        rent: parseFloat(info?.["rentabilidad "]) || 0,
        cantidad: 1, // Por defecto 1
        descuentoManual: ofertaGlobal // Hereda el global inicial
      };
    });
    setListaProductos(nuevosProductos);
  }, [skusInput, dbPrecios]);

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      setDbPrecios(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]));
    };
    reader.readAsBinaryString(file);
  };

  const handleBancoFotosUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const nuevoBanco = { ...bancoFotos };
    Array.from(files).forEach(f => {
      const r = new FileReader();
      r.onloadend = () => {
        nuevoBanco[f.name.split('.')[0].toLowerCase().trim()] = r.result as string;
        setBancoFotos({ ...nuevoBanco });
      };
      r.readAsDataURL(f);
    });
  };

  // Función de cálculo individual por tarjeta
  const calcularPrecioFinal = (p: any) => {
    const precioBase = p.costo * (1 + p.rent / 100);
    
    // Buscar si la cantidad elegida en LA TARJETA activa un pack
    const reglaPack = [...reglasPack]
      .sort((a, b) => b.x - a.x)
      .find(r => p.cantidad >= r.x);

    const descAplicado = reglaPack ? reglaPack.y : p.descuentoManual;
    const unitario = precioBase * (1 - descAplicado / 100);
    
    return { unitario, total: unitario * p.cantidad, desc: descAplicado, esPack: !!reglaPack };
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f4f7f6', fontFamily: 'sans-serif' }}>
      {/* SIDEBAR */}
      <aside style={{ width: '320px', padding: '25px', backgroundColor: 'white', borderRight: '1px solid #eee', overflowY: 'auto' }}>
        <h1 style={{ color: '#d90429', fontSize: '18px', fontWeight: 'bold', marginBottom: '30px' }}>STUDIO IA - EDITOR</h1>
        
        <label style={{ display: 'block', padding: '15px', border: '1px dashed #ddd', borderRadius: '12px', textAlign: 'center', cursor: 'pointer', marginBottom: '10px' }}>
          <input type="file" hidden onChange={handleExcelUpload} />
          {dbPrecios.length > 0 ? "✅ EXCEL VINCULADO" : "1. VINCULAR EXCEL"}
        </label>

        <label style={{ display: 'block', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '12px', textAlign: 'center', cursor: 'pointer', marginBottom: '25px' }}>
          <input type="file" hidden multiple onChange={handleBancoFotosUpload} />
          2. CARGAR FOTOS
        </label>

        <p style={{ fontSize: '11px', color: '#bbb', fontWeight: 'bold', marginBottom: '10px' }}>REGLAS DE PACK GLOBALES</p>
        {reglasPack.map((r, i) => (
          <div key={i} style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
            <input type="number" value={r.x} onChange={(e) => {
              const n = [...reglasPack]; n[i].x = parseInt(e.target.value) || 0; setReglasPack(n);
            }} style={{ width: '50px', padding: '5px', border: '1px solid #eee' }} />
            <span style={{fontSize:'10px', alignSelf:'center'}}>un. →</span>
            <input type="number" value={r.y} onChange={(e) => {
              const n = [...reglasPack]; n[i].y = parseInt(e.target.value) || 0; setReglasPack(n);
            }} style={{ flex: 1, padding: '5px', border: '1px solid #eee', color: '#d90429' }} />
            <span style={{fontSize:'10px', alignSelf:'center'}}>%</span>
          </div>
        ))}
      </aside>

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, padding: '30px', overflowY: 'auto' }}>
        <textarea 
          value={skusInput} 
          onChange={(e) => setSkusInput(e.target.value)} 
          placeholder="Escribe SKUs aquí..." 
          style={{ width: '100%', height: '80px', borderRadius: '20px', padding: '20px', border: '1px solid #eee', marginBottom: '20px', outline: 'none' }} 
        />

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center' }}>
          {listaProductos.map((p, idx) => {
            const res = calcularPrecioFinal(p);
            const foto = bancoFotos[p.sku.toLowerCase()];
            return (
              <div key={p.id} style={{ width: '380px', backgroundColor: 'white', borderRadius: '40px', overflow: 'hidden', boxShadow: '0 15px 35px rgba(0,0,0,0.1)' }}>
                {/* Imagen y SKU */}
                <div style={{ position: 'relative', height: '300px', backgroundColor: '#f9f9f9' }}>
                  <div style={{ position: 'absolute', top: '20px', left: '20px', backgroundColor: '#d90429', color: 'white', padding: '5px 12px', borderRadius: '15px', fontWeight: 'bold', fontSize: '11px', zIndex: 2 }}>SKU: {p.sku}</div>
                  {foto && <img src={foto} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                </div>

                {/* Controles Editables (Igual a Studio IA) */}
                <div style={{ padding: '20px', borderTop: '1px solid #eee', backgroundColor: '#fff', display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '9px', color: '#999' }}>CANTIDAD</label>
                    <input type="number" value={p.cantidad} min="1" onChange={(e) => {
                      const n = [...listaProductos]; n[idx].cantidad = parseInt(e.target.value) || 1; setListaProductos(n);
                    }} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #eee' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '9px', color: '#999' }}>DESC. %</label>
                    <input type="number" value={p.descuentoManual} onChange={(e) => {
                      const n = [...listaProductos]; n[idx].descuentoManual = parseInt(e.target.value) || 0; setListaProductos(n);
                    }} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #eee' }} />
                  </div>
                </div>

                {/* Footer Negro */}
                <div style={{ backgroundColor: 'black', padding: '25px', color: 'white' }}>
                  <h2 style={{ fontSize: '15px', margin: '0 0 10px 0', textTransform: 'uppercase' }}>{p.nombre}</h2>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontSize: '12px', color: res.esPack ? '#4cc9f0' : '#d90429', fontWeight: 'bold', margin: 0 }}>
                        {res.esPack ? 'PRECIO PACK' : 'PRECIO UNITARIO'}
                      </p>
                      <p style={{ fontSize: '10px', color: '#555', margin: 0 }}>TOTAL: ${res.total.toLocaleString('es-AR')}</p>
                    </div>
                    <div style={{ color: '#d90429', fontSize: '28px', fontWeight: 'bold' }}>
                      ${res.unitario.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
