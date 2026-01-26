import type { SampleRequest } from "../../types";

async function post(action: string, payload: any = {}) {
  const res = await fetch("/api/sheets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...payload }),
  });

  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "Error desconocido");
  return data;
}

export const databaseService = {
  async getSamples(): Promise<SampleRequest[]> {
    const data = await post("samples:list");
    return data.samples as SampleRequest[];
  },

  async createSample(sample: any) {
    const data = await post("samples:create", { sample });
    return data.created;
  },

  async updateSampleStatus(id: string, status: string) {
    const data = await post("samples:updateStatus", { id, status });
    return data.updated;
  },

  async saveSamples(_: SampleRequest[]): Promise<void> {},

  exportToCSV(_: SampleRequest[]) {},
};
