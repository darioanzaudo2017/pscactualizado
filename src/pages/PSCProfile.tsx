import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface Person {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  fecha_nacimiento: string;
  genero: string;
  tipo_dni: string;
  activo: boolean;
  foto_dni_frente: string | null;
  foto_dni_dorso: string | null;
}

interface Entrevista {
  id: string;
  id_psc: number;
  created_at: string;
  dias_sit_calle: number;
  lugar_origen: string;
  motivo_atencion: string;
  vinculos_familiares: string;
  consumo_problemetico: boolean;
  tipo_consumo: string[] | null;
  discapacidad: boolean;
  sin_dni: boolean;
  salud_mental: boolean;
}

const PSCProfile = () => {
  const { id } = useParams<{ id: string }>();
  const [person, setPerson] = useState<Person | null>(null);
  const [ingresos, setIngresos] = useState<any[]>([]);
  const [interview, setInterview] = useState<Entrevista | null>(null);
  const [familyCount, setFamilyCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showNewAdmissionModal, setShowNewAdmissionModal] = useState(false);
  const [newAdmissionDate, setNewAdmissionDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch Person Data (v2)
      const { data: personData, error: personError } = await supabase
        .schema('v2')
        .from('t_psc')
        .select('*')
        .eq('id', id)
        .single();
      
      if (personError) throw personError;
      setPerson(personData);

      // 2. Fetch Ingresos Data (v2)
      const { data: ingresosData } = await supabase
        .schema('v2')
        .from('t_ingresos')
        .select('*, t_hospedaje(hotel)')
        .eq('id_psc', id)
        .order('fecha_ingreso', { ascending: false });
      
      const formattedIngresos = (ingresosData || []).map((i: any) => ({
        ...i,
        id_ingreso: i.id
      }));
      setIngresos(formattedIngresos);

      // 3. Fetch Latest Interview Data (v2)
      const { data: interviewData } = await supabase
        .from('t_entrevista')
        .select('*')
        .eq('id_psc', id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      setInterview(interviewData);

      // 4. Fetch Family Count (v2)
      const { count } = await supabase
        .from('t_grupofamiliar')
        .select('*', { count: 'exact', head: true })
        .eq('id_psc', id);
      
      setFamilyCount(count || 0);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmission = async () => {
    if (!id) return;
    try {
      // 1. Insertar el nuevo ingreso
      const { error: ingresoError } = await supabase
        .from('t_ingresos')
        .insert({
          id_psc: parseInt(id),
          fecha_ingreso: new Date(newAdmissionDate).toISOString(),
          finalizado: false,
          activo: true
        });

      if (ingresoError) throw ingresoError;

      // 2. Reactivar el perfil del PSC y limpiar estados de expulsión previa
      const { error: pscError } = await supabase
        .from('t_psc')
        .update({ 
          activo: true,
          expulsado: false,
          gravedad_expulsion: null
        })
        .eq('id', id);

      if (pscError) throw pscError;
      
      setShowNewAdmissionModal(false);
      fetchData();
    } catch (error) {
      console.error('Error creating admission:', error);
      alert('Error al crear el ingreso. Verifique la conexión.');
    }
  };

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return 'N/A';
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const month = today.getMonth() - birth.getMonth();
    if (month < 0 || (month === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#fcfcfd]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-500 animate-pulse">Cargando perfil premium...</p>
        </div>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="p-8 text-center min-h-screen flex flex-col items-center justify-center bg-[#fcfcfd]">
        <div className="premium-card !shadow-xl !border-slate-200 max-w-md w-full">
          <span className="material-symbols-outlined text-6xl text-slate-300 mb-4 text-center block">person_off</span>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Beneficiario no encontrado</h2>
          <p className="text-slate-500 mb-8 text-sm leading-relaxed">No pudimos localizar esta ficha en el sistema V2. Por favor regrese y reintente.</p>
          <Link to="/psc" className="w-full py-3 bg-primary text-white rounded-xl font-bold shadow-lg hover:shadow-primary/20 transition-all text-sm flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Volver al listado
          </Link>
        </div>
      </div>
    );
  }

  const fullName = `${person.nombre} ${person.apellido}`.toUpperCase();

  return (
    <main className="min-h-screen bg-[#fcfcfd] font-['Inter'] selection:bg-primary/10">
      {/* Dynamic Background Gradient */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50/40 via-transparent to-transparent pointer-events-none" />

      <div className="relative z-10 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-4">
            <nav className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <Link to="/psc" className="hover:text-primary transition-colors flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px]">group</span>
                Beneficiarios
              </Link>
              <span className="material-symbols-outlined text-[14px] opacity-40">chevron_right</span>
              <span className="text-slate-800">Ficha de Perfil</span>
            </nav>
            <div>
              <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 font-['Manrope'] tracking-tight">
                Perfil de <span className="text-primary">{person.nombre}</span>
              </h1>
              <p className="text-slate-500 mt-2 font-medium flex items-center gap-2">
                <span className={`w-4 h-4 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.4)] ${ingresos[0]?.activo ? 'bg-green-500' : 'bg-slate-400'}`}></span>
                Estado Registral: V2 Normalizado {ingresos[0]?.activo ? '(Ingreso Activo)' : '(Sin Ingreso)'}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {(ingresos.length > 0 && ingresos[0].precarga && !ingresos[0].entrevista) && (
              <Link 
                to={`/psc/${id}/entrevista`}
                className="px-6 py-3 bg-red-600 text-white font-black text-sm rounded-2xl shadow-xl shadow-red-200 hover:shadow-red-300 active:scale-95 transition-all flex items-center gap-2.5 animate-pulse"
              >
                <span className="material-symbols-outlined text-[18px]">priority_high</span>
                Completar Entrevista Técnica
              </Link>
            )}
            {!ingresos.some(i => !i.finalizado) && (
              <button 
                onClick={() => setShowNewAdmissionModal(true)}
                className="px-6 py-3 bg-slate-900 text-white font-bold text-sm rounded-2xl shadow-xl shadow-slate-900/10 hover:shadow-slate-900/20 active:scale-95 transition-all flex items-center gap-2.5"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Nuevo Ingreso
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8 items-start">
          {/* LEFT SIDEBAR - Profile Card */}
          <div className="col-span-12 lg:col-span-3 space-y-6">
            <div className="premium-card !p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative overflow-hidden group">
              {/* Decorative Accent */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-8 -mt-8 blur-2xl group-hover:bg-primary/10 transition-colors" />
              
              <div className="flex flex-col items-center text-center relative z-10">
                <div className="relative mb-6">
                  <div className="w-40 h-40 rounded-[48px] overflow-hidden border-8 border-slate-50 shadow-inner ring-1 ring-slate-200">
                    {person.foto_dni_frente ? (
                      <img src={person.foto_dni_frente} alt={fullName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5 text-primary text-5xl font-black font-['Manrope']">
                        {person.nombre[0]}{person.apellido[0]}
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-white p-2 rounded-2xl shadow-lg border border-slate-100">
                    <span className="material-symbols-outlined text-primary text-[20px] font-bold">verified</span>
                  </div>
                </div>

                <h3 className="text-2xl font-extrabold text-slate-900 leading-tight mb-2 font-['Manrope']">{fullName}</h3>
                <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-tighter rounded-lg mb-8">
                  {person.tipo_dni} {person.dni}
                </span>
                
                <div className="w-full space-y-5 text-left pt-6 border-t border-slate-100">
                  <div className="group/item">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-1">Nacimiento (Edad)</span>
                    <div className="flex items-center gap-2">
                       <span className="material-symbols-outlined text-slate-400 text-sm">cake</span>
                       <span className="text-sm font-bold text-slate-700">
                         {person.fecha_nacimiento ? new Date(person.fecha_nacimiento).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                         <span className="text-primary ml-2">({calculateAge(person.fecha_nacimiento)} años)</span>
                       </span>
                    </div>
                  </div>

                  <div className="group/item">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-1">Grupo Familiar</span>
                    <div className="flex items-center gap-2">
                       <span className="material-symbols-outlined text-slate-400 text-sm">family_restroom</span>
                       <span className="text-sm font-bold text-slate-700">{familyCount} integrantes registrados</span>
                    </div>
                  </div>

                  <div className="group/item">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-1">Motivo de Atención</span>
                    <div className="flex items-center gap-2">
                       <span className="material-symbols-outlined text-slate-400 text-sm">info</span>
                       <span className="text-sm font-bold text-slate-700 truncate">{Array.isArray(interview?.motivo_atencion) ? interview.motivo_atencion[0] : (interview?.motivo_atencion || 'No registrado')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats Banner */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[32px] p-8 shadow-2xl relative overflow-hidden">
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
               <div className="relative z-10">
                 <h4 className="text-white/60 text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                   <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                   Última Situación
                 </h4>
                 <div className="space-y-4">
                    <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl border border-white/10">
                       <span className="text-white/50 text-xs font-bold uppercase">En calle</span>
                       <span className="text-white font-black">{interview?.dias_sit_calle || 0} días</span>
                    </div>
                    <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl border border-white/10">
                       <span className="text-white/50 text-xs font-bold uppercase">Origen</span>
                       <span className="text-white font-black truncate max-w-[120px]">{interview?.lugar_origen || 'No det.'}</span>
                    </div>
                 </div>
               </div>
            </div>
          </div>

          {/* MAIN CONTENT - Admission History */}
          <div className="col-span-12 lg:col-span-9 space-y-10">
            <section className="premium-card !rounded-[40px] !p-10 !shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-50 min-h-[600px] relative">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black text-slate-900 font-['Manrope'] tracking-tight">Historial de Ingresos</h3>
                  <p className="text-sm text-slate-500 font-medium">Registro cronológico de períodos de atención en este dispositivo.</p>
                </div>
                <div className="px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                   <div className="text-right">
                      <p className="text-[10px] text-slate-400 font-black uppercase leading-none">Total Ingresos</p>
                      <p className="text-lg font-black text-primary leading-none mt-1">{ingresos.length}</p>
                   </div>
                   <div className="w-px h-8 bg-slate-200" />
                   <span className="material-symbols-outlined text-primary">analytics</span>
                </div>
              </div>

              {ingresos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-[32px] border-2 border-dashed border-slate-200">
                  <div className="w-20 h-20 bg-white rounded-full shadow-lg flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-4xl text-slate-300">timeline</span>
                  </div>
                  <h4 className="text-xl font-bold text-slate-800">Sin historial de ingresos</h4>
                  <p className="text-slate-500 text-sm mt-1 mb-8 max-w-[280px] text-center">Aún no se han registrado ingresos para este PSC en el sistema actual.</p>
                  <button 
                    onClick={() => setShowNewAdmissionModal(true)}
                    className="px-8 py-3 bg-white text-primary font-bold text-sm border-2 border-primary/20 rounded-2xl hover:bg-primary/5 transition-all shadow-sm"
                  >
                    Registrar Primer Ingreso
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {ingresos.map((ingreso) => (
                    <Link 
                      key={ingreso.id_ingreso} 
                      to={`/psc/${id}/ingreso/${ingreso.id_ingreso}`}
                      className="group premium-card !p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-primary/20 transition-all duration-300 relative overflow-hidden"
                    >
                      {/* Card Background Decoration */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <div className="flex gap-5 items-start relative z-10">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
                          ingreso.finalizado 
                            ? 'bg-slate-50 text-slate-400 group-hover:bg-slate-100' 
                            : 'bg-primary/10 text-primary group-hover:bg-primary shadow-[0_0_20px_rgba(0,97,164,0.1)] group-hover:text-white'
                        }`}>
                          <span className="material-symbols-outlined text-2xl font-bold">
                            {ingreso.finalizado ? 'history' : 'waves'}
                          </span>
                        </div>
                        
                        <div className="flex-1 space-y-4">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <h4 className="text-lg font-black text-slate-800 group-hover:text-primary transition-colors leading-none">
                                {ingreso.finalizado ? 'Ingreso Pasado' : 'Período Activo'}
                              </h4>
                              {!ingreso.finalizado && (
                                <span className="flex h-2 w-2 relative">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">ID: #{ingreso.id_ingreso.toString().slice(-4)}</p>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                               <p className="text-[10px] text-slate-400 font-black uppercase">Inicio</p>
                               <p className="text-xs font-bold text-slate-700">{new Date(ingreso.fecha_ingreso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                               {ingreso.t_hospedaje && ingreso.t_hospedaje.length > 0 && (
                                 <p className="text-[9px] text-primary font-black uppercase flex items-center gap-1 mt-1 leading-none">
                                   <span className="material-symbols-outlined text-[12px]">apartment</span>
                                   {ingreso.t_hospedaje[0].hotel}
                                 </p>
                               )}
                            </div>
                            {ingreso.finalizado && (
                              <div className="space-y-1">
                                 <p className="text-[10px] text-slate-400 font-black uppercase text-right">Egreso</p>
                                 <p className="text-xs font-bold text-slate-700 text-right">
                                   {ingreso.fecha_finalizacion ? new Date(ingreso.fecha_finalizacion).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}
                                 </p>
                                 <p className="text-[9px] text-slate-500 font-bold uppercase text-right leading-tight">
                                   {ingreso.motivo_final}
                                   {ingreso.gravedad && (
                                     <span className="block text-red-600 font-black mt-0.5">{ingreso.gravedad}</span>
                                   )}
                                 </p>
                              </div>
                            )}
                          </div>

                          <div className="pt-4 flex items-center justify-between">
                             <div className="flex -space-x-2">
                                <div className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-500" title="Acompañamiento"><span className="material-symbols-outlined text-xs">medical_services</span></div>
                                <div className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-500" title="Alojamiento"><span className="material-symbols-outlined text-xs">home</span></div>
                                <div className="w-7 h-7 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-500" title="Resumen"><span className="material-symbols-outlined text-xs">more_horiz</span></div>
                             </div>
                             <span className="text-[10px] font-black text-primary uppercase tracking-widest group-hover:translate-x-1 transition-transform flex items-center gap-1">
                               Detalle <span className="material-symbols-outlined text-sm">arrow_right_alt</span>
                             </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      {/* MODAL - New Admission (Premium Design) */}
      {showNewAdmissionModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] w-full max-w-md p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-slate-100 animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-8">
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-slate-900 font-['Manrope']">Nuevo Ingreso</h3>
                <p className="text-xs text-slate-500 font-medium tracking-wide leading-none uppercase">Apertura de período V2</p>
              </div>
              <button 
                onClick={() => setShowNewAdmissionModal(false)}
                className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <div className="space-y-8">
              <div className="bg-slate-50 p-6 rounded-[24px] border border-slate-100 space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Fecha de Ingreso</label>
                  <input 
                    type="date" 
                    value={newAdmissionDate}
                    onChange={(e) => setNewAdmissionDate(e.target.value)}
                    className="w-full px-4 py-3.5 rounded-2xl bg-white border border-slate-200 focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none font-bold text-slate-800 transition-all cursor-pointer"
                  />
                </div>
              </div>
              
              <div className="flex items-start gap-4 p-5 bg-primary/5 rounded-[24px] border border-primary/10">
                <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary">info</span>
                </div>
                <p className="text-xs text-primary/80 font-semibold leading-relaxed">
                  Esta acción creará un nuevo registro de atención. Podrá dar seguimiento a intervenciones de salud, alojamiento y educación de forma independiente por cada ingreso.
                </p>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setShowNewAdmissionModal(false)}
                  className="flex-1 px-6 py-4 rounded-2xl text-slate-500 font-black text-sm hover:bg-slate-50 transition-colors uppercase tracking-widest"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleCreateAdmission}
                  className="flex-1 px-6 py-4 rounded-2xl bg-primary text-white font-black text-sm hover:shadow-[0_8px_25px_-5px_rgba(0,97,164,0.4)] hover:-translate-y-0.5 active:translate-y-0 transition-all shadow-lg uppercase tracking-widest"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default PSCProfile;
