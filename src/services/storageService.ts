// services/storageService.ts
import { PROXY_PATH, GOOGLE_SCRIPT_URL } from '../constants';

const PROXY = PROXY_PATH || '/api/proxy';

async function timeoutFetch(url: string, options: RequestInit = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
  try {
    const fetchOptions = { cache: 'no-store', ...options, signal: controller.signal };
    const res = await fetch(url, fetchOptions);
    return res;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Normaliza una fila desde Sheets (claves en español / con espacios) hacia la forma que espera la app
function normalizeSheetsRow(row: any) {
  const normalized: Record<string, any> = {};
  Object.keys(row || {}).forEach(k => {
    const kk = String(k).trim().toLowerCase();
    normalized[kk] = row[k];
  });

  const parseDateOnly = (val: any) => {
    if (val === undefined || val === null || val === '') return '';
    try {
      const s = String(val);
      const d = new Date(s);
      if (!isNaN(d.getTime())) {
        return d.toISOString().substring(0, 10); // YYYY-MM-DD
      }
      if (s.includes('T')) return s.split('T')[0];
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
      return s;
    } catch {
      return String(val);
    }
  };

  const extractTime = (val: any) => {
    if (val === undefined || val === null || val === '') return '';
    try {
      const s = String(val).trim();
      if (/^\d{1,2}:\d{2}$/.test(s)) return s.padStart(5, '0');
      const d = new Date(s);
      if (!isNaN(d.getTime())) {
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        return `${hh}:${mm}`;
      }
      const m = s.match(/(\d{1,2}:\d{2})/);
      return m ? m[1] : s;
    } catch {
      return String(val).trim();
    }
  };

  return {
    id: String(normalized['id'] ?? ''),
    date: parseDateOnly(normalized['fecha'] ?? normalized['date'] ?? ''),
    employeeName: String(normalized['nombre'] ?? normalized['name'] ?? '').trim(),
    entryTime: extractTime(normalized['ingreso'] ?? normalized[' ingreso'] ?? normalized['in'] ?? ''),
    exitTime: extractTime(normalized['egreso'] ?? normalized['egress'] ?? ''),
    totalHours: Number(normalized['total_horas'] ?? normalized[' total_horas'] ?? normalized['totalhoras'] ?? 0) || 0,
    dayType: String(normalized['tipo_dia'] ?? normalized['tipodia'] ?? normalized['tipo'] ?? ''),
    isHoliday: (String(normalized['feriado'] ?? '').toLowerCase() === 'true'),
    observation: String(normalized['observaciones'] ?? normalized['observación'] ?? normalized['observ'] ?? ''),
    timestamp: String(normalized['fecha_carga'] ?? normalized['fecha'] ?? ''),
  };
}

async function parseResponseText(text: string) {
  try {
    return JSON.parse(text);
  } catch (e) {
    return null;
  }
}

export const storageService = {
  isConfigured(): boolean {
    return Boolean(PROXY || GOOGLE_SCRIPT_URL);
  },

  // getAllLogs robusto: reintenta si la respuesta parece ser la del save en lugar del listado
  async getAllLogs(retries = 3, delayMs = 800): Promise<any[]> {
    const url = `${PROXY}?action=getEntries`;
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const res = await timeoutFetch(url, { method: 'GET' });
        const text = await res.text();
        console.debug('[storageService] getAllLogs response text (attempt', attempt + 1, '):', text.slice(0, 2000));
        const parsed = await parseResponseText(text);
        if (!parsed) {
          console.warn('[storageService] getAllLogs: response not JSON, attempt', attempt + 1);
        } else {
          let raw = parsed.data ?? parsed;
          if (raw && typeof raw === 'object' && Array.isArray(raw.data)) raw = raw.data;
          // Si recibimos un objeto tipo save-response (contiene id/ok pero no array), reintentar
          if (raw && typeof raw === 'object' && !Array.isArray(raw) && (raw.id || raw.ok) && !Array.isArray(raw.data)) {
            console.warn('[storageService] getAllLogs: received save-like object instead of array, attempt', attempt + 1);
            if (attempt < retries - 1) {
              await new Promise(r => setTimeout(r, delayMs));
              continue;
            } else {
              return [];
            }
          }
          if (Array.isArray(raw)) {
            return raw.map(normalizeSheetsRow);
          } else {
            console.warn('[storageService] getAllLogs: parsed data is not array (attempt', attempt + 1, ')', raw);
          }
        }
      } catch (err) {
        console.error('[storageService] getAllLogs error on attempt', attempt + 1, err);
      }
      await new Promise(r => setTimeout(r, delayMs));
    }
    return [];
  },

  // saveLog devuelve objeto con ok y, cuando sea posible, saved
  async saveLog(entry: any): Promise<{ ok: boolean; saved?: any; raw?: any }> {
    try {
      const res = await timeoutFetch(PROXY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'saveEntry', entry }),
      });
      const text = await res.text();
      console.debug('[storageService] saveLog response text:', text);
      const parsed = await parseResponseText(text);
      if (parsed) {
        const saved = parsed.saved ?? parsed.data ?? parsed.entry ?? parsed;
        return { ok: Boolean(parsed.ok === true || parsed.ok), saved, raw: parsed };
      }
      return { ok: res.ok, raw: text };
    } catch (err) {
      console.error('[storageService] saveLog error', err);
      return { ok: false };
    }
  },

  // deleteLog: solicita eliminación al proxy; el proxy debe validar propietario/admin
  async deleteLog(id: string, requesterName?: string): Promise<boolean> {
    try {
      const res = await timeoutFetch(PROXY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deleteEntry', id, requesterName }),
      });
      const text = await res.text();
      console.debug('[storageService] deleteLog response text:', text);
      try {
        const parsed = JSON.parse(text);
        return Boolean(parsed && (parsed.ok === true || parsed.ok));
      } catch {
        return res.ok;
      }
    } catch (err) {
      console.error('[storageService] deleteLog error', err);
      return false;
    }
  }
};

export default storageService;
