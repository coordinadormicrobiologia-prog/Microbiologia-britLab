import type { SampleRequest } from "../../types";

const SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL as string;
const API_KEY = import.meta.env.VITE_API_KEY as string;

async function post(action: string, payload: any = {}) {
  if (!SCRIPT_URL) throw new Error("Falta VITE_GOOGLE_SCRIPT_URL");
  if (!API_KEY) throw new Error("Falta VITE_API_KEY");

  // Enviar como application/x-www-form-urlencoded para evitar preflight (CORS)
  const params = new URLSearchParams();
  params.append("action", action);
  params.append("api_key", API_KEY);

  Object.entries(payload).forEach(([k, v]) => {
    if (typeof v === "object") {
      params.append(k, JSON.stringify(v));
    } else {
      params.append(k, String(v));
    }
  });

  const res = await fetch(SCRIPT_URL, {
    method: "POST",
    body: params // no seteamos headers => navegador usa application/x-www-form-urlencoded (no preflight)
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

  // Compatibilidad (no usada)
  async saveSamples(_samples: SampleRequest[]): Promise<void> {
    return;
  },

  exportToCSV(_samples: SampleRequest[]) {
    // pendiente
  },
};
