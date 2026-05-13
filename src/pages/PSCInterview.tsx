import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { 
  ArrowLeft, 
  Save, 
  Heart, 
  Home, 
  Users, 
  FileText,
  CheckCircle2
} from 'lucide-react';

interface InterviewData {
  id_psc: number;
  dias_sit_calle: number;
  lugar_origen: string;
  motivo_atencion: string; // Will map to array on submit
  
  // Salud
  vul_salud: boolean;
  diagnostico_salud_mental: string;
  tratamiento_salud_mental: string;
  enfermedad_cronica: string[]; // Changed to array
  tratamiento_enf_cronica: string; 
  
  // Consumo
  tiempo_consumo: string; // Now a select
  tipo_consumo: string[]; // Changed to array
  realizo_tratamiento: string;
  comentarios_consumo: string;
  
  // Social / Vulnerabilidades
  vul_vincular: boolean;
  vul_educacion: boolean;
  vul_laboral: boolean;
  vul_identidad: boolean;
  judicializado: string;
  causa_situacion_calle: string[]; // Changed to array
  instituciones_pasadas: string[]; // Changed to array
  
  // Educacion y Laboral
  nivel_educativo: string;
  tipo_oficio: string; // Experiencia Laboral
  condicion_empleo: string;
  curso_oficio: string;
  obs_oficio: string;
  
  // Direccion / Demanda / Hotel
  de_donde_demanda: string;
  direccion: string;
  barrio: string;
  coordenada: string;
  obs_direccion: string;
  acepta_alojamiento: boolean;
  hotel: string;
  obs_hotel: string;
  foto_negativa_alojamiento: string;
  
  // Observaciones
  comentarios_lugar_origen: string;
  comentarios_salud_mental: string;
  tipo_enf_cronica: string;
  comentarios_enf_cronica: string;
  lugar_tratamiento_sm: string[]; // Changed to array
  lugar_tratamiento_enf: string[]; // Changed to array
  obs_lugar_tratamiento: string;
  url_informe: string;
  
  entrevista?: boolean;
  id_ingreso?: number;
}

import { useOpciones } from '../hooks/useOpciones';
import CheckboxGroup from '../components/form/CheckboxGroup';
import ToggleGroup from '../components/form/ToggleGroup';

