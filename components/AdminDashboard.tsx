import { formatLogDateForDisplay } from '../src/utils/dateHelpers';
import React, { useState } from 'react';
import { SampleRequest } from '../types';
import { CheckCircle, XCircle, Clock, Search, Filter, ShieldCheck, FileUp, FileText, Info } from 'lucide-react';

interface Props {
  samples: SampleRequest[];
  onUpdateStatus: (id: string, status: 'SI' | 'NO') => void;
  onUploadResult: (id: string, url: string) => void;
}

const AdminDashboard: React.FC<Props> = ({ samples, onUpdateStatus, onUploadResult }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSamples = samples.filter(s => 
    s.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.patient.dni.includes(searchTerm)
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        alert('Por favor, suba un archivo PDF');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onUploadResult(id, event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-[#4cd4cc]/10 text-[#4cd4cc] rounded-lg">
              <ShieldCheck size={24} />
            </div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Admin BritLab</h2>
          </div>
          <p className="text-slate-500 text-sm font-medium">Recepción y Validación de Derivaciones Externas</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
            <input 
              type="text" 
              placeholder="Buscar por DNI o Paciente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-14 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-[1.5rem] text-sm focus:ring-2 focus:ring-[#4cd4cc] outline-none w-80 font-medium transition-all shadow-sm"
            />
          </div>
          <button className="p-4 bg-slate-50 border border-slate-200 rounded-[1.5rem] text-slate-600 hover:bg-slate-100 shadow-sm transition-all active:scale-95">
            <Filter size={20} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black border-b border-slate-100">
              <tr>
                <th className="px-10 py-6">Paciente / ID</th>
                <th className="px-10 py-6">Análisis / Método</th>
                <th className="px-10 py-6 text-center">Recibido</th>
                <th className="px-10 py-6">Promesa</th>
                <th className="px-10 py-6">Resultados</th>
                <th className="px-10 py-6 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredSamples.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-10 py-24 text-center">
                    <div className="flex flex-col items-center opacity-20">
                      <Clock size={64} className="mb-4" />
                      <p className="text-2xl font-black italic">No se encontraron derivaciones</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSamples.map(sample => (
                  <tr key={sample.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-10 py-6">
                      <div className="text-sm font-black text-slate-900 group-hover:text-[#4cd4cc] transition-colors">{sample.patient.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono tracking-tighter mt-1">DNI: {sample.patient.dni} | {sample.patient.age}a</div>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex flex-col">
                        <span className="text-[11px] font-black text-[#4cd4cc] mb-1">
                          {sample.patient.sampleType.toUpperCase()}
                        </span>
                        {sample.patient.urocultivoMethod && (
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-md inline-block w-fit">
                            {sample.patient.urocultivoMethod}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-10 py-6 text-center">
                      <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest border shadow-sm ${
                        sample.received === 'SI' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                        sample.received === 'NO' ? 'bg-rose-50 text-rose-700 border-rose-100' : 
                        'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>
                        {sample.received}
                      </span>
                    </td>
                    <td className="px-10 py-6">
                      {sample.promisedDate ? (
                        <div className="text-xs font-mono text-[#2fa8a3] font-black bg-[#4cd4cc]/5 px-3 py-1 rounded-lg border border-[#4cd4cc]/10 inline-block">
                          {new Date(sample.promisedDate).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-slate-300 text-[10px] font-black italic uppercase tracking-widest">Pendiente</span>
                      )}
                    </td>
                    <td className="px-10 py-6">
                      {sample.received === 'SI' ? (
                        <div className="flex items-center space-x-2">
                          {sample.resultUrl ? (
                            <div className="flex items-center space-x-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                              <FileText size={14} />
                              <span className="text-[10px] font-black uppercase">PDF OK</span>
                            </div>
                          ) : (
                            <label className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-xl cursor-pointer transition-all border border-slate-200 group-hover:border-[#4cd4cc]">
                              <FileUp size={14} />
                              <span className="text-[10px] font-black uppercase tracking-widest">SUBIR</span>
                              <input 
                                type="file" 
                                className="hidden" 
                                accept="application/pdf"
                                onChange={(e) => handleFileChange(e, sample.id)}
                              />
                            </label>
                          )}
                        </div>
                      ) : (
                        <span className="text-[9px] text-slate-300 italic font-bold">Sin recepción</span>
                      )}
                    </td>
                    <td className="px-10 py-6 text-center">
                      {sample.received === 'PENDIENTE' ? (
                        <div className="flex items-center justify-center space-x-4">
                          <button 
                            onClick={() => onUpdateStatus(sample.id, 'SI')}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white p-3 rounded-2xl transition-all shadow-lg shadow-emerald-50 active:scale-90"
                          >
                            <CheckCircle size={20} />
                          </button>
                          <button 
                            onClick={() => onUpdateStatus(sample.id, 'NO')}
                            className="bg-rose-500 hover:bg-rose-600 text-white p-3 rounded-2xl transition-all shadow-lg shadow-rose-50 active:scale-90"
                          >
                            <XCircle size={20} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] font-black text-slate-200 uppercase tracking-widest">LISTO</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
