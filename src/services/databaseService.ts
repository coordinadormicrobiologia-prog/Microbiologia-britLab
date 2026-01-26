// src/services/databaseService.ts

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
  async getSamples() {
    const data = await post("samples:list");
    return data.samples; // array
  },

  async createSample(sample: any) {
    const data = await post("samples:create", { sample });
    return data.created;
  },

  async updateSampleStatus(id: string, status: string) {
    const data = await post("samples:updateStatus", { id, status });
    return data.updated;
  },
};
