
import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  /**
   * Obtiene instrucciones de recolección profesional usando el modelo Gemini 3 Flash.
   */
  static async getCollectionInstructions(sampleType: string): Promise<string> {
    // Create instance inside method to ensure the most up-to-date API key is used
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Actúa como un microbiólogo experto. Proporciona exactamente 3 instrucciones breves, profesionales y numeradas para que un técnico de laboratorio recolecte una muestra de: ${sampleType}. Usa un tono médico y sé muy conciso.`,
        config: {
          thinkingConfig: { thinkingBudget: 0 }
        }
      });

      return response.text || "No se pudieron generar instrucciones automáticas. Por favor, consulte el manual de procedimientos.";
    } catch (error) {
      console.error("Gemini API Error:", error);
      return "Error de conexión con el asistente de IA.";
    }
  }

  /**
   * Verifica si el usuario ha seleccionado una clave API.
   */
  static async checkApiKey(): Promise<boolean> {
    try {
      return await (window as any).aistudio.hasSelectedApiKey();
    } catch (error) {
      console.error("Error checking API key:", error);
      return false;
    }
  }

  /**
   * Abre el diálogo de selección de clave API.
   */
  static async openKeySelector(): Promise<void> {
    try {
      await (window as any).aistudio.openSelectKey();
    } catch (error) {
      console.error("Error opening key selector:", error);
    }
  }

  /**
   * Genera un video educativo usando el modelo Veo 3.1.
   */
  static async generateLabVideo(prompt: string, aspectRatio: '16:9' | '9:16'): Promise<string> {
    // Create a new instance right before the call to use the latest API key
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    try {
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: aspectRatio
        }
      });

      // Poll for completion
      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        // Use a fresh instance for polling to be safe
        const pollAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
        operation = await pollAi.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (!downloadLink) {
        throw new Error("No video URI returned from operation.");
      }

      // Append API key when fetching from the download link
      const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
      if (!response.ok) {
        throw new Error(`Failed to download video: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error: any) {
      console.error("Video generation error:", error);
      throw error;
    }
  }
}
