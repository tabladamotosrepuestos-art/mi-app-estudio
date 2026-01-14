import { GoogleGenerativeAI } from "@google/generative-ai";

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

    const prompt = "Analiza esta lista de repuestos. Extrae los códigos (SKU) y devuélvelos como una lista simple de códigos separados por saltos de línea. No agregues texto extra.";
    const result = await model.generateContent([prompt, imagePart]);
    return result.response.text();
  } catch (error) {
    console.error("Error IA:", error);
    throw new Error("No se pudo leer la imagen");
  }
};
