// services/storageService.ts
import { PROXY_PATH, GOOGLE_SCRIPT_URL } from '../constants';

const PROXY = PROXY_PATH || '/api/proxy';

async function timeoutFetch(url: string, options: RequestInit = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timeoutId);
  }
}

function normalizeSheetsRow(row: any) {
  const normalized: Record<string, any> = {};
  Object.keys(row || {}).forEach(k => {
    const kk = String(k).trim().toLowerCase();
    normalized[kk] = row[k];
  });

  const extractTime = (val: any) => {
    if (!val) return '';
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      return `${hh}:${mm}`;
    }
    return String(val).trim();
  };

  return {
    id: String(normalized['id'] ?? ''),
    date: String(normalized['fecha'] ?? ''),
    employeeName: String(normalized['nombre'] ?? '').trim(),
    entryTime: extractTime(normalized['ingreso'] ?? normalized[' ingreso']),
    exitTime: extractTime(normalized['egreso'] ?? normalized['egress']),
    totalHours: Number(normalized['total_horas'] ?? normalized[' total_horas'] ?? 0) || 0,
    dayType: String(normalized['tipo_dia'] ?? normalized['tipodia'] ?? ''),
    isHoliday: (String(normalized['feriado'] ?? '').toLowerCase() === 'true'),
    observation: String(normalized['observaciones'] ?? normalized['observación'] ?? ''),
    timestamp: String(normalized['fecha_carga'] ?? ''),
  };
}

export const storageService = {
  isConfigured(): boolean {
    return Boolean(PROXY || GOOGLE_SCRIPT_URL);
  },

  async getAllLogs(): Promise<any[]> {
    try {
      const url = `${PROXY}?action=getEntries`;
      const res = await timeoutFetch(url, { method: 'GET' });
      const text = await res.text();
      console.debug('getAllLogs response text:', text);
      try {
        const parsed = JSON.parse(text);
        const raw = parsed.data ?? parsed;
        if (!Array.isArray(raw)) return [];
        return raw.map(normalizeSheetsRow);
      } catch (err) {
        console.error('getAllLogs JSON parse error', err);
        return [];
      }
    } catch (err) {
      console.error('getAllLogs error', err);
      return [];
    }
  },

  async saveLog(entry: any): Promise<{ ok: boolean; saved?: any; raw?: any }> {
    try {
      const res = await timeoutFetch(PROXY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'saveEntry', entry }),
      });
      const text = await res.text();
      console.debug('saveLog response text:', text);
      try {
        const parsed = JSON.parse(text);
        return { ok: Boolean(parsed && (parsed.ok === true || parsed.ok)), saved: parsed.saved ?? parsed.entry, raw: parsed };
      } catch {
        return { ok: res.ok, raw: text };
      }
    } catch (err) {
      console.error('saveLog error', err);
      return { ok: false };
    }
  },

  async deleteLog(id: string, requesterName?: string): Promise<boolean> {
    try {
      const res = await timeoutFetch(PROXY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deleteEntry', id, requesterName }),
      });
      const text = await res.text();
      console.debug('deleteLog response text:', text);
      try {
        const parsed = JSON.parse(text);
        return Boolean(parsed && (parsed.ok === true || parsed.ok));
      } catch {
        return res.ok;
      }
    } catch (err) {
      console.error('deleteLog error', err);
      return false;
    }
  }
};

export default storageService;
