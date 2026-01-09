
export enum UserRole {
  DERIVED_LAB = 'DERIVED_LAB', // Sanatorio Laprida
  CENTRAL_LAB_ADMIN = 'CENTRAL_LAB_ADMIN' // BritLab
}

export type PatientSex = 'Masculino' | 'Femenino' | 'Otro';

export interface Patient {
  dni: string;
  name: string;
  age: number;
  sex: PatientSex;
  sampleType: string;
  urocultivoMethod?: string;
  presumptiveDiagnosis: string;
  background: string;
  observations: string;
}

export interface SampleRequest {
  id: string;
  patient: Patient;
  requestDate: string;
  received: 'SI' | 'NO' | 'PENDIENTE';
  arrivalDate?: string;
  promisedDate?: string;
  resultUrl?: string; 
  resultUploadDate?: string; 
}

// Added VideoGenerationState interface
export interface VideoGenerationState {
  isGenerating: boolean;
  message?: string;
  videoUrl?: string;
  error?: string;
}

export const SAMPLE_DAYS_MAP: Record<string, number> = {
  "Urocultivo": 6,
  "Exudado Faringeo (Faringitis)": 3,
  "Flujo Vaginal": 4,
  "Micoplasmas genitales": 4,
  "Exudado Endocervical": 4,
  "Exudado Uretral": 4,
  "Micosis superificial": 15,
  "Espermocultivo": 4,
  "Primer chorro": 4,
  "Varios cirugia": 7,
  "Parasitológico directo": 5,
  "Parasitológico seriado": 5,
  "Coprocultivo": 4,
  "Toxina clostridium": 1,
  "Antigeno de Rotavirus/Adenovirus": 1,
  "Hisopado nasal (Portacion SAU)": 4,
  "Hisopado axilar (Portacion SAU)": 4,
  "Hisopado inguinal (Portacion SAU)": 4,
  "Hisopado faringeo (Portacion SAU)": 4,
  "Hisopado balanoprepucial": 4,
  "Hisopado vaginal/anal (Portacion EGB)": 3,
  "Baciloscopia directa": 1,
  "Cultivo de micobacterias": 60,
  "Identificación por MALDI-TOF": 1,
  "Sensibilidad VITEK": 2,
  "Antígeno INFLU A/INFLU B": 1,
  "Antígeno COVID": 1,
  "Antígeno Streptococcus pyogenes": 1
};
