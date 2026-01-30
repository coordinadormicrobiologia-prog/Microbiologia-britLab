// fetchRecentLogs robusto
const fetchRecentLogs = async () => {
  setIsRefreshing(true);
  const logs = await storageService.getAllLogs();
  const normalizeName = (s: string) => String(s || '').trim().toLowerCase();
  const myLogs = logs
    .filter(l => normalizeName(l.employeeName) === normalizeName(user.name))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);
  setRecentLogs(myLogs);
  setIsRefreshing(false);
};

// handleSubmit con optimistic update si hay saved
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
    // optimistic: si server devuelve saved, mapearlo con la normalización si hace falta
    const saved = result.saved ?? log;
    setRecentLogs(prev => [saved as TimeLog, ...prev].slice(0,5));
    setMessage({ type: 'success', text: '¡Registro enviado! Actualizando lista...' });
    setObservation('');
    // también reintentar fetch real para sincronizar
    setTimeout(fetchRecentLogs, 1500);
  } else {
    setMessage({ type: 'error', text: 'Error al enviar datos. Verifique su conexión.' });
  }
  setLoading(false);
};

// handleDelete pasando requesterName
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
