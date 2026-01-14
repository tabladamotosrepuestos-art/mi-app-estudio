import { GoogleGenerativeAI } from "@google/generative-ai";

// Acceso compatible solo con Vite para evitar errores de compilación TS
const apiKey = (import.meta as any).env?.VITE_API_KEY || "";
const ai = new GoogleGenerativeAI(apiKey);

export const extractProductsFromList = async (base64Image: string) => {
  try {
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Convertir la imagen base64 para Gemini
    const imagePart = {
      inlineData: {
        data: base64Image.split(',')[1],
        mimeType: "image/jpeg"
      }
    };

    const prompt = "Actúa como un experto en repuestos de motos. Analiza esta imagen y devuelve una lista JSON con los códigos de producto (SKU) y una descripción breve. Formato: { 'productos': [ { 'codigo': '...', 'descripcion': '...' } ] }";
    
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    return JSON.parse(response.text());
  } catch (error) {
    console.error("Error en escaneo IA:", error);
    throw new Error("No se pudo procesar la imagen.");
  }
};