const PSCInterview = () => {
  const { opciones, loading: optionsLoading } = useOpciones();
  const { id, ingresoId } = useParams<{ id: string; ingresoId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('situacion');
  const [personName, setPersonName] = useState('');
  
  const [formData, setFormData] = useState<InterviewData>({
    id_psc: parseInt(id || '0'),
    dias_sit_calle: 0,
    lugar_origen: '',
    motivo_atencion: '',
    vul_salud: false,
    diagnostico_salud_mental: '',
    tratamiento_salud_mental: '',
    enfermedad_cronica: [],
    tratamiento_enf_cronica: '',
    tiempo_consumo: '',
    tipo_consumo: [],
    realizo_tratamiento: '',
    comentarios_consumo: '',
    vul_vincular: false,
    vul_educacion: false,
    vul_laboral: false,
    vul_identidad: false,
    nivel_educativo: '',
    tipo_oficio: '',
    condicion_empleo: '',
    curso_oficio: '',
    obs_oficio: '',
    comentarios_lugar_origen: '',
    
    de_donde_demanda: '',
    direccion: '',
    barrio: '',
    coordenada: '',
    obs_direccion: '',
    acepta_alojamiento: false,
    hotel: '',
    obs_hotel: '',
    foto_negativa_alojamiento: '',
    
    comentarios_salud_mental: '',
    tipo_enf_cronica: '',
    comentarios_enf_cronica: '',
    judicializado: '',
    causa_situacion_calle: [],
    instituciones_pasadas: [],
    lugar_tratamiento_sm: [],
    lugar_tratamiento_enf: [],
    obs_lugar_tratamiento: '',
    url_informe: '',

    entrevista: false,
    id_ingreso: ingresoId ? parseInt(ingresoId) : undefined
  });

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // 1. Fetch Person Name
      const { data: pData } = await supabase.from('t_psc').select('nombre, apellido').eq('id', id).single();
      if (pData) setPersonName(`${pData.nombre} ${pData.apellido}`);

      // 2. Fetch Interview for this specific Ingreso
      if (ingresoId) {
        const { data: iData } = await supabase
          .from('t_entrevista')
          .select('*')
          .eq('id_ingreso', ingresoId)
          .maybeSingle();

        if (iData) {
          // Map JSONB arrays correctly
          const parseArray = (val: any) => {
            if (!val) return [];
            if (Array.isArray(val)) return val;
            try {
              const parsed = JSON.parse(val);
              return Array.isArray(parsed) ? parsed : [val];
            } catch {
              return [val];
            }
          };

          setFormData({
            ...formData,
            ...iData,
            motivo_atencion: Array.isArray(iData.motivo_atencion) ? iData.motivo_atencion[0] : (iData.motivo_atencion || ''),
            causa_situacion_calle: parseArray(iData.causa_situacion_calle),
            instituciones_pasadas: parseArray(iData.instituciones_pasadas),
            lugar_tratamiento_sm: parseArray(iData.lugar_tratamiento_sm),
            lugar_tratamiento_enf: parseArray(iData.lugar_tratamiento_enf),
            tipo_consumo: parseArray(iData.tipo_consumo),
            enfermedad_cronica: parseArray(iData.enfermedad_cronica || iData.tipo_enf_cronica)
          });
        }
      }
    } catch (err) {
      console.error('Error fetching interview:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as any;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // 1. Try to find interview for this ingreso
      let targetId = null;
      if (ingresoId) {
        const { data: existing } = await supabase
          .from('t_entrevista')
          .select('id')
          .eq('id_ingreso', ingresoId)
          .maybeSingle();
        if (existing) targetId = existing.id;
      }

      const { entrevista, id: _formDataId, ...restFormData } = formData as any;
      const finalData = {
        ...restFormData,
        motivo_atencion: formData.motivo_atencion ? [formData.motivo_atencion] : null,
        causa_situacion_calle: formData.causa_situacion_calle.length > 0 ? formData.causa_situacion_calle : null,
        instituciones_pasadas: formData.instituciones_pasadas.length > 0 ? formData.instituciones_pasadas : null,
        lugar_tratamiento_sm: formData.lugar_tratamiento_sm.length > 0 ? formData.lugar_tratamiento_sm : null,
        lugar_tratamiento_enf: formData.lugar_tratamiento_enf.length > 0 ? formData.lugar_tratamiento_enf : null,
        tipo_consumo: formData.tipo_consumo.length > 0 ? formData.tipo_consumo : null,
        enfermedad_cronica: formData.enfermedad_cronica.length > 0 ? formData.enfermedad_cronica : null,
        tipo_enf_cronica: formData.enfermedad_cronica.join(', '), // Keep legacy text field sync
        id_psc: parseInt(id || '0'),
        id_ingreso: ingresoId ? parseInt(ingresoId) : formData.id_ingreso
      };

      if (targetId) {
        // ACTUALIZAR
        const updateData = { ...finalData };
        const { error } = await supabase
          .from('t_entrevista')
          .update(updateData)
          .eq('id', targetId);
        if (error) throw error;
      } else {
        // INSERTAR
        const { error } = await supabase
          .from('t_entrevista')
          .insert([finalData]);
        if (error) throw error;
      }

      // Mark interview as completed in t_ingresos
      if (ingresoId) {
        await supabase
          .from('t_ingresos')
          .update({ entrevista: true })
          .eq('id', ingresoId);
      } else {
        await supabase
          .from('t_ingresos')
          .update({ entrevista: true })
          .eq('id_psc', id)
          .eq('activo', true);
      }

      navigate(ingresoId ? `/psc/${id}/ingreso/${ingresoId}` : `/psc/${id}`);
    } catch (err) {
      console.error('Error saving interview:', err);
      alert('Error al guardar la entrevista.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-20 text-center font-bold text-slate-400">Cargando formulario técnico...</div>;

  const tabs = [
    { id: 'situacion', label: 'Situación', icon: Home },
    { id: 'salud', label: 'Salud', icon: Heart },
    { id: 'social', label: 'Social', icon: Users },
    { id: 'derivacion', label: 'Derivación', icon: CheckCircle2 }, // Added tab
    { id: 'docs', label: 'Documentos', icon: FileText },
  ];

  return (
    <Layout>
      <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in slide-in-from-bottom duration-500">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(ingresoId ? `/psc/${id}/ingreso/${ingresoId}` : `/psc/${id}`)}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-primary/60 px-1">Malla de Entrevistas V2</span>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-headline">
                Entrevista de <span className="text-primary">{personName}</span>
              </h1>
            </div>
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 bg-slate-900 text-white border-none px-8 py-4 rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
          >
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={18} />}
            Finalizar Entrevista
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100/80 rounded-3xl backdrop-blur-sm sticky top-24 z-20 border border-white">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl font-bold text-sm transition-all ${
                activeTab === tab.id 
                  ? 'bg-white text-primary shadow-sm ring-1 ring-slate-200' 
                  : 'text-slate-500 hover:bg-white/50 hover:text-slate-800'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-[40px] shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-50 overflow-hidden">
          <div className="p-10 space-y-10">
            
            {/* TAB: SITUACION */}
            {activeTab === 'situacion' && (
              <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">De dónde demanda</label>
                     <select
                       name="de_donde_demanda"
                       value={formData.de_donde_demanda}
                       onChange={handleInputChange}
                       disabled={optionsLoading}
                       className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold text-slate-800 focus:ring-4 focus:ring-primary/10 transition-all shadow-inner disabled:opacity-50"
                     >
                       <option value="">Seleccione...</option>
                       {(opciones['de_donde_demanda'] || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                     </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Motivo de Atención</label>
                    <select
                      name="motivo_atencion"
                      value={formData.motivo_atencion}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold text-slate-800 focus:ring-4 focus:ring-primary/10 transition-all shadow-inner"
                    >
                      <option value="">Seleccione...</option>
                      <option value="Situacion de Calle">Situación de Calle</option>
                      <option value="Desalojo">Desalojo</option>
                      <option value="Traslado">Traslado</option>
                      <option value="Salud">Salud</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Lugar de Procedencia (Origen)</label>
                    <select
                      name="lugar_origen"
                      value={formData.lugar_origen}
                      onChange={handleInputChange}
                      disabled={optionsLoading}
                      className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold text-slate-800 focus:ring-4 focus:ring-primary/10 transition-all shadow-inner disabled:opacity-50"
                    >
                      <option value="">Seleccione...</option>
                      {(opciones['lugar_origen'] || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Tiempo en calle (días)</label>
                    <input
                      type="number"
                      name="dias_sit_calle"
                      value={formData.dias_sit_calle}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold text-slate-800 focus:ring-4 focus:ring-primary/10 transition-all shadow-inner font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Dirección Actual</label>
                     <input
                       name="direccion"
                       value={formData.direccion}
                       onChange={handleInputChange}
                       className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold text-slate-800 focus:ring-4 focus:ring-primary/10 transition-all shadow-inner"
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Barrio</label>
                     <input
                       name="barrio"
                       value={formData.barrio}
                       onChange={handleInputChange}
                       className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold text-slate-800 focus:ring-4 focus:ring-primary/10 transition-all shadow-inner"
                     />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Acepta Alojamiento / Parador</label>
                     <select
                       name="acepta_alojamiento"
                       value={formData.acepta_alojamiento ? 'true' : 'false'}
                       onChange={(e) => setFormData(prev => ({ ...prev, acepta_alojamiento: e.target.value === 'true' }))}
                       className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold text-slate-800 focus:ring-4 focus:ring-primary/10 transition-all shadow-inner"
                     >
                       <option value="false">No</option>
                       <option value="true">Sí</option>
                     </select>
                  </div>
                  {formData.acepta_alojamiento && (
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Alojamiento / Dispositivo Destino</label>
                      <input
                        name="hotel"
                        value={formData.hotel}
                        onChange={handleInputChange}
                        className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold text-slate-800 focus:ring-4 focus:ring-primary/10 transition-all shadow-inner"
                      />
                    </div>
                  )}
                  <div className="md:col-span-2">
                    <CheckboxGroup 
                      label="Modo/Causas de Situación en Calle"
                      opciones={opciones['causa_situacion_calle'] || []}
                      valores={formData.causa_situacion_calle}
                      onChange={(nuevos) => setFormData(prev => ({ ...prev, causa_situacion_calle: nuevos }))}
                      disabled={optionsLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Observaciones Técnicas Generales</label>
                   <textarea
                     rows={6}
                     name="comentarios_lugar_origen"
                     value={formData.comentarios_lugar_origen}
                     onChange={handleInputChange}
                     placeholder="Relato de la situación detectada..."
                     className="w-full bg-slate-50 border-none rounded-[32px] px-6 py-5 font-medium text-slate-800 focus:ring-4 focus:ring-primary/10 transition-all shadow-inner resize-none"
                   />
                </div>
              </div>
            )}

            {/* TAB: SALUD */}
            {activeTab === 'salud' && (
              <div className="space-y-12 animate-in fade-in zoom-in-95 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <label className="group flex flex-col p-6 bg-slate-50 rounded-3xl border-2 border-transparent hover:bg-white hover:border-primary/20 transition-all cursor-pointer shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                       <Heart className="text-primary" size={24} />
                       <input 
                         type="checkbox" 
                         name="vul_salud"
                         checked={formData.vul_salud}
                         onChange={handleInputChange}
                         className="w-5 h-5 rounded-lg border-2 border-slate-300 text-primary focus:ring-primary/20" 
                       />
                    </div>
                    <span className="text-sm font-black text-slate-800 uppercase tracking-tight">Salud Mental</span>
                    <span className="text-[10px] text-slate-400 font-bold mt-1 uppercase">Detección de vulnerabilidad en salud</span>
                  </label>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Diagnóstico / Observaciones Salud Mental</label>
                    <input
                      name="diagnostico_salud_mental"
                      value={formData.diagnostico_salud_mental}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold text-slate-800 focus:ring-4 focus:ring-primary/10 transition-all shadow-inner"
                      placeholder="Ej: Esquizofrenia, Depresión, etc."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Tratamiento Salud Mental</label>
                    <input
                      name="tratamiento_salud_mental"
                      value={formData.tratamiento_salud_mental}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold text-slate-800 focus:ring-4 focus:ring-primary/10 transition-all shadow-inner"
                      placeholder="Ej: Medicación (Quetiapina), Terapia, etc."
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <CheckboxGroup 
                      label="Lugar Tratamiento Salud Mental"
                      opciones={opciones['lugar_tratamiento_sm'] || []}
                      valores={formData.lugar_tratamiento_sm}
                      onChange={(nuevos) => setFormData(prev => ({ ...prev, lugar_tratamiento_sm: nuevos }))}
                      disabled={optionsLoading}
                    />
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Comentarios Salud Mental</label>
                    <textarea
                      name="comentarios_salud_mental"
                      value={formData.comentarios_salud_mental}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold text-slate-800 focus:ring-4 focus:ring-primary/10 transition-all shadow-inner resize-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <CheckboxGroup 
                      label="Enfermedad Crónica"
                      opciones={opciones['enfermedad_cronica'] || []}
                      valores={formData.enfermedad_cronica}
                      onChange={(nuevos) => setFormData(prev => ({ ...prev, enfermedad_cronica: nuevos }))}
                      disabled={optionsLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Tratamiento Enf. Crónica</label>
                    <input
                      name="tratamiento_enf_cronica"
                      value={formData.tratamiento_enf_cronica}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold text-slate-800 focus:ring-4 focus:ring-primary/10 transition-all shadow-inner"
                      placeholder="¿Sigue algún tratamiento? ¿Qué medicación?"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <CheckboxGroup 
                      label="Lugar Trat. Enf. Crónica"
                      opciones={opciones['lugar_tratamiento_enf'] || []}
                      valores={formData.lugar_tratamiento_enf}
                      onChange={(nuevos) => setFormData(prev => ({ ...prev, lugar_tratamiento_enf: nuevos }))}
                      disabled={optionsLoading}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Comentarios Enf. Crónica</label>
                    <textarea
                      name="comentarios_enf_cronica"
                      value={formData.comentarios_enf_cronica}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold text-slate-800 focus:ring-4 focus:ring-primary/10 transition-all shadow-inner resize-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Tiempo de Consumo</label>
                    <select
                      name="tiempo_consumo"
                      value={formData.tiempo_consumo}
                      onChange={handleInputChange}
                      disabled={optionsLoading}
                      className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold text-slate-800 focus:ring-4 focus:ring-primary/10 transition-all shadow-inner disabled:opacity-50"
                    >
                      <option value="">Seleccione...</option>
                      {(opciones['tiempo_consumo'] || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Realizó Tratamiento?</label>
                    <select
                      name="realizo_tratamiento"
                      value={formData.realizo_tratamiento}
                      onChange={handleInputChange}
                      className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold text-slate-800 focus:ring-4 focus:ring-primary/10 transition-all shadow-inner"
                    >
                      <option value="">Seleccione...</option>
                      <option value="SI">Sí</option>
                      <option value="NO">No</option>
                      <option value="EN CURSO">En curso</option>
                    </select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Observaciones de Consumo</label>
                    <textarea
                      name="comentarios_consumo"
                      value={formData.comentarios_consumo}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold text-slate-800 focus:ring-4 focus:ring-primary/10 transition-all shadow-inner resize-none"
                      placeholder="Detalles sobre frecuencia, tipo de consumo, etc."
                    />
                  </div>
                </div>

                <ToggleGroup 
                  label="Sustancias de Interés (Consumo)"
                  opciones={opciones['tipo_consumo'] || []}
                  valores={formData.tipo_consumo}
                  onChange={(nuevos) => setFormData(prev => ({ ...prev, tipo_consumo: nuevos }))}
                  disabled={optionsLoading}
                />
              </div>
            )}

            {/* TAB: SOCIAL */}
            {activeTab === 'social' && (
              <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <label className="group flex flex-col p-6 bg-slate-50 rounded-3xl border-2 border-transparent hover:bg-white hover:border-primary/20 transition-all cursor-pointer shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                         <Users className="text-primary" size={24} />
                         <input 
                           type="checkbox" 
                           name="vul_vincular"
                           checked={formData.vul_vincular}
                           onChange={handleInputChange}
                           className="w-5 h-5 rounded-lg border-2 border-slate-300 text-primary focus:ring-primary/20" 
                         />
                      </div>
                      <span className="text-sm font-black text-slate-800 uppercase tracking-tight">Vul. Vincular</span>
                      <span className="text-[10px] text-slate-400 font-bold mt-1 uppercase">Sin red de contención familiar</span>
                    </label>

                    <label className="group flex flex-col p-6 bg-slate-50 rounded-3xl border-2 border-transparent hover:bg-white hover:border-primary/20 transition-all cursor-pointer shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                         <FileText className="text-primary" size={24} />
                         <input 
                           type="checkbox" 
                           name="vul_educacion"
                           checked={formData.vul_educacion}
                           onChange={handleInputChange}
                           className="w-5 h-5 rounded-lg border-2 border-slate-300 text-primary focus:ring-primary/20" 
                         />
                      </div>
                      <span className="text-sm font-black text-slate-800 uppercase tracking-tight">Vul. Educativa</span>
                      <span className="text-[10px] text-slate-400 font-bold mt-1 uppercase">Nivel Educativo Incompleto</span>
                    </label>

                    <label className="group flex flex-col p-6 bg-slate-50 rounded-3xl border-2 border-transparent hover:bg-white hover:border-primary/20 transition-all cursor-pointer shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                         <Home className="text-primary" size={24} />
                         <input 
                           type="checkbox" 
                           name="vul_laboral"
                           checked={formData.vul_laboral}
                           onChange={handleInputChange}
                           className="w-5 h-5 rounded-lg border-2 border-slate-300 text-primary focus:ring-primary/20" 
                         />
                      </div>
                      <span className="text-sm font-black text-slate-800 uppercase tracking-tight">Vul. Laboral</span>
                      <span className="text-[10px] text-slate-400 font-bold mt-1 uppercase">Desempleo o Informalidad</span>
                    </label>
                  </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 flex items-center gap-4">
                       <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-primary"><Users size={24} /></div>
                       <div className="flex-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nivel Educativo</p>
                          <select 
                            name="nivel_educativo"
                            value={formData.nivel_educativo}
                            onChange={handleInputChange}
                            disabled={optionsLoading}
                            className="bg-transparent border-none font-bold text-slate-800 w-full focus:ring-0 disabled:opacity-50"
                          >
                             <option value="">Seleccione...</option>
                             {(opciones['nivel_educativo'] || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                       </div>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 flex items-center gap-4">
                       <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-slate-600"><Home size={24} /></div>
                       <div className="flex-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Experiencia Laboral / Oficios</p>
                          <select 
                            name="tipo_oficio"
                            value={formData.tipo_oficio}
                            onChange={handleInputChange}
                            disabled={optionsLoading}
                            className="bg-transparent border-none font-bold text-slate-800 w-full focus:ring-0 disabled:opacity-50"
                          >
                             <option value="">Seleccione...</option>
                             {(opciones['tipo_oficio'] || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                       </div>
                    </div>

                    <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 flex items-center gap-4">
                       <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-primary"><Users size={24} /></div>
                       <div className="flex-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Situación Laboral Actual</p>
                          <select 
                            name="condicion_empleo"
                            value={formData.condicion_empleo}
                            onChange={handleInputChange}
                            disabled={optionsLoading}
                            className="bg-transparent border-none font-bold text-slate-800 w-full focus:ring-0 disabled:opacity-50"
                          >
                             <option value="">Seleccione...</option>
                             {(opciones['condicion_empleo'] || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                       </div>
                    </div>

                    <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 flex items-center gap-4">
                       <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-primary"><FileText size={24} /></div>
                       <div className="flex-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Capacitación / Cursos</p>
                          <input 
                            name="curso_oficio"
                            value={formData.curso_oficio}
                            onChange={handleInputChange}
                            placeholder="Ej: Carpintería, Computación" 
                            className="bg-transparent border-none font-bold text-slate-800 w-full focus:ring-0" 
                          />
                       </div>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Detalle Situación Bio-Psico-Social / Laboral</label>
                    <textarea
                      rows={4}
                      name="obs_oficio"
                      value={formData.obs_oficio}
                      onChange={handleInputChange}
                      placeholder="Información adicional sobre su trayectoria laboral o social..."
                      className="w-full bg-slate-50 border-none rounded-[32px] px-6 py-5 font-medium text-slate-800 focus:ring-4 focus:ring-primary/10 transition-all shadow-inner resize-none"
                    />
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                     <div className="md:col-span-2">
                        <CheckboxGroup 
                          label="Instituciones Pasadas"
                          opciones={opciones['instituciones_pasadas'] || []}
                          valores={formData.instituciones_pasadas}
                          onChange={(nuevos) => setFormData(prev => ({ ...prev, instituciones_pasadas: nuevos }))}
                          disabled={optionsLoading}
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Causas Judiciales (Judicializado)</label>
                        <input
                          name="judicializado"
                          value={formData.judicializado}
                          onChange={handleInputChange}
                          placeholder="¿Posee causas penales o procesos?"
                          className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold text-slate-800 focus:ring-4 focus:ring-primary/10 transition-all shadow-inner"
                        />
                     </div>
                     <div className="space-y-2 md:col-span-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">URL / Link del Informe</label>
                        <input
                          name="url_informe"
                          value={formData.url_informe}
                          onChange={handleInputChange}
                          placeholder="Link a Drive, Dropbox, etc."
                          className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold text-slate-800 focus:ring-4 focus:ring-primary/10 transition-all shadow-inner"
                        />
                     </div>
                  </div>
              </div>
            )}

            {/* TAB: DERIVACION */}
            {activeTab === 'derivacion' && (
              <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
                <div className="p-8 bg-primary/5 rounded-[32px] border border-primary/10 space-y-6">
                  <h4 className="text-[10px] font-black text-primary uppercase tracking-widest">Área de Derivación</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {(opciones['area_derivacion'] || []).map(area => (
                      <button
                        key={area}
                        type="button"
                        className={`p-6 rounded-[28px] border-2 transition-all flex flex-col items-center text-center gap-3 ${
                          formData.obs_direccion.includes(area) // Mocking field as I don't see it in schema
                            ? 'bg-primary border-primary text-white shadow-xl shadow-primary/20'
                            : 'bg-white border-slate-100 text-slate-600 hover:border-primary/30'
                        }`}
                        onClick={() => {
                          const current = formData.obs_direccion || '';
                          const areas = current ? current.split(', ') : [];
                          const newAreas = areas.includes(area) ? areas.filter(a => a !== area) : [...areas, area];
                          setFormData(prev => ({ ...prev, obs_direccion: newAreas.join(', ') }));
                        }}
                      >
                        <span className="material-symbols-outlined text-3xl">
                          {area.includes('Adultos') ? 'elderly' : area.includes('Infancia') ? 'child_care' : area.includes('Discapacidad') ? 'accessible' : 'share'}
                        </span>
                        <span className="text-xs font-black uppercase tracking-tight leading-tight">{area}</span>
                      </button>
                    ))}
                  </div>
                  <div className="p-4 bg-white/50 rounded-2xl border border-primary/10">
                    <p className="text-[10px] text-primary font-bold uppercase tracking-widest mb-1">Nota Técnica</p>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      Seleccione las áreas que requieren intervención inmediata. El sistema notificará automáticamente a los coordinadores correspondientes.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: DOCS */}
            {activeTab === 'docs' && (
              <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
                <div className="flex items-center gap-6 p-8 bg-slate-900 rounded-[32px] text-white">
                  <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center"><FileText size={32} /></div>
                  <div className="flex-1 space-y-1">
                    <h4 className="text-xl font-bold font-headline leading-tight tracking-tight">Situación Documental</h4>
                    <p className="text-white/50 text-xs font-medium">Controle la existencia física de documentación habilitante.</p>
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer bg-white/10 px-5 py-3 rounded-2xl border border-white/10 hover:bg-white/20 transition-all">
                    <span className="text-sm font-bold uppercase tracking-tight">Vulnerabilidad de Identidad (Sin DNI)</span>
                    <input 
                      type="checkbox" 
                      name="vul_identidad"
                      checked={formData.vul_identidad}
                      onChange={handleInputChange}
                      className="w-6 h-6 rounded-lg border-2 border-white/30 bg-transparent text-primary focus:ring-0" 
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="p-6 border-2 border-dashed border-slate-200 rounded-[32px] flex flex-col items-center justify-center text-center space-y-4 hover:border-primary/30 transition-all group">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-all"><FileText size={20} /></div>
                      <div>
                        <h5 className="text-sm font-black text-slate-800 uppercase tracking-tight">Sin Foto de Perfil</h5>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Subir ahora (Opcional)</p>
                      </div>
                   </div>
                   <div className="p-6 border-2 border-dashed border-slate-200 rounded-[32px] flex flex-col items-center justify-center text-center space-y-4">
                      <CheckCircle2 className="text-slate-600 opacity-30" size={32} />
                      <div>
                        <h5 className="text-sm font-black text-slate-800 uppercase tracking-tight">Trámites en Curso</h5>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Registre gestiones de ANSES/DNI</p>
                      </div>
                   </div>
                </div>
              </div>
            )}

          </div>
        </form>
      </div>
    </Layout>
  );
};

export default PSCInterview;

