
import { SampleRequest } from '../types';

const STORAGE_KEY = 'britlab_v3_cloud_sync';

export const databaseService = {
  // Simulación de carga desde la nube
  async getSamples(): Promise<SampleRequest[]> {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  // Simulación de guardado en la nube
  async saveSamples(samples: SampleRequest[]): Promise<void> {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(samples));
    // Aquí es donde harías: fetch('https://tu-api.com/samples', { method: 'POST', ... })
  },

  // Función para exportar datos a CSV para Excel
  exportToCSV(samples: SampleRequest[]) {
    const headers = ['ID', 'Paciente', 'DNI', 'Edad', 'Sexo', 'Tipo Muestra', 'Fecha Solicitud', 'Estado', 'Promesa', 'Subido En'];
    const rows = samples.map(s => [
      s.id,
      s.patient.name,
      s.patient.dni,
      s.patient.age,
      s.patient.sex,
      s.patient.sampleType,
      new Date(s.requestDate).toLocaleString(),
      s.received,
      s.promisedDate ? new Date(s.promisedDate).toLocaleDateString() : 'N/A',
      s.resultUploadDate ? new Date(s.resultUploadDate).toLocaleString() : 'N/A'
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Reporte_BritLab_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
