
import React, { useState, useMemo } from 'react';
import { SampleRequest } from '../types';
import { PieChart, TrendingUp, Calendar, AlertTriangle, CheckCircle2, FlaskConical } from 'lucide-react';

interface Props {
  samples: SampleRequest[];
}

const StatisticsDashboard: React.FC<Props> = ({ samples }) => {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  const filteredSamples = useMemo(() => {
    if (period === 'all') return samples;
    const now = new Date();
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const cutoff = new Date(now.setDate(now.getDate() - days));
    return samples.filter(s => new Date(s.requestDate) >= cutoff);
  }, [samples, period]);

  const stats = useMemo(() => {
    // Puntualidad
    const deliveredResults = filteredSamples.filter(s => s.resultUrl && s.promisedDate);
    const delayedCount = deliveredResults.filter(s => {
      if (!s.resultUploadDate || !s.promisedDate) return false;
      return new Date(s.resultUploadDate) > new Date(s.promisedDate);
    }).length;

    const onTimeCount = deliveredResults.length - delayedCount;
    const delayPercentage = deliveredResults.length > 0 
      ? Math.round((delayedCount / deliveredResults.length) * 100) 
      : 0;

    // Tipos de Muestras
    const sampleTypesCount: Record<string, number> = {};
    filteredSamples.forEach(s => {
      const type = s.patient.sampleType;
      sampleTypesCount[type] = (sampleTypesCount[type] || 0) + 1;
    });

    const sortedSampleTypes = Object.entries(sampleTypesCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10); // Top 10

    return {
      total: filteredSamples.length,
      delivered: deliveredResults.length,
      delayed: delayedCount,
      onTime: onTimeCount,
      delayPercentage,
      sampleTypes: sortedSampleTypes
    };
  }, [filteredSamples]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-[#4cd4cc]/10 text-[#4cd4cc] rounded-lg">
              <TrendingUp size={24} />
            </div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Análisis de Gestión</h2>
          </div>
          <p className="text-slate-500 text-sm font-medium">Indicadores de Calidad y Puntualidad BritLab</p>
        </div>
        
        <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-2xl border border-slate-200">
          {(['7d', '30d', '90d', 'all'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                period === p ? 'bg-white text-[#4cd4cc] shadow-md' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {p === '7d' ? '7 Días' : p === '30d' ? '30 Días' : p === '90d' ? '90 Días' : 'Histórico'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="p-3 bg-emerald-50 text-emerald-500 rounded-2xl">
              <CheckCircle2 size={24} />
            </div>
            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest">A Tiempo</span>
          </div>
          <div className="text-4xl font-black text-slate-800 mb-1">{stats.onTime}</div>
          <p className="text-xs text-slate-400 font-medium">Resultados entregados antes de la promesa.</p>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <div className="p-3 bg-rose-50 text-rose-500 rounded-2xl">
              <AlertTriangle size={24} />
            </div>
            <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-3 py-1 rounded-full uppercase tracking-widest">Demorados</span>
          </div>
          <div className="flex items-baseline space-x-2 mb-1">
            <span className="text-4xl font-black text-slate-800">{stats.delayed}</span>
            <span className="text-xl font-bold text-rose-400">({stats.delayPercentage}%)</span>
          </div>
          <p className="text-xs text-slate-400 font-medium">Porcentaje de mora sobre resultados entregados.</p>
          {stats.delayPercentage > 20 && (
            <div className="absolute top-0 right-0 w-1 h-full bg-rose-500" />
          )}
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl">
              <FlaskConical size={24} />
            </div>
            <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest">Volumen</span>
          </div>
          <div className="text-4xl font-black text-slate-800 mb-1">{stats.total}</div>
          <p className="text-xs text-slate-400 font-medium">Muestras totales recibidas en el periodo.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-7 bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center space-x-3 mb-8">
            <PieChart className="text-[#4cd4cc]" size={20} />
            <h3 className="font-black text-slate-800 tracking-tight">Distribución por Tipo de Muestra</h3>
          </div>
          
          <div className="space-y-6">
            {stats.sampleTypes.length === 0 ? (
              <div className="py-20 text-center text-slate-300 italic font-medium">No hay datos suficientes</div>
            ) : (
              stats.sampleTypes.map(([type, count]) => (
                <div key={type} className="space-y-2">
                  <div className="flex justify-between text-[11px] font-black uppercase tracking-widest">
                    <span className="text-slate-600">{type}</span>
                    <span className="text-[#4cd4cc]">{count} ({Math.round((count / stats.total) * 100)}%)</span>
                  </div>
                  <div className="h-3 bg-slate-50 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#4cd4cc] to-[#3bbdb6] rounded-full transition-all duration-1000"
                      style={{ width: `${(count / stats.total) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-5 bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 bg-[#4cd4cc]/5 rounded-full flex items-center justify-center mb-6">
            <Calendar className="text-[#4cd4cc]" size={40} />
          </div>
          <h3 className="text-xl font-black text-slate-800 mb-2">Resumen de Periodo</h3>
          <p className="text-sm text-slate-400 font-medium leading-relaxed max-w-xs mx-auto">
            Se han procesado {stats.total} solicitudes en los últimos {period === 'all' ? 'meses' : period.replace('d', ' días')}. 
            El índice de puntualidad es del <span className="text-emerald-500 font-black">{100 - stats.delayPercentage}%</span>.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4 w-full">
            <div className="bg-slate-50 p-4 rounded-2xl">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Muestras/Día</div>
              <div className="text-xl font-black text-slate-700">
                {Math.round(stats.total / (period === 'all' ? 365 : parseInt(period)) * 10) / 10}
              </div>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pendientes</div>
              <div className="text-xl font-black text-slate-700">{stats.total - stats.delivered}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsDashboard;
