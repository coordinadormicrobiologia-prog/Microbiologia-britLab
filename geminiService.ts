
import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  /**
   * Genera instrucciones de recolección para el técnico usando Gemini 3 Flash.
   */
  static async getCollectionInstructions(sampleType: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Proporciona 3 instrucciones breves y profesionales en español para que un técnico de laboratorio recolecte correctamente una muestra de: ${sampleType}. Sé conciso y usa un tono médico.`,
        config: {
          thinkingConfig: { thinkingBudget: 0 }
        }
      });
      return response.text || "No se pudieron generar instrucciones.";
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      return "Error al generar instrucciones de recolección.";
    }
  }

  // Fix: Check if the user has selected an API key via the AI Studio platform helper
  static async checkApiKey(): Promise<boolean> {
    return await (window as any).aistudio.hasSelectedApiKey();
  }

  // Fix: Open the dialog for API key selection
  static async openKeySelector(): Promise<void> {
    await (window as any).aistudio.openSelectKey();
  }

  /**
   * Fix: Generates a video using veo-3.1-fast-generate-preview.
   * Handles polling of the operation and returns the download URI with the API key appended.
   */
  static async generateLabVideo(prompt: string, aspectRatio: '16:9' | '9:16'): Promise<string> {
    // Create a new instance right before the call to ensure latest API key
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: aspectRatio
      }
    });

    // Polling for the video generation to complete
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      // Re-instantiate to avoid any stale API key issues during long operations
      const aiPoll = new GoogleGenAI({ apiKey: process.env.API_KEY });
      operation = await aiPoll.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
      throw new Error("No video URI returned from the operation.");
    }

    // Must append the API key when returning the download link for direct browser access
    return `${downloadLink}&key=${process.env.API_KEY}`;
  }
}
