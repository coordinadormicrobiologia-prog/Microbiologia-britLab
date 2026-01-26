import React, { useState, useEffect } from 'react';

import { UserRole, SampleRequest, Patient, SAMPLE_DAYS_MAP } from './types';
import { databaseService } from './services/databaseService';

import SampleForm from './components/SampleForm';
import AdminDashboard from './components/AdminDashboard';
import StatisticsDashboard from './components/StatisticsDashboard';

import {
  Lock,
} from 'lucide-react';

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole>(UserRole.DERIVED_LAB);
  const [samples, setSamples] = useState<SampleRequest[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [password, setPassword] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'samples' | 'stats'>('samples');

  // Modal
  const [showSampleForm, setShowSampleForm] = useState<boolean>(false);

  // Carga inicial desde Google Sheets
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await databaseService.getSamples();
        setSamples(data);
      } catch (err) {
        console.error(err);
        alert('No se pudo cargar la información desde Google Sheets.');
      }
    };
    loadData();
  }, []);

  const reloadSamples = async () => {
    const data = await databaseService.getSamples();
    setSamples(data);
  };

  const calculatePromisedDate = (startDate: string, sampleType: string): string => {
    const daysToAdd = SAMPLE_DAYS_MAP[sampleType] || 1;
    let currentDate = new Date(startDate);
    let addedDays = 0;

    while (addedDays < daysToAdd) {
      currentDate.setDate(currentDate.getDate() + 1);
      if (currentDate.getDay() !== 0) {
        addedDays++;
      }
    }
    return currentDate.toISOString();
  };

  // ✅ AHORA: enviar la muestra a Google Sheets (Apps Script)
  const handleAddSample = async (patient: Patient): Promise<void> => {
    try {
      // Mapeo Patient -> payload que espera el Apps Script
      const samplePayload = {
        created_by:
          role === UserRole.DERIVED_LAB ? 'Sanatorio Laprida' : 'Brit-Lab (Admin)',
        patient_name: patient.name,
        patient_dni: patient.dni,
        sex: patient.sex,
        sample_type: patient.sampleType,
        presumptive_dx: patient.presumptiveDiagnosis,
        antecedents: patient.background,
        status: 'PENDIENTE',
      };

      await databaseService.createSample(samplePayload);

      // Refrescamos desde Sheets para ver el ID real y lo guardado
      await reloadSamples();

      // Cerrar modal
      setShowSampleForm(false);
    } catch (err) {
      console.error(err);
      alert('No se pudo enviar la derivación a Google Sheets.');
    }
  };

  // ✅ Actualizar estado: también persistir en Sheets
  const handleUpdateStatus = async (id: string, status: 'SI' | 'NO'): Promise<void> => {
    try {
      // Actualización optimista en UI
      setSamples((prev: SampleRequest[]) =>
        prev.map((s: SampleRequest) => {
          if (s.id === id) {
            const arrivalDate = new Date().toISOString();
            const promisedDate =
              status === 'SI'
                ? calculatePromisedDate(arrivalDate, s.patient.sampleType)
                : undefined;

            return {
              ...s,
              received: status,
              arrivalDate,
              promisedDate
            };
          }
          return s;
        })
      );

      // Persistir en Sheets (status)
      await databaseService.updateSampleStatus(id, status);

      // Refrescar desde Sheets (para confirmar)
      await reloadSamples();
    } catch (err) {
      console.error(err);
      alert('No se pudo actualizar el estado en Google Sheets.');
    }
  };

  // Esto queda local por ahora (si querés persistir, después lo agregamos al Apps Script)
  const handleUploadResult = (id: string, resultUrl: string): void => {
    setSamples((prev: SampleRequest[]) =>
      prev.map((s: SampleRequest) =>
        s.id === id ? { ...s, resultUrl } : s
      )
    );
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] flex flex-col">
      <header className="p-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black">Microbiología de Avanzada</h1>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowSampleForm(true)}
            className="bg-[#4cd4cc] text-white px-4 py-2 rounded-lg font-bold hover:bg-[#3bbdb6]"
          >
            Cargar Muestra
          </button>
        </div>
      </header>

      <main className="p-6 flex-1">
        {activeTab === 'stats' && role === UserRole.CENTRAL_LAB_ADMIN ? (
          <StatisticsDashboard samples={samples} />
        ) : (
          <AdminDashboard
            samples={samples}
            onUpdateStatus={handleUpdateStatus}
            onUploadResult={handleUploadResult}
          />
        )}
      </main>

      {showSampleForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl w-full max-w-3xl p-6 relative shadow-lg">
            <button
              onClick={() => setShowSampleForm(false)}
              className="absolute right-4 top-4 text-slate-500 hover:text-slate-700 font-bold"
            >
              Cerrar
            </button>

            <h3 className="font-black text-lg mb-4">Carga de Muestra</h3>

            <SampleForm onAdd={handleAddSample} />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

import { SampleRequest, Patient } from "./types";

export function normalizeSamples(rows: any[]): SampleRequest[] {
  return rows.map((r) => {
    const patient: Patient = {
      dni: String(r.patient_dni ?? ""),
      name: String(r.patient_name ?? ""),
      age: Number(r.patient_age ?? 0),
      sex: (r.sex as any) ?? "Otro",
      sampleType: String(r.sample_type ?? ""),
      presumptiveDiagnosis: String(r.presumptive_dx ?? ""),
      background: String(r.antecedents ?? ""),
      observations: String(r.observations ?? ""),
    };

    const sample: SampleRequest = {
      id: String(r.id),
      patient,
      requestDate: String(r.created_at ?? ""),
      received: (r.status as any) ?? "PENDIENTE",
      arrivalDate: r.arrivalDate ?? undefined,
      promisedDate: r.promisedDate ?? undefined,
      resultUrl: r.resultUrl ?? undefined,
      resultUploadDate: r.resultUploadDate ?? undefined,
    };

    return sample;
  });
}
