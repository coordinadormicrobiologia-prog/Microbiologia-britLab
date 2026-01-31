import React, { useState, useEffect } from 'react';
import { User, TimeLog, DayType } from '../types';
import { storageService } from '../services/storageService';
import { OBSERVATION_PLACEHOLDER } from '../constants';

interface EmployeePortalProps {
  user: User;
}

const EmployeePortal: React.FC<EmployeePortalProps> = ({ user }) => {
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [entryTime, setEntryTime] = useState<string>('08:00');
  const [exitTime, setExitTime] = useState<string>('16:00');
  const [isHoliday, setIsHoliday] = useState<boolean>(false);
  const [observation, setObservation] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [recentLogs, setRecentLogs] = useState<TimeLog[]>([]);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning', text: string } | null>(null);

  // Normaliza una fila como lo hace storageService (por seguridad si el service no normalizara)
  const normalizeSheetsRow = (row: any) => {
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
        if (!isNaN(d.getTime())) return d.toISOString().substring(0, 10);
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
    } as TimeLog;
  };

  const fetchRecentLogs = async () => {
    console.log('[DEBUG] fetchRecentLogs: start');
    setIsRefreshing(true);
    try {
      const logs = await storageService.getAllLogs();
      console.log('[DEBUG] storageService.getAllLogs raw:', logs);
      const mapped = Array.isArray(logs) ? logs.map(normalizeSheetsRow) : [];
      console.log('[DEBUG] mapped logs (first 5):', mapped.slice(0,5));
      const normalizeName = (s: string) => String(s || '').trim().toLowerCase();
      const myLogs = mapped
        .filter(l => normalizeName(l.employeeName) === normalizeName(user.name))
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 5);
      console.log('[DEBUG] myLogs (to set):', myLogs);
      setRecentLogs(myLogs);
    } catch (err) {
      console.error('[DEBUG] fetchRecentLogs error', err);
      setRecentLogs([]);
    } finally {
      setIsRefreshing(false);
      console.log('[DEBUG] fetchRecentLogs: end');
    }
  };

  useEffect(() => {
    if (!storageService.isConfigured()) {
      setMessage({ type: 'warning', text: 'Configuración pendiente: Falta la URL de Google Script en constants.ts' });
    }
    fetchRecentLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.name]);

  const calculateHours = () => {
    if (!entryTime || !exitTime) return 0;
    const [h1, m1] = entryTime.split(':').map(Number);
    const [h2, m2] = exitTime.split(':').map(Number);
    let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (diff < 0) diff += 24 * 60;
    return Number((diff / 60).toFixed(2));
  };

  const actualDayType = (selectedDate: string, holiday: boolean): DayType => {
    if (holiday) return 'Feriado';
    const d = new Date(selectedDate + 'T00:00:00');
    const day = d.getDay();
    return (day === 0 || day === 6) ? 'Fin de Semana' : 'Semana';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storageService.isConfigured()) {
      alert('Error: La URL de Google Sheets no ha sido configurada.');
      return;
    }

    setLoading(true);
    setMessage(null);

    const total = calculateHours();
    const dayType = actualDayType(date, isHoliday);

    const log: Omit<TimeLog, 'timestamp'> = {
      id: crypto.randomUUID(),
      date,
      employeeName: user.name,
      entryTime,
      exitTime,
      totalHours: total,
      dayType,
      isHoliday,
      observation
    };

    const result = await storageService.saveLog(log);

    if (result.ok) {
      const saved = result.saved ?? log;
      // Optimistic update
      setRecentLogs(prev => [saved as TimeLog, ...prev].slice(0,5));
      setMessage({ type: 'success', text: '¡Registro enviado! Actualizando lista...' });
      setObservation('');
      setTimeout(fetchRecentLogs, 1500);
    } else {
      setMessage({ type: 'error', text: 'Error al enviar datos. Verifique su conexión.' });
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Deseas borrar este registro?')) return;

    setLoading(true);
    const success = await storageService.deleteLog(id, user.name);
    if (success) {
      setRecentLogs(prev => prev.filter(l => l.id !== id));
      setMessage({ type: 'success', text: 'Registro eliminado.' });
      setTimeout(fetchRecentLogs, 1000);
    } else {
      setMessage({ type: 'error', text: 'No se pudo eliminar el registro.' });
    }
    setLoading(false);
  };

  // helper temporal expuesto en window para debug sin rebuild
  (window as any).__debug_fetchRecentLogs = async () => {
    try {
      const logs = await storageService.getAllLogs();
      const mapped = Array.isArray(logs) ? logs.map(normalizeSheetsRow) : [];
      console.log('__debug_fetchRecentLogs mapped sample:', mapped.slice(0,10));
      return mapped;
    } catch (e) {
      console.error('__debug_fetchRecentLogs error', e);
      throw e;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white rounded-2xl shadow-sm border p-6 md:p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Registrar Horas</h2>
          <p className="text-slate-500">Carga tu jornada laboral diaria</p>
        </div>

        {message && (
          <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 animate-pulse ${
            message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 
            message.type === 'warning' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            <div className="text-sm">{message.text}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* form fields (date, entryTime, exitTime, holiday, observation) */}
          {/* ... mantén el resto del formulario tal cual ... */}
          <div className="flex items-center justify-between">
            <button type="submit" className="px-6 py-3 bg-blue-600 text-white rounded-md">Confirmar Registro</button>
            <div className="text-sm text-slate-500">{isRefreshing ? 'Actualizando...' : ''}</div>
          </div>
        </form>
      </div>

      {/* Tus Registros Recientes */}
      <div className="bg-white rounded-2xl shadow-sm border p-6 md:p-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Tus Registros Recientes</h3>
            <p className="text-xs text-slate-500">Puedes borrar una carga si cometiste un error</p>
          </div>
          <div>
            <button onClick={fetchRecentLogs} disabled={isRefreshing} className={`p-2 text-slate-500 hover:bg-slate-100 rounded-lg ${isRefreshing ? 'animate-spin' : ''}`}>↻</button>
          </div>
        </div>

        <div className="space-y-4">
          {recentLogs.length === 0 ? (
            <div className="text-sm text-slate-500">No hay registros encontrados</div>
          ) : (
            recentLogs.map(log => (
              <div key={log.id} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <div className="font-medium">{new Date(log.date + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}</div>
                  <div className="text-xs text-slate-500">{log.entryTime} a {log.exitTime} — {log.totalHours}h ({log.dayType})</div>
                </div>
                <div>
                  <button onClick={() => handleDelete(log.id)} className="text-red-500 p-2 rounded hover:bg-red-50">🗑</button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* DEBUG: mostrar recentLogs como JSON (temporal)
        <pre className="p-4 bg-slate-50 text-xs rounded mt-4">{JSON.stringify(recentLogs, null, 2)}</pre>
        */}
      </div>
    </div>
  );
};

export default EmployeePortal;
