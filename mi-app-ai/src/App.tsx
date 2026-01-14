
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { ProductData, InventoryItem, BulkPromo, THEMES, QuantityRule } from './types';
import PreviewCard from './components/PreviewCard';
import { generateProductImage, extractProductsFromList } from './services/geminiService';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';

const App: React.FC = () => {
  const [products, setProducts] = useState<ProductData[]>(() => {
    const saved = localStorage.getItem('ps_products');
    return saved ? JSON.parse(saved) : [];
  });
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('ps_inventory');
    try {
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [quantityRules, setQuantityRules] = useState<QuantityRule[]>(() => {
    const saved = localStorage.getItem('ps_qrules');
    return saved ? JSON.parse(saved) : [
      { minQty: 3, discount: 5 },
      { minQty: 6, discount: 10 },
      { minQty: 12, discount: 15 }
    ];
  });
  const [companyLogo, setCompanyLogo] = useState<string | null>(() => {
    return localStorage.getItem('ps_logo');
  });
  const [brandLogo, setBrandLogo] = useState<string | null>(() => {
    return localStorage.getItem('ps_brand_logo');
  });

  const [photoBank, setPhotoBank] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<{msg: string, type: 'info' | 'success' | 'error'}[]>([]);
  const [globalDiscount, setGlobalDiscount] = useState<number>(0);
  const [manualCode, setManualCode] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  
  // Camera state
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const inventoryStatus = useMemo(() => {
    const count = inventory.length;
    return {
      excelCargado: count > 0,
      cantidadSKUs: count,
      inventarioActivo: count > 0,
      logoCargado: companyLogo !== null,
      marcaCargada: brandLogo !== null
    };
  }, [inventory, companyLogo, brandLogo]);

  useEffect(() => {
    localStorage.setItem('ps_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('ps_inventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('ps_qrules', JSON.stringify(quantityRules));
  }, [quantityRules]);

  useEffect(() => {
    if (companyLogo) localStorage.setItem('ps_logo', companyLogo);
    else localStorage.removeItem('ps_logo');
  }, [companyLogo]);

  useEffect(() => {
    if (brandLogo) localStorage.setItem('ps_brand_logo', brandLogo);
    else localStorage.removeItem('ps_brand_logo');
  }, [brandLogo]);

  const addLog = (msg: string, type: 'info' | 'success' | 'error' = 'info') => {
    setLogs(prev => [{ msg, type }, ...prev].slice(0, 20));
  };

  // FUNCIÓN CORREGIDA DE DESVINCULACIÓN
  const handleClearInventory = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const confirmacion = window.confirm("¿Estás seguro de que quieres desvincular el archivo Excel? Esto borrará todos los precios y códigos de la memoria.");
    
    if (confirmacion) {
      setInventory([]); // Limpia el estado de React
      localStorage.removeItem('ps_inventory'); // Borra físicamente del almacenamiento
      addLog("Inventario desvinculado con éxito", "success");
    }
  };

  const normalizeHeader = (h: string) => {
    return h.toUpperCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "_");
  };

  const findColumn = (headers: string[], targets: string[]): string | undefined => {
    const normalizedHeaders = headers.map(normalizeHeader);
    for (const target of targets) {
      const normalizedTarget = normalizeHeader(target);
      const index = normalizedHeaders.indexOf(normalizedTarget);
      if (index !== -1) return headers[index];
    }
    return undefined;
  };

  const normalizePriceNum = (val: any): number => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    let clean = String(val).trim().replace(/[^0-9,.]/g, '');
    
    if (clean.includes('.') && clean.includes(',')) {
      const lastDot = clean.lastIndexOf('.');
      const lastComma = clean.lastIndexOf(',');
      if (lastDot > lastComma) clean = clean.replace(/,/g, '');
      else clean = clean.replace(/\./g, '').replace(',', '.');
    } else if (clean.includes(',')) {
      clean = clean.replace(',', '.');
    }
    
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    addLog("Leyendo archivo...", "info");
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const dataBuffer = evt.target?.result;
        const workbook = XLSX.read(dataBuffer, { type: 'array' });
        let allMappedData: InventoryItem[] = [];

        workbook.SheetNames.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
          if (rawData.length < 2) return;

          const headers = (rawData[0] as any[]).map(h => String(h || ""));
          const rows = rawData.slice(1);

          const skuCol = findColumn(headers, ["SKU", "CODIGO", "COD", "ID", "COD_ART", "ARTICULO"]);
          const nameCol = findColumn(headers, ["NOMBRE", "DESCRIPCION", "PRODUCTO", "DETALLE"]);
          const p1 = ["PRECIO", "PRECIO_BASE", "PVP", "VALOR"];
          const priceCol = findColumn(headers, p1);

          rows.forEach((row) => {
            const rowData: any = {};
            headers.forEach((h, i) => rowData[h] = row[i]);
            const sku = skuCol ? String(rowData[skuCol] || "").trim() : "";
            const name = nameCol ? String(rowData[nameCol] || "").trim() : "";
            const rawPrice = priceCol ? rowData[priceCol] : "0";
            const price = String(normalizePriceNum(rawPrice));

            if (sku !== "" && name !== "") {
              allMappedData.push({ codigo: sku, nombre: name, precio: price, descripcion: name });
            }
          });
        });

        if (allMappedData.length > 0) {
          setInventory(allMappedData);
          addLog(`${allMappedData.length} productos vinculados`, "success");
        } else {
          addLog("No se encontraron SKUs válidos", "error");
        }
      } catch (err) { 
        addLog("Error al procesar el archivo", "error"); 
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = ''; 
  };

  const calculateFinalProductPrice = (base: string, gDiscount: number, sDiscount: number, qty: number = 1): BulkPromo => {
    const basePrice = normalizePriceNum(base);
    const applicablePackRule = [...quantityRules]
      .filter(r => qty >= r.minQty)
      .sort((a, b) => b.minQty - a.minQty)[0];

    let discountApplied = 0;
    if (applicablePackRule) {
      discountApplied = applicablePackRule.discount;
    } else {
      discountApplied = gDiscount + sDiscount;
    }

    const unitPrice = basePrice * (1 - (discountApplied / 100));
    const totalPrice = unitPrice * qty;

    return {
      quantity: qty,
      discountApplied,
      totalBruto: (basePrice * qty).toFixed(2),
      totalPrice: totalPrice.toFixed(2)
    };
  };

  const handleAddByCode = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!manualCode.trim()) return;
    
    const skus = manualCode
      .split(/[\n, ]+/)
      .map(s => s.trim().toUpperCase())
      .filter(s => s.length > 0);

    const newProductsList: ProductData[] = [];
    
    skus.forEach(sku => {
      const match = inventory.find(item => item.codigo.toUpperCase() === sku);
      const basePriceFromInv = match?.precio || '0.00';
      
      const promo = calculateFinalProductPrice(basePriceFromInv, globalDiscount, 0, 1);
      const bankImage = photoBank[sku] || null;

      newProductsList.push({
        title: match?.nombre || "Producto Manual",
        code: sku,
        basePrice: basePriceFromInv,
        price: promo.totalPrice,
        globalDiscount,
        skuDiscount: 0,
        currency: '$',
        theme: 'dark',
        imageUrl: bankImage,
        description: match?.descripcion || `Ficha de producto SKU ${sku}`,
        aiConfig: { aspectRatio: "1:1", stylePreset: 'studio' },
        bulkPromo: promo
      });
      
      if (match) addLog(`SKU ${sku} vinculado`, "success");
      else addLog(`SKU ${sku} no está en el Excel`, "error");
    });
    
    setProducts(prev => [...prev, ...newProductsList]);
    setManualCode("");
  };

  const updateProduct = (index: number, updates: Partial<ProductData>) => {
    setProducts(prev => prev.map((p, i) => {
      if (i === index) {
        const newObj = { ...p, ...updates };
        const currentQty = newObj.bulkPromo?.quantity || 1;
        const newPromo = calculateFinalProductPrice(newObj.basePrice, newObj.globalDiscount, newObj.skuDiscount, currentQty);
        return {
          ...newObj,
          price: (parseFloat(newPromo.totalPrice) / currentQty).toFixed(2),
          bulkPromo: newPromo
        };
      }
      return p;
    }));
  };

  const handlePhotoBankUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newPhotos = { ...photoBank };
    let count = 0;
    (Array.from(files) as File[]).forEach(file => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const base64 = evt.target?.result as string;
        const skuKey = file.name.split('.').slice(0, -1).join('.').toUpperCase();
        newPhotos[skuKey] = base64;
        count++;
        if (count === files.length) {
          setPhotoBank(newPhotos);
          addLog(`${files.length} fotos cargadas`, "success");
          setProducts(prev => prev.map(p => (!p.imageUrl && newPhotos[p.code.toUpperCase()]) ? { ...p, imageUrl: newPhotos[p.code.toUpperCase()] } : p));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const applyGlobalDiscount = (pct: number) => {
    setGlobalDiscount(pct);
    setProducts(prev => prev.map(p => {
      const currentQty = p.bulkPromo?.quantity || 1;
      const newPromo = calculateFinalProductPrice(p.basePrice, pct, p.skuDiscount, currentQty);
      return {
        ...p,
        globalDiscount: pct,
        price: (parseFloat(newPromo.totalPrice) / currentQty).toFixed(2),
        bulkPromo: newPromo
      };
    }));
  };

  const downloadAllPngs = async () => {
    if (products.length === 0) return;
    addLog("Generando descargas...", "info");
    for (let i = 0; i < products.length; i++) {
      const el = cardRefs.current[`card-${i}`];
      if (el) {
        const canvas = await (window as any).html2canvas(el, { scale: 3, backgroundColor: null });
        const link = document.createElement('a');
        link.download = `ficha-${products[i].code}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        await new Promise(r => setTimeout(r, 300));
      }
    }
  };

  const startCamera = async () => {
    setIsCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (err) {
      addLog("Cámara no disponible", "error");
      setIsCameraOpen(false);
    }
  };

  const closeCamera = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    setIsCameraOpen(false);
  };

  const captureAndProcess = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const context = canvasRef.current.getContext('2d');
    if (!context) return;
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
    const base64Image = canvasRef.current.toDataURL('image/jpeg');
    closeCamera();
    setIsProcessing(true);
    try {
      const res = await extractProductsFromImage(base64Image);
      if (res.estado === 'ok') {
        const newProds = res.productos_detectados.map((item: any) => {
          const match = inventory.find(inv => inv.codigo.toUpperCase() === item.codigo.toUpperCase());
          const base = match?.precio || item.precio || '0.00';
          const promo = calculateFinalProductPrice(base, globalDiscount, 0, 1);
          return {
            title: match?.nombre || item.descripcion || "Producto Cámara",
            code: item.codigo,
            basePrice: base,
            price: promo.totalPrice,
            globalDiscount,
            skuDiscount: 0,
            currency: '$',
            theme: 'dark',
            imageUrl: photoBank[item.codigo.toUpperCase()] || null,
            description: match?.descripcion || item.descripcion || "",
            aiConfig: { aspectRatio: "1:1", stylePreset: 'studio' },
            bulkPromo: promo
          } as ProductData;
        });
        setProducts(prev => [...prev, ...newProds]);
        addLog(`${newProds.length} productos detectados`, "success");
      }
    } catch (error) {
      addLog("Error en escaneo", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg rotate-2">CS</div>
          <div>
            <h1 className="text-lg font-black tracking-tighter uppercase text-slate-800">Sistema Comercial <span className="text-red-600 font-light">PRO</span></h1>
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Generador de Fichas Técnicas</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={startCamera} className="p-2.5 text-slate-500 hover:text-red-600 bg-slate-100 rounded-xl border border-slate-200 transition-all flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
            <span className="text-[10px] font-black uppercase hidden sm:inline">Escaneo IA</span>
          </button>
          {products.length > 0 && (
            <button onClick={downloadAllPngs} className="px-5 py-2.5 bg-red-600 text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-red-700 transition-all">
              Exportar ({products.length})
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="hidden lg:flex w-[350px] bg-white border-r border-slate-200 flex-col shrink-0 overflow-y-auto custom-scrollbar shadow-inner p-6 space-y-6">
          <section className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Inventario Base</h3>
            
            <div className="flex flex-col gap-3">
              {/* ÁREA DE CARGA DE EXCEL */}
              <div className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-[2rem] transition-all ${inventoryStatus.excelCargado ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'}`}>
                <div className="flex flex-col items-center gap-2 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>
                  <span className="text-[10px] font-black uppercase tracking-widest">{inventoryStatus.excelCargado ? 'Excel Vinculado' : 'Vincular Excel'}</span>
                  <span className="text-[8px] font-bold opacity-60 uppercase">{inventoryStatus.excelCargado ? `${inventoryStatus.cantidadSKUs} SKUs en Memoria` : 'Seleccionar Archivo'}</span>
                </div>
                <input 
                  type="file" 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  accept=".xlsx,.xls" 
                  onChange={handleExcelUpload} 
                />
              </div>

              {/* BOTÓN DESVINCULAR EXCEL (TOTALMENTE INDEPENDIENTE) */}
              {inventoryStatus.excelCargado && (
                <button 
                  type="button"
                  onClick={handleClearInventory}
                  className="w-full py-4 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white rounded-2xl border border-red-100 hover:border-red-600 transition-all duration-300 flex items-center justify-center gap-3 group shadow-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                  <span className="text-[11px] font-black uppercase tracking-widest">Desvincular Excel</span>
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="relative group">
                <label className={`flex flex-col items-center justify-center p-3 border border-slate-100 rounded-xl bg-slate-50 cursor-pointer text-slate-500 hover:bg-slate-100 transition h-full ${inventoryStatus.logoCargado ? 'ring-2 ring-red-500 ring-offset-1' : ''}`}>
                  <span className="text-[8px] font-black uppercase mb-1">Empresa</span>
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      const r = new FileReader();
                      r.onload = (ev) => setCompanyLogo(ev.target?.result as string);
                      r.readAsDataURL(f);
                    }
                  }} />
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                </label>
                {inventoryStatus.logoCargado && (
                  <button type="button" onClick={(e) => { e.preventDefault(); setCompanyLogo(null); }} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-sm hover:bg-red-600 transition-colors z-10"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
                )}
              </div>

              <div className="relative group">
                <label className={`flex flex-col items-center justify-center p-3 border border-slate-100 rounded-xl bg-slate-50 cursor-pointer text-slate-500 hover:bg-slate-100 transition h-full ${inventoryStatus.marcaCargada ? 'ring-2 ring-red-500 ring-offset-1' : ''}`}>
                  <span className="text-[8px] font-black uppercase mb-1">Marca</span>
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      const r = new FileReader();
                      r.onload = (ev) => setBrandLogo(ev.target?.result as string);
                      r.readAsDataURL(f);
                    }
                  }} />
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </label>
                {inventoryStatus.marcaCargada && (
                  <button type="button" onClick={(e) => { e.preventDefault(); setBrandLogo(null); }} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-sm hover:bg-red-600 transition-colors z-10"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
                )}
              </div>
            </div>
            <label className="flex flex-col items-center justify-center p-3 border border-slate-100 rounded-xl bg-slate-50 cursor-pointer text-slate-500 hover:bg-slate-100 transition w-full">
              <span className="text-[8px] font-black uppercase mb-1">Banco Fotos SKUs</span>
              <input type="file" className="hidden" accept="image/*" multiple onChange={handlePhotoBankUpload} />
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/></svg>
            </label>
          </section>

          <section className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reglas de Pack</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
              {quantityRules.sort((a,b) => a.minQty - b.minQty).map((rule, idx) => (
                <div key={idx} className="flex gap-2 items-center bg-slate-50 p-2 rounded-xl border border-slate-100 group">
                  <input type="number" value={rule.minQty} onChange={(e) => {
                    const newRules = [...quantityRules];
                    newRules[idx].minQty = parseInt(e.target.value) || 0;
                    setQuantityRules(newRules);
                  }} className="w-12 bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-bold outline-none" />
                  <span className="text-[8px] font-black text-slate-400">UN. &rarr;</span>
                  <input type="number" value={rule.discount} onChange={(e) => {
                    const newRules = [...quantityRules];
                    newRules[idx].discount = parseInt(e.target.value) || 0;
                    setQuantityRules(newRules);
                  }} className="flex-1 bg-white border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-bold text-red-600 outline-none" />
                  <span className="text-[8px] font-black text-slate-400">%</span>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-red-50 p-5 rounded-2xl border border-red-100">
            <h3 className="text-[10px] font-black text-red-600 uppercase mb-3 tracking-widest">Oferta Global</h3>
            <div className="flex gap-1">
              {[0, 10, 20, 30].map(pct => (
                <button key={pct} onClick={() => applyGlobalDiscount(pct)} className={`flex-1 py-1.5 rounded-lg text-[10px] font-black transition ${globalDiscount === pct ? 'bg-red-600 text-white' : 'bg-white text-red-600 border border-red-100'}`}>{pct}%</button>
              ))}
            </div>
          </section>

          <div className="bg-slate-900 rounded-2xl p-4 h-32 overflow-y-auto custom-scrollbar font-mono text-[9px] text-slate-400 border border-slate-800 shadow-inner">
            <div className="border-b border-slate-800 pb-2 mb-2 font-black uppercase text-slate-500 flex justify-between">
              <span>Status Sistema</span>
              <div className={`w-2 h-2 rounded-full ${inventoryStatus.excelCargado ? 'bg-green-500' : 'bg-red-500'}`}></div>
            </div>
            {logs.map((l, i) => <div key={i} className={`mb-1 ${l.type === 'error' ? 'text-red-400' : l.type === 'success' ? 'text-green-400' : ''}`}>{`> ${l.msg}`}</div>)}
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-8 sm:p-12 relative">
          {isCameraOpen && (
            <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center p-4">
              <div className="relative w-full max-w-2xl aspect-[4/3] bg-zinc-900 rounded-[2rem] overflow-hidden shadow-2xl border-4 border-zinc-800">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <button type="button" onClick={closeCamera} className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
              </div>
              <div className="mt-8 flex gap-6">
                 <button type="button" onClick={captureAndProcess} className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-transform">
                   <div className="w-16 h-16 rounded-full border-4 border-zinc-900 flex items-center justify-center">
                     <div className="w-12 h-12 bg-red-600 rounded-full" />
                   </div>
                 </button>
              </div>
              <p className="mt-4 text-white/60 text-[10px] font-black uppercase tracking-widest">Encuadre el listado para escanear SKUs</p>
              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}

          {products.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 px-6">
               <div className="w-32 h-32 bg-white rounded-[2.5rem] shadow-xl flex items-center justify-center border border-slate-100 mb-10"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg></div>
               <div className="max-w-md text-center space-y-6">
                  <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Catálogo Profesional</h2>
                  <form onSubmit={handleAddByCode} className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-red-50 relative">
                    <div className="absolute -top-3 -left-3 bg-red-600 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Carga Manual de SKUs</div>
                    <textarea 
                      placeholder="Pega aquí uno o varios SKUs..." 
                      value={manualCode} 
                      onChange={(e) => setManualCode(e.target.value)} 
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-5 text-sm font-bold outline-none focus:ring-2 focus:ring-red-500 mb-4 text-slate-800 min-h-[120px] resize-none"
                    />
                    <button type="submit" className="w-full py-5 bg-red-600 text-white rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-red-700 transition-all">Generar Fichas</button>
                  </form>
               </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-12 pb-40">
              {products.map((product, index) => (
                <div key={index} className="flex flex-col gap-6 animate-in slide-in-from-bottom-8 duration-500">
                  <div className="bg-white p-7 rounded-[3rem] border border-slate-200 shadow-xl space-y-5 relative group/card">
                    <div className="flex justify-between items-center">
                       <span className={`text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest ${inventory.some(inv => inv.codigo.toUpperCase() === product.code.toUpperCase()) ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'}`}>
                         {inventory.some(inv => inv.codigo.toUpperCase() === product.code.toUpperCase()) ? 'En Inventario' : 'Fuera de Excel'}
                       </span>
                       <button type="button" onClick={() => setProducts(p => p.filter((_, i) => i !== index))} className="text-slate-200 hover:text-red-500 p-2"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
                    </div>

                    <div className="space-y-4">
                      <div><label className="text-[9px] font-black text-slate-400 uppercase block mb-1 tracking-widest">Descripción</label><input type="text" value={product.title} onChange={(e) => updateProduct(index, { title: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold outline-none" /></div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className="text-[9px] font-black text-slate-400 uppercase block mb-1 tracking-widest">Precio Base</label><input type="text" value={product.basePrice} onChange={(e) => updateProduct(index, { basePrice: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-xs font-bold" /></div>
                        <div><label className="text-[9px] font-black text-slate-400 uppercase block mb-1 tracking-widest">Dcto (%)</label><input type="number" value={product.skuDiscount} onChange={(e) => updateProduct(index, { skuDiscount: parseFloat(e.target.value) || 0 })} className="w-full bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-xs font-bold text-red-600 outline-none" /></div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 space-y-4">
                       <div className="flex justify-between items-center"><label className="text-[10px] font-black text-red-600 uppercase tracking-tighter">Pack Comercial</label>
                        <div className="flex gap-1">
                          {[1, 3, 6, 12].map(q => (
                            <button key={q} type="button" onClick={() => updateProduct(index, { bulkPromo: calculateFinalProductPrice(product.basePrice, globalDiscount, product.skuDiscount, q) })} className={`px-2.5 py-1 rounded-lg text-[10px] font-black ${product.bulkPromo?.quantity === q ? 'bg-red-600 text-white' : 'bg-red-50 text-red-600'}`}>x{q}</button>
                          ))}
                        </div>
                       </div>
                       <div className="flex gap-3 items-center">
                          <input type="number" className="w-14 bg-slate-50 border border-slate-100 rounded-xl px-2 py-3 text-xs font-bold text-center" value={product.bulkPromo?.quantity || 1} onChange={(e) => updateProduct(index, { bulkPromo: calculateFinalProductPrice(product.basePrice, globalDiscount, product.skuDiscount, parseInt(e.target.value) || 1) })} />
                          <div className="flex-1 bg-slate-900 rounded-2xl px-5 py-3 flex justify-between items-center shadow-lg"><span className="text-[8px] font-black text-slate-500 uppercase">Total:</span><span className="text-sm font-black text-white">${parseFloat(product.bulkPromo?.totalPrice || '0').toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span></div>
                       </div>
                    </div>

                    <button type="button" onClick={async () => {
                         const el = cardRefs.current[`card-${index}`];
                         if (el) {
                           const canvas = await (window as any).html2canvas(el, { scale: 3, backgroundColor: null });
                           const link = document.createElement('a');
                           link.download = `ficha-${product.code}.png`;
                           link.href = canvas.toDataURL('image/png');
                           link.click();
                         }
                    }} className="w-full py-4 bg-red-600 text-white rounded-[2rem] text-[11px] font-black uppercase shadow-xl hover:bg-red-700 transition-all">Descargar Ficha</button>
                  </div>
                  <div ref={el => { if (el) cardRefs.current[`card-${index}`] = el; }} className="mx-auto rounded-[3.5rem] overflow-hidden shadow-2xl transition-all duration-500 border border-slate-200/50"><PreviewCard data={product} logoUrl={companyLogo} brandLogoUrl={brandLogo} /></div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
