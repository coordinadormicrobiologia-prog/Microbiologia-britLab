// Normalize: producir date en formato YYYY-MM-DD (sin tiempo)
function normalizeSheetsRow(row: any) {
  const normalized: Record<string, any> = {};
  Object.keys(row || {}).forEach(k => {
    const kk = String(k).trim().toLowerCase();
    normalized[kk] = row[k];
  });

  const parseDateOnly = (val: any) => {
    if (!val && val !== 0) return '';
    // si es fecha ISO o con 'T', parsear y extraer YYYY-MM-DD
    try {
      const s = String(val);
      // Si viene como número de Excel, mejor tratarlo aparte (no cubro aquí)
      const d = new Date(s);
      if (!isNaN(d.getTime())) {
        return d.toISOString().substring(0, 10); // YYYY-MM-DD
      }
      // si no parsea, intentar extraer antes de 'T'
      if (s.includes('T')) return s.split('T')[0];
      // fallback: devolver texto tal cual
      return s;
    } catch {
      return String(val);
    }
  };

  const extractTime = (val: any) => {
    if (!val) return '';
    try {
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        return `${hh}:${mm}`;
      }
      // si no es fecha completa, puede venir ya como "08:00"
      return String(val).trim();
    } catch {
      return String(val).trim();
    }
  };

  const dateOnly = parseDateOnly(normalized['fecha'] ?? normalized['date'] ?? '');

  return {
    id: String(normalized['id'] ?? ''),
    date: dateOnly, // ahora siempre YYYY-MM-DD o cadena limpia
    employeeName: String(normalized['nombre'] ?? '').trim(),
    entryTime: extractTime(normalized['ingreso'] ?? normalized[' ingreso'] ?? normalized['in'] ?? ''),
    exitTime: extractTime(normalized['egreso'] ?? normalized['egress'] ?? ''),
    totalHours: Number(normalized['total_horas'] ?? normalized[' total_horas'] ?? 0) || 0,
    dayType: String(normalized['tipo_dia'] ?? normalized['tipodia'] ?? ''),
    isHoliday: (String(normalized['feriado'] ?? '').toLowerCase() === 'true'),
    observation: String(normalized['observaciones'] ?? normalized['observación'] ?? ''),
    timestamp: String(normalized['fecha_carga'] ?? ''),
  };
}
