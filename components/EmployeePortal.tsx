// --- patch: añadir normalize y usarlo en fetchRecentLogs ---
  // Normaliza una fila tal como devuelve Sheets/proxy hacia TimeLog
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
      id: String(normalized['id'] ?? normalized['ID'] ?? ''),
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
    setIsRefreshing(true);
    const rawLogs = await storageService.getAllLogs();
    // Mapear/normalizar cada fila para la app
    const mapped = Array.isArray(rawLogs) ? rawLogs.map(normalizeSheetsRow) : [];
    const normalizeName = (s: string) => String(s || '').trim().toLowerCase();
    const myLogs = mapped
      .filter(l => normalizeName(l.employeeName) === normalizeName(user.name))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);
    setRecentLogs(myLogs);
    setIsRefreshing(false);
  };
