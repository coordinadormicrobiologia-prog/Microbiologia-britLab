// services/storageService.ts
// Implementación que usa el proxy /api/proxy cuando está disponible.
// Requiere que exista src/constants.ts exportando PROXY_PATH

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

export const storageService = {
  // Comprueba si la app está configurada: aceptamos proxy o la URL directa
  isConfigured(): boolean {
    return Boolean(PROXY || GOOGLE_SCRIPT_URL);
  },

  // Leer todos los registros
  async getAllLogs(): Promise<any[]> {
    try {
      // Usa proxy para evitar CORS; action=getEntries será pasada al Apps Script desde el proxy
      const url = `${PROXY}?action=getEntries`;
      const res = await timeoutFetch(url, { method: 'GET' });
      const text = await res.text();
      try { return JSON.parse(text).data ?? JSON.parse(text); } catch { return []; }
    } catch (err) {
      console.error('getAllLogs error', err);
      return [];
    }
  },

  // Guardar un registro
  async saveLog(entry: any): Promise<boolean> {
    try {
      // Enviar al proxy; este injectará apiKey y forwardeará al Apps Script
      const res = await timeoutFetch(PROXY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'saveEntry', entry }),
      });

      // Proxy reenvía la respuesta del Apps Script; intentamos parsear
      const text = await res.text();
      try {
        const parsed = JSON.parse(text);
        return Boolean(parsed && (parsed.ok === true || parsed.ok));
      } catch {
        // Si no es JSON, consideramos ok si status HTTP es 2xx
        return res.ok;
      }
    } catch (err) {
      console.error('saveLog error', err);
      return false;
    }
  },

  // Borrar un registro (nuevo)
  async deleteLog(id: string, requesterName?: string): Promise<boolean> {
    try {
      const res = await timeoutFetch(PROXY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deleteEntry', id, requesterName }),
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
