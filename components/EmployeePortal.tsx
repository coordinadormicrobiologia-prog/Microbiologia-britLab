// --- Patch: añadir normalización, helper debug, optimistic update y pasar requesterName en delete ---
// Inserta estas funciones dentro del componente EmployeePortal (reemplazando fetchRecentLogs, handleSubmit, handleDelete)

  const normalizeSheetsRow = (row: any) => {
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
      exitTime: extractTime(normalized['egreso'] ?? ''),
      totalHours: Number(normalized['total_horas'] ?? normalized[' total_horas'] ?? 0) || 0,
      dayType: String(normalized['tipo_dia'] ?? normalized['tipodia'] ?? ''),
      isHoliday: (String(normalized['feriado'] ?? '').toLowerCase() === 'true'),
      observation: String(normalized['observaciones'] ?? normalized['observación'] ?? ''),
      timestamp: String(normalized['fecha_carga'] ?? ''),
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

  // (temporal) puedes añadir en el JSX un <pre> para ver recentLogs:
  // <pre className="p-4 bg-slate-50 text-xs rounded">{JSON.stringify(recentLogs, null, 2)}</pre>
