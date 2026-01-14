
import { GoogleGenAI } from "@google/generative-ai";
import { ImageGenerationConfig } from "../types";

const ai = new GoogleGenerativeAI(process.env.API_KEY);
/**
 * Genera una imagen publicitaria para un producto
 */
export const generateProductImage = async (prompt: string, aiConfig?: ImageGenerationConfig): Promise<string> => {
  try {
    const styleInstructions: Record<string, string> = {
      studio: "Professional studio product photography, clean solid background, soft commercial lighting.",
      cinematic: "Cinematic lighting, high contrast, dramatic shadows, professional movie-like product shot.",
      minimalist: "Minimalist aesthetic, simple clean lines, neutral colors, modern and airy composition.",
      vibrant: "Vibrant and punchy colors, high saturation, energetic and bright lighting.",
      vintage: "Vintage retro style, soft film grain, nostalgic color palette, classic advertising look.",
      industrial: "Industrial gritty style, metallic textures, hard lighting, workshop environment background."
    };

    const style = aiConfig?.stylePreset || 'studio';
    const negativeInstructions = aiConfig?.negativePrompt ? ` Avoid: ${aiConfig.negativePrompt}.` : "";
    const fullPrompt = `${styleInstructions[style]} Subject: ${prompt}.${negativeInstructions} High quality, sharp focus, professional resolution.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: fullPrompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: aiConfig?.aspectRatio || "1:1",
        },
      },
    });

    let imageUrl = '';
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!imageUrl) throw new Error("No image generated");
    return imageUrl;
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
};

/**
 * SISTEMA AUTOMÁTICO EMPRESARIAL DE LECTURA DE IMÁGENES CON LISTADOS DE PRODUCTOS.
 * Extrae SKUs, descripciones y precios desde tablas, listados o grillas.
 */
export const extractProductsFromImage = async (base64Image: string): Promise<any> => {
  try {
    const systemInstruction = `Actuá como un SISTEMA AUTOMÁTICO EMPRESARIAL DE LECTURA DE IMÁGENES CON LISTADOS DE PRODUCTOS.
Tu función es leer imágenes que contienen tablas, listados o grillas de productos y extraer todos los códigos válidos para generar una tarjeta promocional por cada código detectado.

⚠️ Regla crítica:
- NUNCA inventes códigos.
- NUNCA omitas filas legibles.
- NUNCA mezcles columnas.
- MANTÉN los ceros a la izquierda en los códigos (ej. "00015").

REGLAS DE LECTURA:
- Cada fila visible = un producto.
- Leer de arriba hacia abajo.
- Un código válido es numérico o alfanumérico (ej: 03896, ART-99).
- Detectar precios con formato monetario (ej: $ 6.686,19).

FORMATO DE SALIDA (OBLIGATORIO – JSON):
{
  "estado": "ok | error",
  "productos_detectados": [
    {
      "codigo": "string",
      "descripcion": "string",
      "precio": "string | null"
    }
  ],
  "total_productos": number,
  "mensaje": "string"
}`;

    const imagePart = {
      inlineData: {
        mimeType: "image/jpeg",
        data: base64Image.split(",")[1],
      },
    };

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts: [imagePart, { text: "Lee este listado y extrae todos los productos detectados." }] },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const result = JSON.parse(response.text || "{}");
    return result;
  } catch (error) {
    console.error("Error extrayendo productos del listado:", error);
    return { estado: "error", mensaje: "Error de conexión con la IA de lectura empresarial" };
  }
};

// Mantenemos esta para compatibilidad o escaneos rápidos de un solo producto
export const extractSkuFromImage = async (base64Image: string): Promise<any> => {
  return extractProductsFromImage(base64Image);
};
