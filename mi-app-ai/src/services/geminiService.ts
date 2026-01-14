import { GoogleGenerativeAI } from "@google/generative-ai";

// Acceso seguro a la API KEY
const apiKey = (import.meta as any).env?.VITE_API_KEY || "";
const ai = new GoogleGenerativeAI(apiKey);

export const extractProductsFromList = async (base64Image: string) => {
  try {
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
    const imagePart = {
      inlineData: {
        data: base64Image.split(',')[1],
        mimeType: "image/jpeg"
      }
    };

    const prompt = "Analiza esta imagen y devuelve un JSON con: { 'productos': [ { 'codigo': '...', 'descripcion': '...' } ] }";
    const result = await model.generateContent([prompt, imagePart]);
    return JSON.parse(result.response.text());
  } catch (error) {
    throw new Error("Fallo en el escaneo IA");
  }
};
