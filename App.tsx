
import { UserRole, SampleRequest, Patient, SAMPLE_DAYS_MAP } from './types';
import { databaseService } from './services/databaseService';
import SampleForm from './components/SampleForm';
import AdminDashboard from './components/AdminDashboard';
import StatisticsDashboard from './components/StatisticsDashboard';
import { Microscope, ArrowLeftRight, Lock, Database, ClipboardCheck, BarChart3, Download, Cloud } from 'lucide-react';

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole>(UserRole.DERIVED_LAB);
  const [samples, setSamples] = useState<SampleRequest[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'samples' | 'stats'>('samples');
  const [isSyncing, setIsSyncing] = useState(false);

  // Carga inicial desde el servicio
  useEffect(() => {
    const loadData = async () => {
      const data = await databaseService.getSamples();
      setSamples(data);
    };
    loadData();
  }, []);

  // Guardado automático mediante el servicio
  useEffect(() => {
    const syncData = async () => {
      setIsSyncing(true);
      await databaseService.saveSamples(samples);
      // Simulamos latencia de red
      setTimeout(() => setIsSyncing(false), 800);
    };
    if (samples.length > 0) syncData();
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

  const handleAddSample = (patient: Patient) => {
    const newSample: SampleRequest = {
      id: crypto.randomUUID(),
      patient,
      requestDate: new Date().toISOString(),
      received: 'PENDIENTE'
    };
    setSamples(prev => [newSample, ...prev]);
  };

  const handleUpdateStatus = (id: string, status: 'SI' | 'NO') => {
    setSamples(prev => prev.map(s => {
      if (s.id === id) {
        const arrivalDate = new Date().toISOString();
        const promisedDate = status === 'SI' ? calculatePromisedDate(arrivalDate, s.patient.sampleType) : undefined;
        return {
          ...s,
          received: status,
          arrivalDate: arrivalDate,
          promisedDate: promisedDate
        };
      }
      return s;
    }));
  };

  const handleUploadResult = (id: string, resultUrl: string) => {
    setSamples(prev => prev.map(s => 
      s.id === id ? { ...s, resultUrl, resultUploadDate: new Date().toISOString() } : s
    ));
  };

  const handleLogin = (e: React.FormEvent) => {
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
            <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-slate-400">Microbiología de Avanzada</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Usuario</label>
              <select 
                value={role} 
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#4cd4cc] font-bold text-slate-700"
              >
                <option value={UserRole.DERIVED_LAB}>Sanatorio Laprida</option>
                <option value={UserRole.CENTRAL_LAB_ADMIN}>Brit-Lab (Admin)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#4cd4cc] font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <button className="w-full bg-[#4cd4cc] hover:bg-[#3bbdb6] text-white py-5 rounded-2xl font-black shadow-xl shadow-cyan-100 transition-all active:scale-[0.98]">
              ACCEDER AL SERVICIO
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfcfc] flex flex-col">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center text-3xl font-black tracking-tighter leading-none">
              <span className="text-[#939393]">Brit</span>
              <span className="text-[#4cd4cc]">Lab</span>
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-[9px] uppercase tracking-[0.25em] text-slate-400 font-bold">Gestión de Derivaciones</span>
              {isSyncing ? (
                <span className="flex items-center text-[8px] text-amber-500 font-black uppercase tracking-widest animate-pulse">
                  <Cloud size={8} className="mr-1" /> Sincronizando...
                </span>
              ) : (
                <span className="flex items-center text-[8px] text-emerald-500 font-black uppercase tracking-widest">
                  <Cloud size={8} className="mr-1" /> Cloud Sync OK
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button 
              onClick={() => setActiveTab('samples')}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center space-x-2 ${activeTab === 'samples' ? 'bg-white text-[#4cd4cc] shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <ClipboardCheck size={14} />
              <span>Muestras</span>
            </button>
            {role === UserRole.CENTRAL_LAB_ADMIN && (
              <button 
                onClick={() => setActiveTab('stats')}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center space-x-2 ${activeTab === 'stats' ? 'bg-white text-[#4cd4cc] shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <BarChart3 size={14} />
                <span>Estadísticas</span>
              </button>
            )}
          </div>
          
          <div className="flex items-center space-x-6">
            {role === UserRole.CENTRAL_LAB_ADMIN && (
              <button 
                onClick={() => databaseService.exportToCSV(samples)}
                className="hidden md:flex items-center space-x-2 bg-slate-50 text-slate-600 hover:bg-slate-100 px-4 py-2 rounded-xl text-[10px] font-black border border-slate-200 transition-all"
                title="Descargar base de datos en Excel"
              >
                <Download size={14} />
                <span>EXPORTAR CSV</span>
              </button>
            )}
            <div className="hidden md:flex flex-col items-end pr-6 border-r border-slate-100">
              <span className="text-[9px] font-black text-[#4cd4cc] uppercase tracking-widest">Conectado como</span>
              <span className="text-sm font-bold text-slate-700">{role === UserRole.DERIVED_LAB ? 'Sanatorio Laprida' : 'Brit-Lab Admin'}</span>
            </div>
            <button 
              onClick={() => {
                setIsLoggedIn(false);
                setActiveTab('samples');
              }}
              className="p-3 bg-slate-50 text-slate-400 hover:text-red-500 rounded-2xl transition-all border border-slate-100"
            >
              <ArrowLeftRight size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto w-full px-6 py-10">
        {activeTab === 'stats' && role === UserRole.CENTRAL_LAB_ADMIN ? (
          <StatisticsDashboard samples={samples} />
        ) : role === UserRole.DERIVED_LAB ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-gradient-to-br from-[#4cd4cc] to-[#3bbdb6] p-6 rounded-[2rem] text-white shadow-xl shadow-cyan-50">
                <Microscope size={32} className="mb-4 opacity-50" />
                <h2 className="text-xl font-black leading-tight">Envío de Muestras Sanatorio Laprida</h2>
                <p className="text-xs mt-2 font-medium opacity-80 leading-relaxed">Complete el formulario para registrar la derivación en BritLab.</p>
              </div>
              <SampleForm onAdd={handleAddSample} />
            </div>
            <div className="lg:col-span-8">
              <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-8 border-b border-slate-50 bg-slate-50/20 flex items-center justify-between">
                  <h3 className="font-black text-slate-800 tracking-tight">Registro de Mis Derivaciones</h3>
                  <div className="flex items-center space-x-2 px-4 py-2 bg-white rounded-xl border border-slate-100 shadow-sm">
                    <Database size={14} className="text-[#4cd4cc]" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">DB_v3_SECURE</span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50/50 text-[10px] uppercase font-black text-slate-400 tracking-widest">
                      <tr>
                        <th className="px-8 py-5">Paciente</th>
                        <th className="px-8 py-5">Muestra</th>
                        <th className="px-8 py-5">Estado</th>
                        <th className="px-8 py-5">Resultado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {samples.length === 0 ? (
                        <tr><td colSpan={4} className="px-8 py-20 text-center text-slate-300 italic">No hay registros hoy</td></tr>
                      ) : (
                        samples.map(s => (
                          <tr key={s.id} className="hover:bg-slate-50/30 transition-all">
                            <td className="px-8 py-5">
                              <div className="text-sm font-bold text-slate-900">{s.patient.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">DNI: {s.patient.dni}</div>
                            </td>
                            <td className="px-8 py-5">
                              <span className="text-[10px] font-black px-3 py-1 bg-slate-100 text-slate-600 rounded-lg">
                                {s.patient.sampleType.toUpperCase()}
                              </span>
                            </td>
                            <td className="px-8 py-5">
                              <span className={`px-3 py-1 rounded-lg text-[9px] font-black tracking-widest border ${
                                s.received === 'SI' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                s.received === 'NO' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                                'bg-amber-50 text-amber-600 border-amber-100'
                              }`}>
                                {s.received === 'SI' ? 'ENTREGADA' : s.received === 'NO' ? 'RECHAZADA' : 'EN CAMINO'}
                              </span>
                            </td>
                            <td className="px-8 py-5">
                              {s.resultUrl ? (
                                <a 
                                  href={s.resultUrl} 
                                  download={`Resultado_${s.patient.name}.pdf`}
                                  className="flex items-center space-x-2 text-white bg-emerald-500 hover:bg-emerald-600 px-4 py-2 rounded-xl text-[10px] font-black transition-all shadow-md shadow-emerald-100"
                                >
                                  <Download size={14} />
                                  <span>DESCARGAR PDF</span>
                                </a>
                              ) : s.promisedDate ? (
                                <div className="text-[9px] font-bold text-slate-400 italic">
                                  Promesa: {new Date(s.promisedDate).toLocaleDateString()}
                                </div>
                              ) : '--'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <AdminDashboard samples={samples} onUpdateStatus={handleUpdateStatus} onUploadResult={handleUploadResult} />
        )}
      </main>
    </div>
  );
};

export default App;
