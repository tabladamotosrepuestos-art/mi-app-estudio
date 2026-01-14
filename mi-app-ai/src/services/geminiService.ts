import { GoogleGenerativeAI } from "@google/generative-ai";

// Acceso compatible con Vite y Vercel para evitar errores de TS
const apiKey = (import.meta as any).env?.VITE_API_KEY || (process as any).env?.API_KEY || "";
const ai = new GoogleGenerativeAI(apiKey);

export const generateProductImage = async (prompt: string): Promise<string> => {
  try {
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text(); 
  } catch (error) {
    console.error("Error:", error);
    throw new Error("No se pudo generar la imagen.");
  }
};

/**
 * Nombre corregido para coincidir con lo que espera App.tsx
 */
export const extractProductsFromList = async (base64Image: string) => {
  try {
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
    const imagePart = {
      inlineData: { mimeType: "image/jpeg", data: base64Image.split(",")[1] }
    };
    const result = await model.generateContent([
      "Extrae los productos de esta imagen en formato JSON: {productos: [{codigo, descripcion, precio}]}",
      imagePart
    ]);
    const text = (await result.response).text();
    const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanText || "{}");
  } catch (error) {
    return { estado: "error", mensaje: "Error al procesar." };
  }
};
