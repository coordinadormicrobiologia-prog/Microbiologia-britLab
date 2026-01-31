// utils/dateHelpers.ts
export function formatLogDateForDisplay(dateStr: string) {
  if (!dateStr) return 'Invalid Date';
  // Si ya contiene 'T' o es ISO completo, parsear directamente
  let d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
  // Si parece YYYY-MM-DD, añadir hora neutra y parsear
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    d = new Date(dateStr + 'T12:00:00');
    if (!isNaN(d.getTime())) return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
  }
  // último recurso: intentar parse genérico
  d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
  return 'Invalid Date';
}
