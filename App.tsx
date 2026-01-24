import React, { useState, useEffect } from 'react';

import { UserRole, SampleRequest, Patient, SAMPLE_DAYS_MAP } from './types';
import { databaseService } from './services/databaseService';

import SampleForm from './components/SampleForm';
import AdminDashboard from './components/AdminDashboard';
import StatisticsDashboard from './components/StatisticsDashboard';

import {
  Microscope,
  ArrowLeftRight,
  Lock,
  Database,
  ClipboardCheck,
  BarChart3,
  Download,
  Cloud
} from 'lucide-react';

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole>(UserRole.DERIVED_LAB);
  const [samples, setSamples] = useState<SampleRequest[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [password, setPassword] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'samples' | 'stats'>('samples');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Carga inicial
  useEffect(() => {
    const loadData = async () => {
      const data = await databaseService.getSamples();
      setSamples(data);
    };
    loadData();
  }, []);

  // Guardado automático
  useEffect(() => {
    const syncData = async () => {
      setIsSyncing(true);
      await databaseService.saveSamples(samples);
      setTimeout(() => setIsSyncing(false), 800);
    };

    if (samples.length > 0) {
      syncData();
    }
  }, [samples]);

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

  const handleAddSample = (patient: Patient): void => {
    const newSample: SampleRequest = {
      id: crypto.randomUUID(),
      patient,
      requestDate: new Date().toISOString(),
      received: 'PENDIENTE'
    };

    setSamples((prev: SampleRequest[]) => [newSample, ...prev]);
  };

  const handleUpdateStatus = (id: string, status: 'SI' | 'NO'): void => {
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
  };

  const handleUploadResult = (id: string, resultUrl: string): void => {
    setSamples((prev: SampleRequest[]) =>
      prev.map((s: SampleRequest) =>
        s.id === id
          ? { ...s, resultUrl, resultUploadDate: new Date().toISOString() }
          : s
      )
    );
  };

  const handleLogin = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (password === 'admin123' || password === 'laprida2024') {
      setIsLoggedIn(true);
    } else {
      alert('Contraseña incorrecta');
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-200 w-full max-w-md">
          <div className="flex flex-col items-center mb-10">
            <div className="flex items-center text-5xl font-black tracking-tighter mb-2">
              <span className="text-[#939393]">Brit</span>
              <span className="text-[#4cd4cc]">Lab</span>
            </div>
            <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-slate-400">
              Microbiología de Avanzada
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                Usuario
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold"
              >
                <option value={UserRole.DERIVED_LAB}>Sanatorio Laprida</option>
                <option value={UserRole.CENTRAL_LAB_ADMIN}>Brit-Lab (Admin)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl"
                />
              </div>
            </div>

            <button className="w-full bg-[#4cd4cc] text-white py-5 rounded-2xl font-black">
              ACCEDER AL SERVICIO
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfcfc] flex flex-col">
      {/* el resto del JSX queda EXACTAMENTE como lo tenías */}
      {/* no hay errores de tipos más abajo porque ya tipamos `samples.map` */}
      {activeTab === 'stats' && role === UserRole.CENTRAL_LAB_ADMIN ? (
        <StatisticsDashboard samples={samples} />
      ) : (
        <AdminDashboard
          samples={samples}
          onUpdateStatus={handleUpdateStatus}
          onUploadResult={handleUploadResult}
        />
      )}
    </div>
  );
};

export default App;
