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

/**
 * Normaliza un registro desde Sheets (encabezados en español, a veces con espacios)
 * hacia la forma que espera la app (TimeLog).
 */
function normalizeSheetsRow(row: any) {
  // Normalizar claves: crear un mapa con keys sin espacios ni case-sensitivity
  const normalized: Record<string, any> = {};
  Object.keys(row || {}).forEach(k => {
    const kk = String(k).trim(); // quita espacios en los nombres de columna
    normalized[kk.toLowerCase()] = row[k];
  });

  const get = (k: string) => normalized[k.toLowerCase()];

  // helper para extraer hora mm:hh de un valor tipo ISO o string
  const extractTime = (val: any) => {
    if (!val) return '';
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return String(val).trim();
      // Formatear "HH:MM" en 2 dígitos
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      return `${hh}:${mm}`;
    } catch {
      return String(val).trim();
    }
  };

  const id = get('id') ?? get('ID') ?? get('Id') ?? '';
  const date = get('fecha') ?? get('date') ?? '';
  const employeeName = get('nombre') ?? get('name') ?? '';
  const entryTime = extractTime(get('ingreso') ?? get(' ingreso') ?? get('in') ?? '');
  const exitTime = extractTime(get('egreso') ?? get('egress') ?? get('egreso') ?? '');
  const totalHoursRaw = get('total_horas') ?? get(' total_horas') ?? get('total_horas') ?? get('total_horas');
  const totalHours = totalHoursRaw === undefined || totalHoursRaw === '' ? 0 : Number(totalHoursRaw);
  const dayType = get('tipo_dia') ?? get('tipo') ?? get('daytype') ?? '';
  const isHoliday = (get('feriado') === true) || String(get('feriado')).toLowerCase() === 'true' || false;
  const observation = get('observaciones') ?? get('observación') ?? '';
  const timestamp = get('fecha_carga') ?? get('fecha_carga') ?? '';

  return {
    id: String(id),
    date: String(date),
    employeeName: String(employeeName),
    entryTime: String(entryTime),
    exitTime: String(exitTime),
    totalHours: Number(totalHours) || 0,
    dayType: String(dayType),
    isHoliday: Boolean(isHoliday),
    observation: String(observation),
    timestamp: String(timestamp),
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
        // Normalizar cada fila a la forma que espera la app
        const mapped = raw.map(normalizeSheetsRow);
        return mapped;
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
