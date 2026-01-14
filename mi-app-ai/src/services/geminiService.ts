import { GoogleGenerativeAI } from "@google/generative-ai";
import { ImageGenerationConfig } from "../types";

// Inicialización corregida
const ai = new GoogleGenerativeAI(process.env.API_KEY || "");

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
    const fullPrompt = `${styleInstructions[style]} Subject: ${prompt}.${negativeInstructions} High quality, sharp focus, 8k resolution.`;

    // Nota: El modelo de generación de imágenes depende de la disponibilidad de tu API Key
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return response.text(); 
  } catch (error) {
    console.error("Error generando imagen:", error);
    throw new Error("No se pudo generar la imagen publicitaria.");
  }
};

/**
 * Extrae productos de una imagen de listado (OCR + IA)
 */
export const extractProductsFromList = async (base64Image: string) => {
  try {
    const systemInstruction = `ERES UN EXPERTO EN EXTRACCIÓN DE DATOS DE LISTADOS DE REPUESTOS.
TU TAREA ES LEER LA IMAGEN Y DEVOLVER UN JSON PURO CON LOS PRODUCTOS.

REGLAS DE EXTRACCIÓN:
- Identifica columnas de CÓDIGO, DESCRIPCIÓN y PRECIO.
- Ignora encabezados y filas ilegibles.
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

    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

    const imagePart = {
      inlineData: {
        mimeType: "image/jpeg",
        data: base64Image.split(",")[1],
      },
    };

    const result = await model.generateContent([
      systemInstruction,
      { text: "Lee este listado y extrae todos los productos detectados en formato JSON." },
      imagePart
    ]);

    const response = await result.response;
    const text = response.text();
    
    // Limpiar el texto en caso de que traiga marcas de markdown ```json
    const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanText || "{}");
  } catch (error) {
    console.error("Error extrayendo productos del listado:", error);
    return { estado: "error", mensaje: "No se pudo procesar la imagen." };
  }
};
