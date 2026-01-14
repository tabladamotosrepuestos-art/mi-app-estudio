
export interface QuantityRule {
  minQty: number;
  discount: number;
}

export interface BulkPromo {
  quantity: number;
  discountApplied: number;
  totalBruto: string;
  totalPrice: string; // Este es el TOTAL_FINAL
}

export interface ImageGenerationConfig {
  aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
  stylePreset: 'studio' | 'cinematic' | 'minimalist' | 'vibrant' | 'vintage' | 'industrial';
  negativePrompt?: string;
}

export interface ProductData {
  title: string;
  code: string;
  description: string;
  basePrice: string; // Precio original del Excel
  price: string;     // Precio final unitario calculado
  globalDiscount: number; // % descuento global
  skuDiscount: number;    // % descuento específico de este SKU
  costPrice?: string;
  margin?: string; 
  currency: string;
  theme: 'dark' | 'modern' | 'minimal' | 'luxury' | 'bold';
  imageUrl: string | null;
  bulkPromo?: BulkPromo;
  aiConfig?: ImageGenerationConfig;
}

export interface InventoryItem {
  codigo: string;
  nombre: string;
  precio: string;
  costo?: string;
  rentabilidad?: string;
  descripcion?: string;
}

export type ThemeConfig = {
  bg: string;
  text: string;
  accent: string;
  badge: string;
  font: string;
  descriptionOpacity: string;
  border: string;
};

export const THEMES: Record<string, ThemeConfig> = {
  dark: {
    bg: 'bg-zinc-950',
    text: 'text-zinc-50',
    accent: 'text-red-500',
    badge: 'bg-red-600 text-white',
    font: 'font-sans',
    descriptionOpacity: 'text-zinc-400',
    border: 'border-white/10'
  },
  modern: {
    bg: 'bg-white',
    text: 'text-slate-900',
    accent: 'text-red-600',
    badge: 'bg-red-600 text-white',
    font: 'font-sans',
    descriptionOpacity: 'text-slate-500',
    border: 'border-slate-200'
  },
  minimal: {
    bg: 'bg-slate-50',
    text: 'text-slate-800',
    accent: 'text-slate-500',
    badge: 'bg-slate-800 text-white',
    font: 'font-light',
    descriptionOpacity: 'text-slate-400',
    border: 'border-slate-100'
  },
  luxury: {
    bg: 'bg-stone-900',
    text: 'text-stone-100',
    accent: 'text-amber-500',
    badge: 'bg-amber-600 text-white',
    font: 'font-serif',
    descriptionOpacity: 'text-stone-400',
    border: 'border-white/5'
  },
  bold: {
    bg: 'bg-red-700',
    text: 'text-white',
    accent: 'text-yellow-400',
    badge: 'bg-yellow-400 text-red-900',
    font: 'font-black',
    descriptionOpacity: 'text-red-100',
    border: 'border-red-600'
  }
};
