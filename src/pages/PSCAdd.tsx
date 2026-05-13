import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { 
  UserPlus, 
  ArrowLeft, 
  Save, 
  AlertCircle, 
  MapPin, 
  Clock, 
  HelpCircle,
  FileText
} from 'lucide-react';
import { useOpciones } from '../hooks/useOpciones';

const PSCAdd = () => {
  const { opciones, loading: optionsLoading } = useOpciones();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicateId, setDuplicateId] = useState<number | null>(null);

  const isEditMode = !!id;

  // Form States - Person
  const [person, setPerson] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    genero: 'Varon',
    fecha_nacimiento: ''
  });

  // Form States - Interview Pre-load
  const [interview, setInterview] = useState({
    motivo_atencion: '',
    dias_sit_calle: 0,
    lugar_origen: '',
    observaciones_iniciales: ''
  });

  useEffect(() => {
    if (isEditMode) {
      fetchPerson();
    }
  }, [id]);

  const fetchPerson = async () => {
    try {
      setFetching(true);
      const { data, error } = await supabase
        .from('t_psc')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      if (data) {
        setPerson({
          nombre: data.nombre || '',
          apellido: data.apellido || '',
          dni: data.dni || '',
          genero: data.genero || 'Varon',
          fecha_nacimiento: data.fecha_nacimiento || ''
        });
      }
    } catch (err: any) {
      console.error('Error fetching person:', err);
      setError('No se pudo cargar la información de la persona.');
    } finally {
      setFetching(false);
    }
  };

  const handlePersonChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setPerson({ ...person, [e.target.name]: e.target.value });
  };

  const handleInterviewChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setInterview({ ...interview, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isEditMode) {
        // UPDATE Person
        const { error: personError } = await supabase
          .from('t_psc')
          .update({
            ...person
          })
          .eq('id', id);

        if (personError) throw personError;
        
        navigate(`/psc/${id}`);
        return;
      }

      // 1. Insert Person into v2.t_psc
      const { data: newPerson, error: personError } = await supabase
        .from('t_psc')
        .insert([{
          ...person,
          activo: true
        }])
        .select()
        .single();

      if (personError) {
        console.error('Error inserting person:', personError);
        
        // Handle Duplicate DNI (Code 23505)
        if (personError.code === '23505') {
          const { data: existing } = await supabase
            .from('t_psc')
            .select('id')
            .eq('dni', person.dni)
            .maybeSingle();
          
          if (existing) {
            setDuplicateId(existing.id);
            throw new Error(`Esta persona ya se encuentra registrada con el DNI ${person.dni}.`);
          }
        }
        
        throw new Error(`Error en el registro: ${personError.message} (Código: ${personError.code})`);
      }

      // 2. Insert Initial Interview into v2.t_entrevista
      const { error: interviewError } = await supabase
        .from('t_entrevista')
        .insert([{
          id_psc: newPerson.id,
          motivo_atencion: [interview.motivo_atencion],
          dias_sit_calle: parseInt(interview.dias_sit_calle.toString() || '0'),
          lugar_origen: interview.lugar_origen,
          comentarios_lugar_origen: interview.observaciones_iniciales
        }]);

      if (interviewError) {
        console.error('Error inserting interview:', interviewError);
        throw new Error(`Error en t_entrevista: ${interviewError.message}`);
      }

      // 3. Create Active Ingreso in v2.t_ingresos
      const { error: ingresoError } = await supabase
        .from('t_ingresos')
        .insert([{
          id_psc: newPerson.id,
          activo: true,
          precarga: true,
          entrevista: false
        }]);

      if (ingresoError) {
        console.error('Error inserting ingreso:', ingresoError);
        // We don't throw here to avoid blocking the whole flow if the person was already created,
        // but it's better to try to have it.
      }

      // 4. Success! Redirect to profile
      navigate(`/psc/${newPerson.id}`);

    } catch (err: any) {
      console.error('Full registration error:', err);
      setError(err.message || 'Error al registrar la persona. Verifique los datos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(isEditMode ? `/psc/${id}` : '/psc')}
              className="p-2 hover:bg-surface-container-high rounded-full transition-colors text-outline"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-primary/60">{isEditMode ? 'Gestión de Persona' : 'Flujo de Ingreso'}</span>
              <h1 className="text-3xl font-extrabold text-on-surface tracking-tight font-headline">{isEditMode ? 'Editar Información' : 'Nueva Persona y Precarga'}</h1>
            </div>
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 bg-primary text-white border-none px-6 py-3 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save size={20} />
            )}
            {isEditMode ? 'Actualizar Información' : 'Guardar Registro e Iniciar'}
          </button>
        </div>

        {error && (
          <div className="bg-error-container text-on-error-container p-6 rounded-3xl flex flex-col items-start gap-3 border border-error-container/20 shadow-lg shadow-error/10 animate-in shake duration-500">
            <div className="flex items-center gap-3">
              <AlertCircle size={20} className="text-error" />
              <p className="text-sm font-black uppercase tracking-tight">{error}</p>
            </div>
            {duplicateId && (
              <button 
                onClick={() => navigate(`/psc/${duplicateId}`)}
                className="mt-2 px-5 py-2.5 bg-white/20 hover:bg-white/30 text-error rounded-xl font-bold text-xs flex items-center gap-2 transition-all"
              >
                <span className="material-symbols-outlined text-sm font-black">visibility</span>
                VER PERFIL EXISTENTE
              </button>
            )}
          </div>
        )}

        {fetching ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
             <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
             <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Cargando datos...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={`grid grid-cols-1 ${isEditMode ? 'max-w-2xl mx-auto' : 'lg:grid-cols-2'} gap-8 pb-12`}>
            {/* Section 1: Personal Data */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-outline-variant/10">
                <div className="flex items-center gap-3 mb-6 pb-2 border-b border-surface-container">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <UserPlus size={18} />
                  </div>
                  <h2 className="text-xl font-bold text-on-surface">Datos Personales</h2>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-1 space-y-1.5">
                    <label className="text-xs font-bold text-outline ml-1 uppercase tracking-wider">Nombre</label>
                    <input
                      required
                      name="nombre"
                      value={person.nombre}
                      onChange={handlePersonChange}
                      className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-on-surface font-medium focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant/50"
                      placeholder="Ej: Juan"
                    />
                  </div>
                  <div className="col-span-1 space-y-1.5">
                    <label className="text-xs font-bold text-outline ml-1 uppercase tracking-wider">Apellido</label>
                    <input
                      required
                      name="apellido"
                      value={person.apellido}
                      onChange={handlePersonChange}
                      className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-on-surface font-medium focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant/50"
                      placeholder="Ej: Pérez"
                    />
                  </div>


                  <div className="col-span-1 space-y-1.5 pt-2">
                    <label className="text-xs font-bold text-outline ml-1 uppercase tracking-wider">Nro Documento</label>
                    <input
                      required
                      name="dni"
                      value={person.dni}
                      onChange={handlePersonChange}
                      className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-on-surface font-medium focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant/50 font-mono"
                      placeholder="Sin puntos ni espacios"
                    />
                  </div>

                  <div className="col-span-1 space-y-1.5 pt-2">
                    <label className="text-xs font-bold text-outline ml-1 uppercase tracking-wider">Género</label>
                    <select
                      name="genero"
                      value={person.genero}
                      onChange={handlePersonChange}
                      disabled={optionsLoading}
                      className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-on-surface font-medium focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50"
                    >
                      {optionsLoading ? (
                        <option>Cargando opciones...</option>
                      ) : (
                        (opciones['genero'] || []).map(g => (
                          <option key={g} value={g}>{g}</option>
                        ))
                      )}
                    </select>
                  </div>

                  <div className="col-span-2 space-y-1.5 pt-2">
                    <label className="text-xs font-bold text-outline ml-1 uppercase tracking-wider">Fecha de Nacimiento</label>
                    <input
                      type="date"
                      required
                      name="fecha_nacimiento"
                      value={person.fecha_nacimiento}
                      onChange={handlePersonChange}
                      className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-on-surface font-medium focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Interview Pre-load (Only if not editing) */}
            {!isEditMode && (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-outline-variant/10 h-full">
                  <div className="flex items-center gap-3 mb-6 pb-2 border-b border-surface-container">
                    <div className="w-8 h-8 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
                      <FileText size={18} />
                    </div>
                    <h2 className="text-xl font-bold text-on-surface">Precarga de Entrevista</h2>
                  </div>

                  <div className="space-y-5">
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-2 text-xs font-bold text-outline ml-1 uppercase tracking-wider">
                        <HelpCircle size={12} />
                        Motivo de la Atención
                      </label>
                      <select
                        required
                        name="motivo_atencion"
                        value={interview.motivo_atencion}
                        onChange={handleInterviewChange}
                        className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-on-surface font-medium focus:ring-2 focus:ring-primary/20 transition-all"
                      >
                        <option value="">Seleccione un motivo...</option>
                        <option value="Situacion de Calle">Situación de Calle (Primer ingreso)</option>
                        <option value="Desalojo">Desalojo inminente</option>
                        <option value="Traslado">Traslado de otra jurisdicción</option>
                        <option value="Salud">Emergencia de Salud</option>
                        <option value="Otro">Otro motivo</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-1 space-y-1.5">
                        <label className="flex items-center gap-2 text-xs font-bold text-outline ml-1 uppercase tracking-wider">
                          <Clock size={12} />
                          Días en calle (aprox)
                        </label>
                        <input
                          type="number"
                          name="dias_sit_calle"
                          value={interview.dias_sit_calle}
                          onChange={handleInterviewChange}
                          className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-on-surface font-medium focus:ring-2 focus:ring-primary/20 transition-all font-mono"
                          min="0"
                        />
                      </div>
                      <div className="col-span-1 space-y-1.5">
                        <label className="flex items-center gap-2 text-xs font-bold text-outline ml-1 uppercase tracking-wider">
                          <MapPin size={12} />
                          Lugar de Procedencia
                        </label>
                        <input
                          name="lugar_origen"
                          placeholder="Barrio / Ciudad"
                          value={interview.lugar_origen}
                          onChange={handleInterviewChange}
                          className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-on-surface font-medium focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2">
                      <label className="text-xs font-bold text-outline ml-1 uppercase tracking-wider">Observaciones Críticas (Initial)</label>
                      <textarea
                        rows={4}
                        name="observaciones_iniciales"
                        value={interview.observaciones_iniciales}
                        onChange={handleInterviewChange}
                        className="w-full bg-surface-container-low border-none rounded-xl px-4 py-3 text-on-surface font-medium focus:ring-2 focus:ring-primary/20 transition-all resize-none placeholder:text-outline-variant/60"
                        placeholder="Indique aquí cualquier dato urgente para el equipo de calle..."
                      />
                    </div>
                    
                    <div className="bg-secondary/5 p-4 rounded-2xl border border-secondary/10 mt-4">
                      <p className="text-xs font-semibold text-secondary flex items-start gap-2">
                        <AlertCircle size={14} className="mt-0.5" />
                        Esta información se registrará como la entrevista inicial. El técnico podrá completar los datos exhaustivos más tarde desde el perfil.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </form>
        )}
      </div>
    </Layout>
  );
};

export default PSCAdd;
