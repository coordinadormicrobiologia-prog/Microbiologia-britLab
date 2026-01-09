
import React, { useState, useEffect } from 'react';
import { GeminiService } from '../geminiService';
import { VideoGenerationState } from '../types';
import { Sparkles, Loader2, Play, Download, AlertCircle, Key, Microscope, FlaskConical, Dna } from 'lucide-react';

const SUGGESTED_TEMPLATES = [
  { label: 'Cocos Gram (+)', prompt: 'Microscopic view of Gram-positive cocci in clusters like Staphylococcus aureus, 100x oil immersion objective, professional medical visualization.' },
  { label: 'Técnica de Siembra', prompt: 'Laboratory technician performing a streak plate technique for isolation on an agar plate in a sterile hood, cinematic lighting.' },
  { label: 'Bacilos Gram (-)', prompt: 'Digital 3D render of Escherichia coli bacteria with flagella moving in a liquid medium, scientific accuracy, clean background.' },
  { label: 'Urocultivo Técnica', prompt: 'Instructional video showing how to collect a clean catch mid-stream urine sample, professional medical graphics, simple for patients.' }
];

const VideoGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);
  const [state, setState] = useState<VideoGenerationState>({
    isGenerating: false
  });

  useEffect(() => {
    const checkKey = async () => {
      const has = await GeminiService.checkApiKey();
      setHasApiKey(has);
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    await GeminiService.openKeySelector();
    setHasApiKey(true);
  };

  const handleGenerate = async (customPrompt?: string) => {
    const finalPrompt = customPrompt || prompt;
    if (!finalPrompt) return;

    setState({ 
      isGenerating: true, 
      message: 'Iniciando generación de video educativo...' 
    });

    try {
      const messages = [
        'Modelando estructura microbiológica...',
        'Simulando ambiente de laboratorio...',
        'Aplicando texturas científicas...',
        'Finalizando renderizado con Veo 3.1...'
      ];
      
      let msgIndex = 0;
      const interval = setInterval(() => {
        msgIndex = (msgIndex + 1) % messages.length;
        setState(prev => ({ ...prev, message: messages[msgIndex] }));
      }, 5000);

      const url = await GeminiService.generateLabVideo(
        `Professional microbiology visualization: ${finalPrompt}`,
        aspectRatio
      );

      clearInterval(interval);
      setState({ isGenerating: false, videoUrl: url });
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('Requested entity was not found')) {
        setHasApiKey(false);
        setState({ 
          isGenerating: false, 
          error: 'Su clave API no es válida o no tiene facturación activa. Por favor, re-seleccione su clave API.' 
        });
      } else {
        setState({ 
          isGenerating: false, 
          error: err.message || 'Error al generar el video.' 
        });
      }
    }
  };

  if (hasApiKey === false) {
    return (
      <div className="max-w-4xl mx-auto p-12 bg-white rounded-[2.5rem] shadow-xl border border-slate-100 text-center space-y-8 animate-in fade-in zoom-in duration-300">
        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto">
          <Key className="text-amber-500" size={40} />
        </div>
        <div className="space-y-4">
          <h2 className="text-2xl font-black text-slate-800">Clave API de Pago Requerida</h2>
          <p className="text-slate-500 max-w-md mx-auto leading-relaxed font-medium text-sm">
            Para utilizar la generación de video de alta calidad, debe seleccionar una clave API vinculada a un proyecto de Google Cloud con facturación activa.
          </p>
        </div>
        <button 
          onClick={handleSelectKey}
          className="bg-[#4cd4cc] hover:bg-[#3bbdb6] text-white px-10 py-5 rounded-2xl font-black shadow-xl shadow-cyan-100 transition-all active:scale-[0.98]"
        >
          SELECCIONAR CLAVE API
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100">
        <div className="flex items-center space-x-3 mb-8">
          <div className="bg-cyan-50 p-3 rounded-2xl">
            <Sparkles className="text-[#4cd4cc]" size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-800">Biblioteca Visual BritLab</h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Generación de Material Educativo con IA</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {SUGGESTED_TEMPLATES.map((tmpl, i) => (
            <button
              key={i}
              onClick={() => {
                setPrompt(tmpl.prompt);
                handleGenerate(tmpl.prompt);
              }}
              disabled={state.isGenerating}
              className="p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-[#4cd4cc] hover:bg-cyan-50 transition-all group text-left"
            >
              {i === 0 && <Microscope className="text-slate-400 group-hover:text-[#4cd4cc] mb-3" size={20} />}
              {i === 1 && <FlaskConical className="text-slate-400 group-hover:text-[#4cd4cc] mb-3" size={20} />}
              {i === 2 && <Dna className="text-slate-400 group-hover:text-[#4cd4cc] mb-3" size={20} />}
              {i === 3 && <Microscope className="text-slate-400 group-hover:text-[#4cd4cc] mb-3" size={20} />}
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-600 group-hover:text-[#4cd4cc]">{tmpl.label}</div>
            </button>
          ))}
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Concepto Personalizado</label>
            <textarea 
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Ej: Visualización de un hongo Aspergillus bajo el microscopio..."
              className="w-full bg-slate-50 border border-slate-200 rounded-3xl p-6 text-slate-800 placeholder-slate-300 focus:ring-4 focus:ring-cyan-50 outline-none h-32 resize-none text-sm font-medium transition-all"
              disabled={state.isGenerating}
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-2">
            <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 w-full sm:w-auto">
              <button 
                onClick={() => setAspectRatio('16:9')}
                className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${aspectRatio === '16:9' ? 'bg-white text-[#4cd4cc] shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
              >
                16:9
              </button>
              <button 
                onClick={() => setAspectRatio('9:16')}
                className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${aspectRatio === '9:16' ? 'bg-white text-[#4cd4cc] shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
              >
                9:16
              </button>
            </div>

            <button 
              onClick={() => handleGenerate()}
              disabled={state.isGenerating || !prompt}
              className={`w-full sm:w-auto px-10 py-5 rounded-2xl font-black flex items-center justify-center space-x-3 transition-all shadow-xl ${
                state.isGenerating || !prompt 
                ? 'bg-slate-100 text-slate-300' 
                : 'bg-[#4cd4cc] text-white hover:bg-[#3bbdb6] shadow-cyan-100'
              }`}
            >
              {state.isGenerating ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>GENERANDO...</span>
                </>
              ) : (
                <>
                  <Play size={20} className="fill-current" />
                  <span>CREAR VIDEO VEO 3.1</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {state.isGenerating && (
        <div className="bg-white rounded-[2.5rem] p-16 border border-slate-100 text-center space-y-6 shadow-sm animate-pulse">
          <div className="w-20 h-20 bg-cyan-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 className="text-[#4cd4cc] animate-spin" size={40} />
          </div>
          <h3 className="text-2xl font-black text-slate-800 tracking-tight">{state.message}</h3>
          <p className="text-slate-400 max-w-sm mx-auto font-medium text-sm leading-relaxed">
            La IA está procesando su solicitud de video de alta definición. Este proceso tarda entre 1 y 2 minutos.
          </p>
        </div>
      )}

      {state.error && (
        <div className="bg-rose-50 border border-rose-100 rounded-[2rem] p-8 flex items-start space-x-4 text-rose-800 shadow-sm">
          <AlertCircle className="shrink-0 text-rose-500" size={24} />
          <div>
            <p className="font-black uppercase tracking-widest text-[10px] mb-1">Error de Generación</p>
            <p className="text-sm font-bold opacity-90">{state.error}</p>
          </div>
        </div>
      )}

      {state.videoUrl && !state.isGenerating && (
        <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in duration-500">
          <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
            <div>
              <h3 className="font-black text-slate-800 text-lg tracking-tight">Visualización Generada</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Tecnología Veo 3.1 - BritLab</p>
            </div>
            <a 
              href={state.videoUrl} 
              download="educacion-microbio.mp4"
              className="flex items-center space-x-2 bg-[#4cd4cc] text-white px-6 py-3 rounded-xl hover:bg-[#3bbdb6] font-black text-xs shadow-lg shadow-cyan-100 transition-all active:scale-95"
            >
              <Download size={16} />
              <span>DESCARGAR MP4</span>
            </a>
          </div>
          <div className="bg-slate-900 flex items-center justify-center relative group">
            <video 
              src={state.videoUrl} 
              controls 
              className={`max-w-full shadow-2xl ${aspectRatio === '9:16' ? 'h-[600px]' : 'aspect-video w-full'}`}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoGenerator;
