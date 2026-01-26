// Re-exporta el servicio real que vive en src/services para mantener los imports existentes (./services/databaseService)
export { databaseService } from '../src/services/databaseService';
