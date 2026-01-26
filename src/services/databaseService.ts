import type { SampleRequest } from "../../types";


const SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL as string;
const API_KEY = import.meta.env.VITE_API_KEY as string;


async function post(action: string, payload: any = {}) {
  if (!SCRIPT_URL) throw new Error("Falta VITE_GOOGLE_SCRIPT_URL");
  if (!API_KEY) throw new Error("Falta VITE_API_KEY");

  const res = await fetch(SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, api_key: API_KEY, ...payload }),
  });

  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "Error desconocido");
  return data;
}

export const databaseService = {
  // Lee desde Sheets
  async getSamples(): Promise<SampleRequest[]> {
    const data = await post("samples:list");
    return data.samples as SampleRequest[];
  },

  // Crea una fila en Sheets
  async createSample(sample: any) {
    const data = await post("samples:create", { sample });
    return data.created;
  },

  // Actualiza status (por id) en Sheets
  async updateSampleStatus(id: string, status: string) {
    const data = await post("samples:updateStatus", { id, status });
    return data.updated;
  },

  // ✅ mantenemos estas 2 para que no rompa imports viejos
  async saveSamples(_samples: SampleRequest[]): Promise<void> {
    // Ya no se usa en modo Sheets. Lo dejamos vacío para compatibilidad.
    return;
  },

  exportToCSV(_samples: SampleRequest[]) {
    // si lo usabas, lo implementamos después. Por ahora no afecta Sheets.
  },
};
