
import React, { useState } from 'react';
import { Patient, PatientSex } from '../types';
import { ClipboardList, PlusCircle, Sparkles, Loader2, Info } from 'lucide-react';
import { GeminiService } from '../geminiService';

interface Props {
  onAdd: (patient: Patient) => void;
}

const SAMPLE_TYPES = [
  "Urocultivo", "Exudado Faringeo (Faringitis)", "Flujo Vaginal", "Micoplasmas genitales",
  "Exudado Endocervical", "Exudado Uretral", "Micosis superificial", "Espermocultivo",
  "Primer chorro", "Varios cirugia", "Parasitológico directo", "Parasitológico seriado",
  "Coprocultivo", "Toxina clostridium", "Antigeno de Rotavirus/Adenovirus",
  "Hisopado nasal (Portacion SAU)", "Hisopado axilar (Portacion SAU)",
  "Hisopado inguinal (Portacion SAU)", "Hisopado faringeo (Portacion SAU)",
  "Hisopado balanoprepucial", "Hisopado vaginal/anal (Portacion EGB)",
  "Baciloscopia directa", "Cultivo de micobacterias", "Identificación por MALDI-TOF",
  "Sensibilidad VITEK", "Antígeno INFLU A/INFLU B", "Antígeno COVID",
  "Antígeno Streptococcus pyogenes"
];

const UROCULTIVO_METHODS = [
  "chorro medio", "punción de sonda", "nefrostomia", "punción suprabica", "cateterismo intermitente"
];

const SampleForm: React.FC<Props> = ({ onAdd }) => {
  const [loadingIA, setLoadingIA] = useState(false);
  const [iaInstructions, setIaInstructions] = useState<string | null>(null);
  const [formData, setFormData] = useState<Patient>({
    dni: '',
    name: '',
    age: 0,
    sex: 'Masculino',
    sampleType: '',
    urocultivoMethod: '',
    presumptiveDiagnosis: 'NA',
    background: '',
    observations: ''
  });

  const getIAHelp = async () => {
    if (!formData.sampleType) return;
    setLoadingIA(true);
    try {
      const instructions = await GeminiService.getCollectionInstructions(formData.sampleType);
      setIaInstructions(instructions);
    } catch (e) {
      setIaInstructions("Error al conectar con el asistente.");
    } finally {
      setLoadingIA(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.sampleType === 'Urocultivo' && !formData.urocultivoMethod) {
      alert('Debe seleccionar el método de obtención para el Urocultivo');
      return;
    }
    onAdd(formData);
    setFormData({
      dni: '', name: '', age: 0, sex: 'Masculino',
      sampleType: '', urocultivoMethod: '', presumptiveDiagnosis: 'NA',
      background: '', observations: ''
    });
    setIaInstructions(null);
  };

  return (
    <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-8 border-b border-slate-50 bg-slate-50/20 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <ClipboardList className="text-[#4cd4cc]" size={22} />
          <h3 className="font-black text-slate-800 tracking-tight text-lg">Carga de Muestra</h3>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Nombre Completo</label>
            <input 
              required
              type="text" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#4cd4cc] outline-none text-sm font-medium transition-all"
              placeholder="Ej: Laura Rossi"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">DNI del Paciente</label>
              <input 
                required
                type="text" 
                value={formData.dni}
                onChange={e => setFormData({...formData, dni: e.target.value})}
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#4cd4cc] outline-none text-sm font-medium"
                placeholder="00.000.000"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Sexo</label>
              <select 
                value={formData.sex}
                onChange={e => setFormData({...formData, sex: e.target.value as PatientSex})}
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#4cd4cc] outline-none text-sm font-bold"
              >
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-[#4cd4cc] uppercase tracking-widest mb-1.5 ml-1 font-black">Tipo de Muestra</label>
            <div className="flex gap-2">
              <select 
                required
                value={formData.sampleType}
                onChange={e => {
                  setFormData({...formData, sampleType: e.target.value, urocultivoMethod: ''});
                  setIaInstructions(null);
                }}
                className="flex-grow px-5 py-3.5 bg-cyan-50 border border-cyan-100 rounded-2xl focus:ring-2 focus:ring-[#4cd4cc] outline-none text-[11px] font-black text-cyan-800"
              >
                <option value="">Seleccionar...</option>
                {SAMPLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <button 
                type="button"
                onClick={getIAHelp}
                disabled={!formData.sampleType || loadingIA}
                className="p-3.5 bg-white border border-[#4cd4cc] text-[#4cd4cc] rounded-2xl hover:bg-cyan-50 transition-all disabled:opacity-30 flex items-center justify-center min-w-[50px]"
                title="Ayuda de IA para recolección"
              >
                {loadingIA ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
              </button>
            </div>
          </div>

          {iaInstructions && (
            <div className="bg-cyan-50/50 border border-cyan-100 p-4 rounded-2xl animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center space-x-2 mb-2">
                <Info size={14} className="text-[#4cd4cc]" />
                <span className="text-[9px] font-black text-[#4cd4cc] uppercase tracking-widest">Guía de Recolección IA</span>
              </div>
              <p className="text-[11px] text-cyan-900 font-medium leading-relaxed whitespace-pre-line">
                {iaInstructions}
              </p>
            </div>
          )}

          {formData.sampleType === 'Urocultivo' && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="block text-[10px] font-bold text-[#4cd4cc] uppercase tracking-widest mb-1.5 ml-1">Método de Obtención</label>
              <select 
                required
                value={formData.urocultivoMethod}
                onChange={e => setFormData({...formData, urocultivoMethod: e.target.value})}
                className="w-full px-5 py-3.5 bg-[#4cd4cc]/10 border border-[#4cd4cc]/20 rounded-2xl focus:ring-2 focus:ring-[#4cd4cc] outline-none text-sm font-bold text-cyan-900"
              >
                <option value="">Seleccionar método...</option>
                {UROCULTIVO_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Diagnóstico Presuntivo</label>
            <input 
              type="text" 
              value={formData.presumptiveDiagnosis}
              onChange={e => setFormData({...formData, presumptiveDiagnosis: e.target.value})}
              className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#4cd4cc] outline-none text-sm font-medium"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Antecedentes</label>
            <textarea 
              value={formData.background}
              onChange={e => setFormData({...formData, background: e.target.value})}
              className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#4cd4cc] outline-none text-sm font-medium h-20 resize-none"
              placeholder="Ej: Inmunosuprimido, tratamiento ATB..."
            />
          </div>
        </div>

        <button 
          type="submit"
          className="w-full bg-[#4cd4cc] hover:bg-[#3bbdb6] text-white py-5 rounded-2xl font-black shadow-xl shadow-cyan-100 transition-all flex items-center justify-center space-x-2 active:scale-[0.98]"
        >
          <PlusCircle size={20} />
          <span>ENVIAR DERIVACIÓN</span>
        </button>
      </form>
    </div>
  );
};

export default SampleForm;
