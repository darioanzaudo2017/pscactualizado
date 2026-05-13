import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  ArrowLeft, 
  Plus,
  Stethoscope,
  Home,
  GraduationCap,
  History,
  X,
  User,
  Briefcase,
  ClipboardList,
  Phone,
  ShieldAlert,
  Edit2
} from 'lucide-react';

interface PSCAdmissionDetailsProps {}

interface Hotel {
  id: string | number;
  nombre: string;
  activo: boolean;
}

const PSCAdmissionDetails: React.FC<PSCAdmissionDetailsProps> = () => {
  const { id, ingresoId } = useParams<{ id: string; ingresoId: string }>();
  const navigate = useNavigate();
  
  // State for data
  const [loading, setLoading] = useState(true);
  const [psc, setPsc] = useState<any>(null);
  const [ingreso, setIngreso] = useState<any>(null);
  const [historial, setHistorial] = useState<any[]>([]);
  const [entrevista, setEntrevista] = useState<any>(null);
  const [hoteles, setHoteles] = useState<Hotel[]>([]);

  // State for modals
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);
  const [isHousingModalOpen, setIsHousingModalOpen] = useState(false);
  const [isEducationModalOpen, setIsEducationModalOpen] = useState(false);
  const [isLaboralModalOpen, setIsLaboralModalOpen] = useState(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [isCasaAbiertaModalOpen, setIsCasaAbiertaModalOpen] = useState(false);
  const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);

  // Edit state
  const [editingInterventionId, setEditingInterventionId] = useState<number | string | null>(null);
  const [editingHistorialId, setEditingHistorialId] = useState<number | string | null>(null);

  // Forms
  const [healthForm, setHealthForm] = useState({
    ficha_medica: false,
    gestion_medicamentos: false,
    turno_clinico: false,
    turno_salud_mental: false,
    turno_tratamiento_consumo: false,
    internacion_clinica: false,
    internacion_salud_mental: false,
    observaciones: ''
  });

  const [housingForm, setHousingForm] = useState({
    hotel: '',
    num_habitacion: '',
    de_donde_viene: '',
    observaciones: ''
  });

  const [educationForm, setEducationForm] = useState({
    cursos_oficio: false,
    terminalidad_educativa: false,
    observaciones: ''
  });

  const [laboralForm, setLaboralForm] = useState({
    confeccion_cv: false,
    servidores_urbanos: false,
    emprendimiento: false,
    art_empleo: false,
    ayuda_economica: false,
    monto: '',
    observaciones: ''
  });

  const [notesForm, setNotesForm] = useState({
    descripcion: ''
  });

  const [casaAbiertaForm, setCasaAbiertaForm] = useState({
    observacion: ''
  });

  const [finalizeForm, setFinalizeForm] = useState({
    fecha: new Date().toISOString().split('T')[0],
    motivo: '',
    gravedad_expulsion: 'No corresponde',
    ayuda_economica: 'No',
    monto: '',
    observaciones: ''
  });

  const openModalForNew = (modalName: 'salud' | 'hospedaje' | 'educacion' | 'laboral' | 'notas' | 'casa_abierta') => {
    setEditingInterventionId(null);
    setEditingHistorialId(null);
    switch (modalName) {
      case 'salud':
        setHealthForm({ ficha_medica: false, gestion_medicamentos: false, turno_clinico: false, turno_salud_mental: false, turno_tratamiento_consumo: false, internacion_clinica: false, internacion_salud_mental: false, observaciones: '' });
        setIsHealthModalOpen(true);
        break;
      case 'hospedaje':
        setHousingForm({ 
          hotel: entrevista?.hotel || '', 
          num_habitacion: '', 
          de_donde_viene: 'Operativo', 
          observaciones: '' 
        });
        setIsHousingModalOpen(true);
        break;
      case 'educacion':
        setEducationForm({ cursos_oficio: false, terminalidad_educativa: false, observaciones: '' });
        setIsEducationModalOpen(true);
        break;
      case 'laboral':
        setLaboralForm({ confeccion_cv: false, servidores_urbanos: false, emprendimiento: false, art_empleo: false, ayuda_economica: false, monto: '', observaciones: '' });
        setIsLaboralModalOpen(true);
        break;
      case 'notas':
        setNotesForm({ descripcion: '' });
        setIsNotesModalOpen(true);
        break;
      case 'casa_abierta':
        setCasaAbiertaForm({ observacion: '' });
        setIsCasaAbiertaModalOpen(true);
        break;
    }
  };

  const handleFinalizeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!id || !ingresoId) return;

      // 1. Insert into t_finalizacion
      const { error: finalizeError } = await supabase
        .from('t_finalizacion')
        .insert({
          id_psc: id,
          id_ingreso: ingresoId,
          fecha: finalizeForm.fecha,
          motivo: finalizeForm.motivo,
          gravedad_expulsion: finalizeForm.motivo === 'Expulsion' ? finalizeForm.gravedad_expulsion : 'No corresponde',
          ayuda_economica: finalizeForm.ayuda_economica,
          monto: finalizeForm.ayuda_economica === 'Si' ? Number(finalizeForm.monto) : null,
          observaciones: finalizeForm.observaciones
        });

      if (finalizeError) throw finalizeError;

      // 2. Update t_ingresos
      const { error: ingresoError } = await supabase
        .from('t_ingresos')
        .update({
          finalizado: true,
          fecha_finalizacion: finalizeForm.fecha,
          motivo_final: finalizeForm.motivo,
          gravedad: finalizeForm.motivo === 'Expulsion' ? finalizeForm.gravedad_expulsion : null
        })
        .eq('id', ingresoId);

      if (ingresoError) throw ingresoError;

      // 3. Update t_psc
      const pscUpdate: any = { activo: false };
      if (finalizeForm.motivo === 'Expulsion') {
        pscUpdate.expulsado = true;
        pscUpdate.gravedad_expulsion = finalizeForm.gravedad_expulsion;
      }
      
      const { error: pscError } = await supabase
        .from('t_psc')
        .update(pscUpdate)
        .eq('id', id);

      if (pscError) throw pscError;

      // 4. Save to history
      await saveToHistory(`Programa Finalizado: ${finalizeForm.motivo}. ${finalizeForm.observaciones}`);

      setIsFinalizeModalOpen(false);
      navigate('/psc');
      
    } catch (error) {
      console.error('Error al finalizar programa:', error);
      alert('Error al finalizar programa');
    }
  };

  const handleEditIntervention = async (evento: any) => {
    setEditingHistorialId(evento.id);
    if (evento.id_salud) {
      const { data } = await supabase.from('t_salud').select('*').eq('id', evento.id_salud).single();
      if (data) {
        const { id, created_at, created_by, id_psc, id_ingreso, fecha, ...rest } = data;
        setHealthForm({ ...healthForm, ...rest });
        setEditingInterventionId(evento.id_salud);
        setIsHealthModalOpen(true);
      }
    } else if (evento.id_hospedaje) {
      const { data } = await supabase.from('t_hospedaje').select('*').eq('id', evento.id_hospedaje).single();
      if (data) {
        const { id, created_at, created_by, id_psc, id_ingreso, fecha_ingreso, fecha_egreso, ...rest } = data;
        setHousingForm({ ...housingForm, ...rest });
        setEditingInterventionId(evento.id_hospedaje);
        setIsHousingModalOpen(true);
      }
    } else if (evento.id_educacion) {
      const { data } = await supabase.from('t_educacion').select('*').eq('id', evento.id_educacion).single();
      if (data) {
        const { id, created_at, created_by, id_psc, id_ingreso, fecha, ...rest } = data;
        setEducationForm({ ...educationForm, ...rest });
        setEditingInterventionId(evento.id_educacion);
        setIsEducationModalOpen(true);
      }
    } else if (evento.id_laboral) {
      const { data } = await supabase.from('t_laboral').select('*').eq('id', evento.id_laboral).single();
      if (data) {
        const { id, created_at, created_by, id_psc, id_ingreso, fecha, ...rest } = data;
        setLaboralForm({ ...laboralForm, ...rest });
        setEditingInterventionId(evento.id_laboral);
        setIsLaboralModalOpen(true);
      }
    } else if (evento.id_casa_abierta) {
      const { data } = await supabase.from('t_casaabierta').select('*').eq('id', evento.id_casa_abierta).single();
      if (data) {
        const { id, created_at, created_by, id_psc, id_ingreso, fecha, ...rest } = data;
        setCasaAbiertaForm({ ...casaAbiertaForm, ...rest });
        setEditingInterventionId(evento.id_casa_abierta);
        setIsCasaAbiertaModalOpen(true);
      }
    } else {
      setNotesForm({ descripcion: evento.descripcion });
      setEditingInterventionId(null);
      setIsNotesModalOpen(true);
    }
  };

  useEffect(() => {
    if (id && ingresoId && ingresoId !== 'undefined') {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [id, ingresoId]);

  const fetchData = async () => {
    if (!id || !ingresoId || ingresoId === 'undefined') return;
    
    try {
      setLoading(true);
      
      // 1. Datos del PSC (v2)
      const { data: pscData } = await supabase
        .from('t_psc')
        .select('*')
        .eq('id', id)
        .single();
      
      setPsc(pscData);

      // 2. Datos del Ingreso (v2)
      const { data: ingresoData } = await supabase
        .from('t_ingresos')
        .select('*')
        .eq('id', ingresoId)
        .single();
      
      setIngreso(ingresoData);

      // 3. Historial del ingreso (v2)
      const { data: historialData } = await supabase
        .from('t_historial')
        .select('*')
        .eq('id_ingreso', ingresoId)
        .order('created_at', { ascending: false });
      
      setHistorial(historialData || []);

      // 4. Datos de la Entrevista (v2)
      const { data: entrevistaData } = await supabase
        .from('t_entrevista')
        .select('*')
        .eq('id_ingreso', ingresoId)
        .maybeSingle();
      
      setEntrevista(entrevistaData);
      
      // 5. Lista de Hoteles activos
      const { data: hotelsData } = await supabase
        .from('t_hoteles')
        .select('*')
        .eq('activo', true)
        .order('nombre', { ascending: true });
      
      setHoteles(hotelsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveToHistory = async (descripcion: string, extraFields: any = {}) => {
    const { error } = await supabase
      .from('t_historial')
      .insert({
        id_psc: id,
        id_ingreso: ingresoId,
        fecha: new Date().toISOString().split('T')[0],
        descripcion,
        ...extraFields
      });
    if (error) throw error;
  };

  const handleHealthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingInterventionId) {
        const { error } = await supabase
          .from('t_salud')
          .update({ ...healthForm })
          .eq('id', editingInterventionId);
        if (error) throw error;
      } else {
        const { data: healthData, error } = await supabase
          .from('t_salud')
          .insert({
            id_psc: id,
            id_ingreso: ingresoId,
            ...healthForm,
            fecha: new Date().toISOString().split('T')[0]
          })
          .select()
          .single();

        if (error) throw error;
        await saveToHistory('Atención de Salud registrada', { id_salud: healthData.id });
      }

      setIsHealthModalOpen(false);
      setHealthForm({ 
        ficha_medica: false,
        gestion_medicamentos: false,
        turno_clinico: false,
        turno_salud_mental: false,
        turno_tratamiento_consumo: false,
        internacion_clinica: false,
        internacion_salud_mental: false,
        observaciones: '' 
      });
      fetchData();
    } catch (error) {
      console.error(error);
      alert('Error al guardar salud');
    }
  };

  const handleHousingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingInterventionId) {
        const { error } = await supabase
          .from('t_hospedaje')
          .update({
            hotel: housingForm.hotel,
            num_habitacion: housingForm.num_habitacion,
            de_donde_viene: housingForm.de_donde_viene,
            observaciones: housingForm.observaciones
          })
          .eq('id', editingInterventionId);
        if (error) throw error;
      } else {
        const { data: housingData, error } = await supabase
          .from('t_hospedaje')
          .insert({
            id_psc: id,
            id_ingreso: ingresoId,
            hotel: housingForm.hotel,
            num_habitacion: housingForm.num_habitacion,
            de_donde_viene: housingForm.de_donde_viene,
            observaciones: housingForm.observaciones,
            fecha_ingreso: new Date().toISOString().split('T')[0]
          })
          .select()
          .single();

        if (error) throw error;
        await saveToHistory('Asignación de Alojamiento', { id_hospedaje: housingData.id });
      }

      setIsHousingModalOpen(false);
      setHousingForm({ hotel: '', num_habitacion: '', de_donde_viene: '', observaciones: '' });
      fetchData();
    } catch (error) {
      console.error(error);
      alert('Error al guardar alojamiento');
    }
  };

  const handleEducationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingInterventionId) {
        const { error } = await supabase
          .from('t_educacion')
          .update({
            cursos_oficio: educationForm.cursos_oficio,
            terminalidad_educativa: educationForm.terminalidad_educativa,
            observaciones: educationForm.observaciones
          })
          .eq('id', editingInterventionId);
        if (error) throw error;
      } else {
        const { data: eduData, error } = await supabase
          .from('t_educacion')
          .insert({
            id_psc: id,
            id_ingreso: ingresoId,
            cursos_oficio: educationForm.cursos_oficio,
            terminalidad_educativa: educationForm.terminalidad_educativa,
            observaciones: educationForm.observaciones,
            fecha: new Date().toISOString().split('T')[0]
          })
          .select()
          .single();

        if (error) throw error;
        await saveToHistory('Intervención Educativa', { id_educacion: eduData.id });
      }

      setIsEducationModalOpen(false);
      setEducationForm({ cursos_oficio: false, terminalidad_educativa: false, observaciones: '' });
      fetchData();
    } catch (error) {
      console.error(error);
      alert('Error al guardar educación');
    }
  };

  const handleLaboralSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingInterventionId) {
        const { error } = await supabase
          .from('t_laboral')
          .update({
            ...laboralForm,
            monto: laboralForm.ayuda_economica ? Number(laboralForm.monto) : null
          })
          .eq('id', editingInterventionId);
        if (error) throw error;
      } else {
        const { data: laboralData, error } = await supabase
          .from('t_laboral')
          .insert({
            id_psc: id,
            id_ingreso: ingresoId,
            ...laboralForm,
            monto: laboralForm.ayuda_economica ? Number(laboralForm.monto) : null,
            fecha: new Date().toISOString().split('T')[0]
          })
          .select()
          .single();

        if (error) throw error;
        await saveToHistory('Intervención Laboral', { id_laboral: laboralData.id });
      }

      setIsLaboralModalOpen(false);
      setLaboralForm({ confeccion_cv: false, servidores_urbanos: false, emprendimiento: false, art_empleo: false, ayuda_economica: false, monto: '', observaciones: '' });
      fetchData();
    } catch (error) {
      console.error(error);
      alert('Error al guardar laboral');
    }
  };

  const handleNotesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingHistorialId && !editingInterventionId) {
        const { error } = await supabase
          .from('t_historial')
          .update({ descripcion: notesForm.descripcion })
          .eq('id', editingHistorialId);
        if (error) throw error;
      } else {
        await saveToHistory(notesForm.descripcion);
      }
      setIsNotesModalOpen(false);
      setNotesForm({ descripcion: '' });
      fetchData();
    } catch (error) {
      console.error(error);
      alert('Error al guardar nota');
    }
  };

  const handleCasaAbiertaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingInterventionId) {
        const { error } = await supabase
          .from('t_casaabierta')
          .update({
            observacion: casaAbiertaForm.observacion
          })
          .eq('id', editingInterventionId);
        if (error) throw error;
      } else {
        const { data: caData, error } = await supabase
          .from('t_casaabierta')
          .insert({
            id_psc: id,
            id_ingreso: ingresoId,
            observacion: casaAbiertaForm.observacion,
            fecha: new Date().toISOString().split('T')[0]
          })
          .select()
          .single();
        
        if (error) throw error;

        await saveToHistory('Ingreso a Casa Abierta', { id_casa_abierta: caData.id });
      }
      setIsCasaAbiertaModalOpen(false);
      setCasaAbiertaForm({ observacion: '' });
      fetchData();
    } catch (error) {
      console.error(error);
      alert('Error al guardar Casa Abierta');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-[#f8fbff]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0061a4]"></div>
    </div>
  );

  if (!ingresoId || ingresoId === 'undefined') return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#f8fbff] p-8 text-center">
      <div className="bg-white p-8 rounded-[32px] shadow-sm border border-[#e1e2e5] max-w-md">
        <ShieldAlert className="w-12 h-12 text-[#ba1a1a] mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Ingreso No Encontrado</h2>
        <Link to={`/psc/${id}`} className="mt-4 inline-block px-6 py-3 bg-[#0061a4] text-white font-bold rounded-xl">Volver</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fbff] text-[#1a1c1e] font-['Inter']">
      {/* Modals placeholders */}
      {isHealthModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] w-full max-w-lg p-8 shadow-2xl">
            <div className="flex justify-between mb-6">
              <h2 className="text-xl font-bold font-['Manrope']">Salud</h2>
              <button onClick={() => setIsHealthModalOpen(false)}><X/></button>
            </div>
            <form onSubmit={handleHealthSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {Object.keys(healthForm).filter(k => k !== 'observaciones').map(k => (
                  <label key={k} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-xl">
                    <input type="checkbox" checked={(healthForm as any)[k]} onChange={e => setHealthForm({...healthForm, [k]: e.target.checked})} />
                    <span className="text-[10px] uppercase">{k.replace(/_/g, ' ')}</span>
                  </label>
                ))}
              </div>
              <textarea className="w-full bg-gray-50 p-4 rounded-2xl h-24 text-xs" placeholder="Observaciones" value={healthForm.observaciones} onChange={e => setHealthForm({...healthForm, observaciones: e.target.value})} />
              <button type="submit" className="w-full py-4 bg-[#0061a4] text-white rounded-2xl font-bold">Guardar</button>
            </form>
          </div>
        </div>
      )}

      {isHousingModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] w-full max-w-lg p-8 shadow-2xl">
            <div className="flex justify-between mb-6">
              <h2 className="text-xl font-bold font-['Manrope']">Alojamiento (Hospedaje)</h2>
              <button onClick={() => setIsHousingModalOpen(false)}><X/></button>
            </div>
            <form onSubmit={handleHousingSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Seleccionar Hotel</label>
                <select 
                  className="w-full bg-gray-50 p-4 rounded-2xl text-sm font-bold border-none focus:ring-2 focus:ring-green-500/20 transition-all" 
                  value={housingForm.hotel} 
                  onChange={e => setHousingForm({...housingForm, hotel: e.target.value})}
                  required
                >
                  <option value="">-- Seleccione Hotel --</option>
                  {hoteles.map(h => (
                    <option key={h.id} value={h.nombre}>{h.nombre}</option>
                  ))}
                  <option value="OTRO">Otro / No listado</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input className="bg-gray-50 p-4 rounded-2xl text-sm" placeholder="Habitación" value={housingForm.num_habitacion} onChange={e => setHousingForm({...housingForm, num_habitacion: e.target.value})} />
                <input className="bg-gray-50 p-4 rounded-2xl text-sm" placeholder="Procedencia" value={housingForm.de_donde_viene} onChange={e => setHousingForm({...housingForm, de_donde_viene: e.target.value})} />
              </div>
              <textarea className="w-full bg-gray-50 p-4 rounded-2xl h-24 text-xs" placeholder="Observaciones" value={housingForm.observaciones} onChange={e => setHousingForm({...housingForm, observaciones: e.target.value})} />
              <button type="submit" className="w-full py-4 bg-green-600 text-white rounded-2xl font-bold">Asignar Hotel</button>
            </form>
          </div>
        </div>
      )}

      {isEducationModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] w-full max-w-lg p-8 shadow-2xl">
            <div className="flex justify-between mb-6">
              <h2 className="text-xl font-bold font-['Manrope']">Educación / Oficios</h2>
              <button onClick={() => setIsEducationModalOpen(false)}><X/></button>
            </div>
            <form onSubmit={handleEducationSubmit} className="space-y-4">
              <label className="flex items-center space-x-3 p-4 bg-gray-50 rounded-2xl">
                <input type="checkbox" checked={educationForm.cursos_oficio} onChange={e => setEducationForm({...educationForm, cursos_oficio: e.target.checked})} />
                <span className="text-sm font-bold">Cursos de Oficio</span>
              </label>
              <label className="flex items-center space-x-3 p-4 bg-gray-50 rounded-2xl">
                <input type="checkbox" checked={educationForm.terminalidad_educativa} onChange={e => setEducationForm({...educationForm, terminalidad_educativa: e.target.checked})} />
                <span className="text-sm font-bold">Terminalidad Educativa</span>
              </label>
              <textarea className="w-full bg-gray-50 p-4 rounded-2xl h-24 text-xs" placeholder="Observaciones" value={educationForm.observaciones} onChange={e => setEducationForm({...educationForm, observaciones: e.target.value})} />
              <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold">Guardar Intervención</button>
            </form>
          </div>
        </div>
      )}

      {isLaboralModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] w-full max-w-lg p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between mb-6">
              <h2 className="text-xl font-bold font-['Manrope']">Laboral</h2>
              <button onClick={() => setIsLaboralModalOpen(false)}><X/></button>
            </div>
            <form onSubmit={handleLaboralSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center space-x-2 p-2 bg-gray-50 rounded-xl">
                  <input type="checkbox" checked={laboralForm.confeccion_cv} onChange={e => setLaboralForm({...laboralForm, confeccion_cv: e.target.checked})} />
                  <span className="text-[10px] uppercase">Confección CV</span>
                </label>
                <label className="flex items-center space-x-2 p-2 bg-gray-50 rounded-xl">
                  <input type="checkbox" checked={laboralForm.servidores_urbanos} onChange={e => setLaboralForm({...laboralForm, servidores_urbanos: e.target.checked})} />
                  <span className="text-[10px] uppercase">Serv. Urbanos</span>
                </label>
                <label className="flex items-center space-x-2 p-2 bg-gray-50 rounded-xl">
                  <input type="checkbox" checked={laboralForm.emprendimiento} onChange={e => setLaboralForm({...laboralForm, emprendimiento: e.target.checked})} />
                  <span className="text-[10px] uppercase">Emprendimiento</span>
                </label>
                <label className="flex items-center space-x-2 p-2 bg-gray-50 rounded-xl">
                  <input type="checkbox" checked={laboralForm.art_empleo} onChange={e => setLaboralForm({...laboralForm, art_empleo: e.target.checked})} />
                  <span className="text-[10px] uppercase">Art. Empleo</span>
                </label>
                <label className="col-span-2 flex items-center space-x-2 p-2 bg-gray-50 rounded-xl">
                  <input type="checkbox" checked={laboralForm.ayuda_economica} onChange={e => setLaboralForm({...laboralForm, ayuda_economica: e.target.checked})} />
                  <span className="text-[10px] uppercase">Ayuda Económica</span>
                </label>
              </div>
              {laboralForm.ayuda_economica && (
                <input 
                  type="number"
                  className="w-full bg-gray-50 p-4 rounded-2xl text-sm" 
                  placeholder="Monto de la ayuda" 
                  value={laboralForm.monto} 
                  onChange={e => setLaboralForm({...laboralForm, monto: e.target.value})} 
                  required
                />
              )}
              <textarea className="w-full bg-gray-50 p-4 rounded-2xl h-24 text-xs" placeholder="Observaciones" value={laboralForm.observaciones} onChange={e => setLaboralForm({...laboralForm, observaciones: e.target.value})} />
              <button type="submit" className="w-full py-4 bg-orange-600 text-white rounded-2xl font-bold">Guardar Intervención</button>
            </form>
          </div>
        </div>
      )}

      {isNotesModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] w-full max-w-lg p-8 shadow-2xl">
            <div className="flex justify-between mb-6">
              <h2 className="text-xl font-bold font-['Manrope']">Agregar Nota</h2>
              <button onClick={() => setIsNotesModalOpen(false)}><X/></button>
            </div>
            <form onSubmit={handleNotesSubmit} className="space-y-4">
              <textarea className="w-full bg-gray-50 p-4 rounded-2xl h-32 text-sm" placeholder="Descripción de la nota" value={notesForm.descripcion} onChange={e => setNotesForm({...notesForm, descripcion: e.target.value})} required />
              <button type="submit" className="w-full py-4 bg-gray-800 text-white rounded-2xl font-bold">Guardar Nota</button>
            </form>
          </div>
        </div>
      )}

      {isCasaAbiertaModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] w-full max-w-lg p-8 shadow-2xl">
            <div className="flex justify-between mb-6">
              <h2 className="text-xl font-bold font-['Manrope']">Casa Abierta</h2>
              <button onClick={() => setIsCasaAbiertaModalOpen(false)}><X/></button>
            </div>
            <form onSubmit={handleCasaAbiertaSubmit} className="space-y-4">
              <textarea className="w-full bg-gray-50 p-4 rounded-2xl h-24 text-sm" placeholder="Observaciones (opcional)" value={casaAbiertaForm.observacion} onChange={e => setCasaAbiertaForm({...casaAbiertaForm, observacion: e.target.value})} />
              <button type="submit" className="w-full py-4 bg-teal-600 text-white rounded-2xl font-bold">Registrar Ingreso</button>
            </form>
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div className="max-w-[1600px] mx-auto px-4 lg:px-8 py-6">
        
        {/* Top Navigation & Status */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <Link to={`/psc/${id}`} className="p-3 bg-white rounded-2xl border border-gray-200 hover:border-[#0061a4] transition-all">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-black font-['Manrope'] tracking-tight text-[#001d36]">Detalle del Ingreso</h1>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${ingreso?.finalizado ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                  {ingreso?.finalizado ? 'Finalizado' : 'Ingreso Activo'}
                </span>
                <span className="text-gray-400 text-[10px] uppercase font-bold">• V2 Schema</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button className="flex items-center space-x-2 px-5 py-3 bg-white text-gray-700 rounded-2xl font-bold text-sm shadow-sm border border-gray-200">
              <ClipboardList className="w-4 h-4" />
              <span>Reporte</span>
            </button>
            {!ingreso?.finalizado && (
              <button 
                onClick={() => setIsFinalizeModalOpen(true)}
                className="flex items-center space-x-2 px-6 py-3 bg-red-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all uppercase tracking-widest"
              >
                <X className="w-4 h-4" />
                <span>Finalizar</span>
              </button>
            )}
            <button className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#0061a4] to-[#004e84] text-white rounded-2xl font-bold text-sm shadow-lg shadow-[#0061a4]/20">
              <Plus className="w-4 h-4" />
              <span>Nueva Etapa</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          
          {/* PROFILE SIDEBAR */}
          <div className="col-span-12 lg:col-span-3 space-y-6">
            <div className="premium-card overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-[#0061a4] to-[#004e84]" />
              <div className="relative pt-12 flex flex-col items-center">
                <div className="w-32 h-32 rounded-[28px] bg-white p-1.5 shadow-xl mb-4 relative group cursor-pointer">
                  <div className="w-full h-full rounded-[22px] bg-[#f0f4f8] flex items-center justify-center border-2 border-dashed border-gray-200 group-hover:border-[#0061a4] transition-all">
                    {psc?.foto_dni_frente ? (
                      <img src={psc.foto_dni_frente} className="w-full h-full rounded-[22px] object-cover" />
                    ) : (
                      <User className="w-12 h-12 text-gray-300" />
                    )}
                  </div>
                </div>
                <h2 className="text-xl font-bold font-['Manrope'] text-center flex items-center justify-center gap-2">
                  {psc?.nombre} {psc?.apellido}
                </h2>
                <div className="flex gap-2 mt-2">
                  <button 
                    onClick={() => navigate(`/psc/edit/${id}`)}
                    className="flex items-center space-x-2 px-4 py-2 bg-[#0061a4] text-white rounded-xl text-xs font-bold shadow-sm"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>EDITAR DATOS</span>
                  </button>
                </div>
                <p className="text-sm text-gray-500 font-medium tracking-tight">DNI: {psc?.dni || 'N/A'}</p>
                
                <div className="w-full grid grid-cols-3 gap-2 mt-6">
                  <div className="bg-[#f8fbff] p-3 rounded-2xl text-center">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Edad</p>
                    <p className="text-sm font-bold">{psc?.fecha_nacimiento ? (new Date().getFullYear() - new Date(psc.fecha_nacimiento).getFullYear()) : '--'}</p>
                  </div>
                  <div className="bg-[#f8fbff] p-3 rounded-2xl text-center">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Sangre</p>
                    <p className="text-sm font-bold">{psc?.grupo_sanguineo || '?'}</p>
                  </div>
                  <div className="bg-[#f8fbff] p-3 rounded-2xl text-center">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Nac.</p>
                    <p className="text-sm font-bold">AR</p>
                  </div>
                </div>

                <div className="w-full mt-6 space-y-3">
                  <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-2xl">
                    <Phone className="w-4 h-4 text-[#0061a4]" />
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Contacto Emergencia</p>
                      <p className="text-xs font-bold">{psc?.contacto_emergencia || 'No registrado'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="premium-card">
              <h3 className="text-sm font-black font-['Manrope'] mb-4 uppercase tracking-wider text-gray-400">Estadísticas Ingreso</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Días en calle</span>
                  <span className="text-sm font-black text-red-600">{entrevista?.dias_sit_calle || '0'} días</span>
                </div>
                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-red-500 h-full w-[65%]" />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Nivel de Riesgo</span>
                  <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded-lg text-[10px] font-bold uppercase tracking-widest">Moderado</span>
                </div>
              </div>
            </div>
          </div>

          {/* MAIN CONTENT AREA */}
          <div className="col-span-12 lg:col-span-6 space-y-8">
            
            {/* Situation Bento Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-[#0061a4] to-[#004e84] p-6 rounded-[32px] text-white shadow-xl shadow-[#0061a4]/20 relative overflow-hidden group">
                <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-blue-100 mb-1">Motivo Atención</h3>
                <p className="text-lg font-black leading-tight tracking-tight">
                  {Array.isArray(entrevista?.motivo_atencion) 
                    ? entrevista.motivo_atencion[0] 
                    : (entrevista?.motivo_atencion || 'Sin especificar')}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase bg-white/20 px-2 py-1 rounded-lg">Entrevista V2</span>
                  <button 
                    onClick={() => navigate(`/psc/${id}/ingreso/${ingresoId}/entrevista`)}
                    className="p-2 bg-white/10 hover:bg-white/30 rounded-xl transition-all"
                    title="Editar entrevista"
                  >
                    <Edit2 className="w-3 h-3 text-white" />
                  </button>
                </div>
              </div>
              <div className="premium-card flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Causa Situación Calle</h3>
                  <p className="text-lg font-black text-gray-800 tracking-tight">
                    {Array.isArray(entrevista?.causa_situacion_calle) 
                      ? entrevista.causa_situacion_calle.join(', ') 
                      : (entrevista?.causa_situacion_calle || 'No registrada')}
                  </p>
                  <div className="mt-4 pt-4 border-t border-gray-50">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Judicializado</h3>
                    <p className="text-sm font-bold text-gray-700">{entrevista?.judicializado || 'No'}</p>
                  </div>
                </div>
                <button className="text-[10px] font-bold text-[#0061a4] uppercase tracking-widest flex items-center mt-4">
                  <span>Ver Detalle</span>
                  <Plus className="w-3 h-3 ml-1" />
                </button>
              </div>
            </div>

            {/* BENTO GRID: INTERVENTIONS */}
            <div>
              <h3 className="text-sm font-black font-['Manrope'] mb-4 uppercase tracking-wider text-gray-400 px-2">Registrar Intervención</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <button 
                  onClick={() => openModalForNew('salud')}
                  className="premium-card flex flex-col items-center hover:border-red-400/50 transition-all group"
                >
                  <div className="p-3 bg-red-50 text-red-600 rounded-2xl group-hover:bg-red-600 group-hover:text-white transition-all mb-4">
                    <Stethoscope className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest text-gray-800">Salud</span>
                </button>

                <button 
                  onClick={() => openModalForNew('hospedaje')}
                  className="premium-card flex flex-col items-center hover:border-green-400/50 transition-all group"
                >
                  <div className="p-3 bg-green-50 text-green-600 rounded-2xl group-hover:bg-green-600 group-hover:text-white transition-all mb-4">
                    <Home className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest text-gray-800">Hospedaje</span>
                </button>

                <button 
                  onClick={() => openModalForNew('educacion')}
                  className="premium-card flex flex-col items-center hover:border-blue-400/50 transition-all group"
                >
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all mb-4">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest text-gray-800">Educación</span>
                </button>

                <button 
                  onClick={() => openModalForNew('laboral')}
                  className="premium-card flex flex-col items-center hover:border-orange-400/50 transition-all group">
                  <div className="p-3 bg-orange-50 text-orange-600 rounded-2xl group-hover:bg-orange-600 group-hover:text-white transition-all mb-4">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest text-gray-800">Laboral</span>
                </button>

                <button 
                  onClick={() => openModalForNew('notas')}
                  className="premium-card flex flex-col items-center hover:border-gray-400/50 transition-all group"
                >
                  <div className="p-3 bg-gray-50 text-gray-600 rounded-2xl group-hover:bg-gray-600 group-hover:text-white transition-all mb-4">
                    <ClipboardList className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest text-gray-800">Notas</span>
                </button>

                <button 
                  onClick={() => openModalForNew('casa_abierta')}
                  className="premium-card flex flex-col items-center hover:border-teal-400/50 transition-all group"
                >
                  <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl group-hover:bg-teal-600 group-hover:text-white transition-all mb-4">
                    <Home className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest text-gray-800">Casa Ab.</span>
                </button>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => setIsFinalizeModalOpen(true)}
                  className="px-6 py-3 bg-red-50 text-red-600 rounded-2xl text-sm font-bold hover:bg-red-100 transition-colors border border-red-100 flex items-center gap-2 shadow-sm uppercase tracking-widest"
                >
                  Finalizar Programa
                </button>
              </div>
            </div>

            {/* HISTORY TIMELINE */}
            <div className="premium-card !rounded-[40px] !p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                  <History className="w-6 h-6 text-[#0061a4]" />
                   <h2 className="text-xl font-bold font-['Manrope']">Historial del Ingreso</h2>
                </div>
                <span className="bg-[#f0f4f8] text-[#0061a4] text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-tighter">
                  {historial.length} Eventos
                </span>
              </div>
              
              <div className="space-y-8 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-0.5 before:bg-[#f1f3f4]">
                {historial.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 italic">No hay registros</div>
                ) : historial.map((evento) => (
                  <div key={evento.id} className="relative pl-12">
                    <div className="absolute left-0 top-1 w-9 h-9 bg-white border-2 border-gray-100 rounded-full flex items-center justify-center z-10 shadow-sm">
                      <div className={`w-3 h-3 rounded-full ${
                        evento.id_salud ? 'bg-red-500' : 
                        evento.id_hospedaje ? 'bg-green-500' :
                        evento.id_educacion ? 'bg-blue-500' : 
                        evento.id_laboral ? 'bg-orange-500' :
                        evento.id_casa_abierta ? 'bg-teal-500' :
                        'bg-gray-500'
                      }`} />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                           {evento.id_salud ? 'Intervención Salud' : 
                            evento.id_hospedaje ? 'Hospedaje' : 
                            evento.id_educacion ? 'Educación' : 
                            evento.id_laboral ? 'Laboral' :
                            evento.id_casa_abierta ? 'Casa Abierta' :
                            'Sistema'}
                        </h4>
                        <div className="flex items-center space-x-3">
                          <button 
                            onClick={() => handleEditIntervention(evento)}
                            className="bg-white border-2 border-gray-100 p-1.5 rounded-full hover:bg-gray-50 transition-colors shadow-sm"
                            title="Editar Intervención"
                          >
                            <Edit2 className="w-3 h-3 text-gray-500" />
                          </button>
                          <span className="text-[10px] text-gray-400 font-bold">{new Date(evento.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-gray-800 leading-relaxed">{evento.descripcion}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR (SITUATION SUMMARY) */}
          <div className="col-span-12 lg:col-span-3 space-y-6">
            <div className="premium-card border-l-4 border-l-red-500">
              <div className="flex items-center space-x-2 mb-6">
                <ShieldAlert className="w-4 h-4 text-red-600" />
                <h3 className="text-sm font-black font-['Manrope'] uppercase tracking-wider text-gray-800">Vulneraciones</h3>
              </div>
              
              <div className="space-y-4">
                {[
                  { label: 'Consumo', checked: !!entrevista?.tiempo_consumo, color: 'bg-red-500' },
                  { label: 'Vincular', checked: entrevista?.vul_vincular, color: 'bg-orange-500' },
                  { label: 'Salud', checked: entrevista?.vul_salud, color: 'bg-blue-500' },
                  { label: 'Educación', checked: entrevista?.vul_educacion, color: 'bg-purple-500' },
                  { label: 'Identidad', checked: entrevista?.vul_identidad, color: 'bg-green-500' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
                    <span className="text-xs font-bold text-gray-600">{item.label}</span>
                    <div className={`w-10 h-5 rounded-full relative transition-all ${item.checked ? item.color : 'bg-gray-200'}`}>
                      <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${item.checked ? 'left-6' : 'left-1'}`} />
                    </div>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => navigate(`/psc/${id}/ingreso/${ingresoId}/entrevista`)}
                className="w-full mt-6 py-4 bg-gray-100 text-[#0061a4] font-bold text-xs uppercase tracking-widest rounded-2xl hover:bg-[#0061a4] hover:text-white transition-all flex items-center justify-center space-x-2 border border-[#0061a4]/10"
              >
                <Edit2 className="w-3 h-3" />
                <span>Actualizar Ficha Social</span>
              </button>
            </div>

            <div className="premium-card border-l-4 border-l-orange-500">
              <h3 className="text-sm font-black font-['Manrope'] mb-4 uppercase tracking-wider text-gray-400">Observaciones Técnicas</h3>
              <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
                <p className="text-xs text-orange-800 leading-relaxed font-medium">
                  {entrevista?.comentarios_lugar_origen || 'No hay notas técnicas registradas para este relevamiento.'}
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
      {/* MODAL FINALIZACION */}
      {isFinalizeModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-xl shadow-2xl overflow-hidden border border-white/20 animate-in fade-in zoom-in duration-300">
            <div className="p-8 border-b border-gray-100 bg-gradient-to-r from-red-50 to-white flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-gray-800 tracking-tight">FINALIZAR PROGRAMA</h2>
                <p className="text-gray-500 text-sm font-medium">Complete los detalles para cerrar el seguimiento</p>
              </div>
              <button 
                onClick={() => setIsFinalizeModalOpen(false)}
                className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-400 hover:text-gray-600 hover:shadow-md transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleFinalizeSubmit} className="p-8 space-y-6 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Fecha Finalización</label>
                  <input
                    type="date"
                    required
                    value={finalizeForm.fecha}
                    onChange={(e) => setFinalizeForm({ ...finalizeForm, fecha: e.target.value })}
                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-gray-700 focus:ring-2 focus:ring-red-500/20 transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Motivo</label>
                  <select
                    required
                    value={finalizeForm.motivo}
                    onChange={(e) => setFinalizeForm({ ...finalizeForm, motivo: e.target.value })}
                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-gray-700 focus:ring-2 focus:ring-red-500/20 transition-all font-medium"
                  >
                    <option value="">Seleccione motivo...</option>
                    <option value="Finalización">Finalización Exitosa</option>
                    <option value="Expulsion">Expulsión</option>
                    <option value="Derivación">Derivación</option>
                    <option value="Abandono">Abandono / No asiste</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
              </div>

              {finalizeForm.motivo === 'Expulsion' && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Gravedad de expulsión</label>
                  <select
                    required
                    value={finalizeForm.gravedad_expulsion}
                    onChange={(e) => setFinalizeForm({ ...finalizeForm, gravedad_expulsion: e.target.value })}
                    className="w-full bg-red-50 border-none rounded-2xl px-5 py-4 text-red-700 focus:ring-2 focus:ring-red-500/20 transition-all font-bold"
                  >
                    <option value="No corresponde">No corresponde</option>
                    <option value="Leve">Leve</option>
                    <option value="Moderada">Moderada</option>
                    <option value="Grave">Grave</option>
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-50">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">¿Recibe ayuda económica?</label>
                  <select
                    value={finalizeForm.ayuda_economica}
                    onChange={(e) => setFinalizeForm({ ...finalizeForm, ayuda_economica: e.target.value })}
                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-gray-700 focus:ring-2 focus:ring-red-500/20 transition-all font-medium"
                  >
                    <option value="No">No recibe</option>
                    <option value="Si">Si recibe</option>
                  </select>
                </div>
                {finalizeForm.ayuda_economica === 'Si' && (
                  <div className="animate-in slide-in-from-right-4 duration-300">
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Monto ($)</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={finalizeForm.monto}
                      onChange={(e) => setFinalizeForm({ ...finalizeForm, monto: e.target.value })}
                      className="w-full bg-green-50 border-none rounded-2xl px-5 py-4 text-green-700 focus:ring-2 focus:ring-green-500/20 transition-all font-bold placeholder:text-green-300"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Observaciones de egreso</label>
                <textarea
                  placeholder="Detalles adicionales sobre el egreso..."
                  value={finalizeForm.observaciones}
                  onChange={(e) => setFinalizeForm({ ...finalizeForm, observaciones: e.target.value })}
                  className="w-full bg-gray-50 border-none rounded-3xl px-6 py-5 text-gray-700 focus:ring-2 focus:ring-red-500/20 transition-all font-medium min-h-[120px] resize-none"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsFinalizeModalOpen(false)}
                  className="flex-1 px-8 py-5 bg-gray-100 text-gray-500 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-[2] px-8 py-5 bg-red-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-red-200 hover:bg-red-700 hover:shadow-red-300 hover:-translate-y-0.5 transition-all"
                >
                  Confirmar Finalización
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PSCAdmissionDetails;
