
import React from 'react';
import { ProductData, THEMES } from '../types';

interface PreviewCardProps {
  data: ProductData;
  logoUrl?: string | null;
  brandLogoUrl?: string | null;
}

const PreviewCard: React.FC<PreviewCardProps> = ({ data, logoUrl, brandLogoUrl }) => {
  const theme = THEMES[data.theme] || THEMES.dark;
  
  const normalizeForView = (val: string) => {
    let clean = val.replace(/[^0-9,.]/g, '');
    if (clean.includes('.') && clean.includes(',')) clean = clean.replace(/\./g, '').replace(',', '.');
    else if (clean.includes(',')) clean = clean.replace(',', '.');
    return parseFloat(clean) || 0;
  };

  const basePriceNum = normalizeForView(data.basePrice);
  const totalDiscountApplied = data.bulkPromo?.discountApplied || 0;
  const hasDiscount = totalDiscountApplied > 0;

  // Calculamos el precio unitario efectivo que se muestra
  const displayUnitPrice = data.bulkPromo && data.bulkPromo.quantity > 0 
    ? (parseFloat(data.bulkPromo.totalPrice) / data.bulkPromo.quantity).toFixed(2)
    : data.price;

  return (
    <div className="flex flex-col items-center justify-center">
      <div 
        className={`${theme.bg} ${theme.text} w-[380px] shadow-2xl rounded-[3rem] overflow-hidden relative border ${theme.border} flex-shrink-0 transition-all duration-500`}
      >
        {/* Imagen del Producto */}
        <div className="relative aspect-square bg-zinc-900/40 flex items-center justify-center overflow-hidden">
          {data.imageUrl ? (
            <img src={data.imageUrl} alt={data.title} className="w-full h-full object-cover" />
          ) : (
            <div className="text-zinc-800 animate-pulse"><svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg></div>
          )}
          
          {/* Badge: Código / SKU */}
          <div className={`absolute top-6 left-6 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg backdrop-blur-md ${theme.badge} bg-opacity-90 z-10`}>
            SKU: {data.code}
          </div>

          {/* Sticker de Descuento Activo */}
          {hasDiscount && (
            <div className="absolute top-6 right-6 w-16 h-16 bg-red-600 rounded-full shadow-2xl flex flex-col items-center justify-center transform -rotate-12 border-2 border-white/50 z-10 animate-in zoom-in-50 duration-500">
              <span className="text-[8px] font-black text-white leading-none uppercase">AHORRA</span>
              <span className="text-xl font-black text-white leading-tight">{totalDiscountApplied}%</span>
              <span className="text-[7px] font-black text-white/80 leading-none uppercase">OFF</span>
            </div>
          )}

          {/* Logo Corporativo (Derecha) */}
          {logoUrl && (
            <div className="absolute bottom-6 right-6 w-20 h-20 bg-white/10 backdrop-blur-xl rounded-3xl p-3 shadow-2xl border border-white/20 flex items-center justify-center z-10 transition-transform hover:scale-105">
              <img src={logoUrl} alt="Logo Empresa" className="max-w-full max-h-full object-contain" />
            </div>
          )}

          {/* Logo de Marca (Izquierda) */}
          {brandLogoUrl && (
            <div className="absolute bottom-6 left-6 w-16 h-16 bg-white/10 backdrop-blur-xl rounded-2xl p-2.5 shadow-2xl border border-white/20 flex items-center justify-center z-10 transition-transform hover:scale-105">
              <img src={brandLogoUrl} alt="Marca Producto" className="max-w-full max-h-full object-contain" />
            </div>
          )}
        </div>

        {/* Información Principal */}
        <div className="p-8">
          <div className="flex justify-between items-start mb-5 gap-4">
            <div className="flex-1 min-w-0">
               <h2 className={`text-2xl font-black leading-[1.1] tracking-tighter line-clamp-2 ${data.theme === 'luxury' ? 'font-serif' : ''}`}>{data.title}</h2>
               <p className={`text-[11px] font-medium ${theme.descriptionOpacity} line-clamp-1 mt-2 tracking-tight`}>{data.description}</p>
            </div>
            <div className="flex flex-col items-end shrink-0">
              {hasDiscount && (
                <span className="text-[11px] font-bold opacity-30 line-through mb-0.5">
                  ${basePriceNum.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                </span>
              )}
              <div className={`${theme.accent} text-3xl font-black whitespace-nowrap tracking-tighter leading-none`}>
                ${parseFloat(displayUnitPrice).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[8px] font-black uppercase opacity-40 tracking-widest mt-1">PVP UNITARIO</span>
            </div>
          </div>

          {/* Sección de Oferta por Pack (Siempre visible si qty > 1) */}
          {data.bulkPromo && data.bulkPromo.quantity > 1 && (
            <div className="bg-red-600 p-5 rounded-[2.5rem] flex flex-col gap-3 text-white shadow-xl relative mt-4 animate-in slide-in-from-bottom-2 duration-300">
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] text-red-200 mb-1">PROMO PACK</span>
                  <div className="bg-white/20 px-4 py-1.5 rounded-2xl border border-white/10 w-fit">
                    <span className="text-[12px] font-black text-white uppercase tracking-tighter">LLEVANDO {data.bulkPromo.quantity} UNIDADES</span>
                  </div>
                </div>
                {data.bulkPromo.discountApplied > (data.globalDiscount + data.skuDiscount) && (
                  <div className="bg-yellow-400 text-red-700 px-5 py-2 rounded-2xl text-[12px] font-black uppercase tracking-tighter shadow-xl transform hover:scale-110 transition-transform animate-pulse">
                    ¡MEJOR PRECIO!
                  </div>
                )}
              </div>
              
              <div className="flex justify-between items-end border-t border-white/10 pt-4">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-red-100 uppercase mb-1">VALOR TOTAL</span>
                  <div className="bg-white/90 text-red-600 px-4 py-1.5 rounded-2xl font-black text-lg shadow-inner tracking-tighter leading-none">
                    ${parseFloat(data.bulkPromo.totalPrice).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                   <span className="text-[9px] font-black text-white uppercase mb-1 tracking-tight bg-red-700/50 px-2 py-0.5 rounded-md">EL PRECIO BAJA A</span>
                   <span className="text-3xl font-black leading-none drop-shadow-lg text-yellow-300">
                     ${parseFloat(displayUnitPrice).toLocaleString('es-AR', { minimumFractionDigits: 2 })} <span className="text-sm">c/u</span>
                   </span>
                </div>
              </div>
            </div>
          )}
          
          {/* Footer Corporativo */}
          <div className={`mt-8 pt-5 border-t ${theme.border} flex justify-between items-center opacity-20`}>
            <span className="text-[7px] uppercase tracking-[0.4em] font-black">Sistema Comercial Profesional • Promo Studio</span>
            <div className="flex gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewCard;
