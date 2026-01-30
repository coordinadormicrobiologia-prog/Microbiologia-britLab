// services/storageService.ts
// Implementación que usa el proxy /api/proxy cuando está disponible.
// Requiere que exista src/constants.ts exportando PROXY_PATH y GOOGLE_SCRIPT_URL

import { PROXY_PATH, GOOGLE_SCRIPT_URL } from '../constants';

const PROXY = PROXY_PATH || '/api/proxy'; // fallback

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

function normalizeRawEntry(raw: any) {
  // Normaliza distintas variantes de nombres de campos que pueda devolver el Apps Script / planilla
  const id = raw.id ?? raw.ID ?? raw._id ?? raw.rowId ?? raw.row ?? raw.timestamp ?? (raw.time && raw.time.id) ?? '';
  const date = raw.date ?? raw.fecha ?? raw.Date ?? raw.FECHA ?? '';
  const employeeName =
    raw.employeeName ??
    raw.employee ??
    raw.nombre ??
    raw.nombre_completo ??
    raw['Employee Name'] ??
    raw['Nombre'] ??
    raw.username ??
    raw.user ??
    '';
  const entryTime = raw.entryTime ?? raw.ingreso ?? raw.in ?? raw.start ?? raw.hora_inicio ?? '';
  const exitTime = raw.exitTime ?? raw.egreso ?? raw.out ?? raw.end ?? raw.hora_fin ?? '';
  const totalHours = Number(raw.totalHours ?? raw.horas ?? raw.hours ?? raw.total ?? 0) || 0;
  const dayType = raw.dayType ?? raw.tipo ?? raw.type ?? 'Semana';
  const isHoliday = Boolean(raw.isHoliday ?? raw.feriado ?? raw.holiday ?? false);
  const observation = raw.observation ?? raw.observacion ?? raw.notes ?? raw.nota ?? '';
  const timestamp = raw.timestamp ?? raw.createdAt ?? raw._createdAt ?? '';

  return {
    id: String(id),
    date,
    employeeName,
    entryTime,
    exitTime,
    totalHours,
    dayType,
    isHoliday,
    observation,
    timestamp
  };
}

export const storageService = {
  // Comprueba si la app está configurada: aceptamos proxy o la URL directa
  isConfigured(): boolean {
    return Boolean(PROXY || GOOGLE_SCRIPT_URL);
  },

  // Leer todos los registros y normalizarlos
  async getAllLogs(): Promise<any[]> {
    try {
      const url = `${PROXY}?action=getEntries`;
      const res = await timeoutFetch(url, { method: 'GET' });
      const text = await res.text();
      let parsed: any = null;
      try { parsed = JSON.parse(text); } catch { parsed = text; }

      // Si el Apps Script devuelve { data: [...] } o directamente una lista [...]
      const rawArray = Array.isArray(parsed) ? parsed : (parsed && parsed.data) ? parsed.data : [];
      if (!Array.isArray(rawArray)) return [];

      return rawArray.map(normalizeRawEntry);
    } catch (err) {
      console.error('getAllLogs error', err);
      return [];
    }
  },

  // Guardar un registro
  async saveLog(entry: any): Promise<boolean> {
    try {
      const res = await timeoutFetch(PROXY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'saveEntry', entry }),
      });

      const text = await res.text();
      try {
        const parsed = JSON.parse(text);
        return Boolean(parsed && (parsed.ok === true || parsed.ok));
      } catch {
        return res.ok;
      }
    } catch (err) {
      console.error('saveLog error', err);
      return false;
    }
  },

  // Borrar un registro por id (implementación para el front)
  async deleteLog(id: string): Promise<boolean> {
    try {
      const res = await timeoutFetch(PROXY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deleteEntry', id }),
      });

      const text = await res.text();
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
