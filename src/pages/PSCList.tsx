import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';

interface PSC {
  id_psc: number;
  nombre: string;
  apellido: string;
  dni: string;
  genero?: string;
  activo: boolean;
  hotel_actual?: string;
}

const PSCList: React.FC = () => {
  const navigate = useNavigate();
  const [people, setPeople] = useState<PSC[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('Género (Todos)');
  const [activeOnly, setActiveOnly] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [hotels, setHotels] = useState<string[]>([]);
  const [hotelFilter, setHotelFilter] = useState('Hotel (Todos)');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);
  const [statsData, setStatsData] = useState({
    todayCount: 0,
    activeCount: 0,
    inactiveCount: 0,
    pendingInterventions: 0,
    globalTotal: 0,
    inHotelCount: 0
  });

  useEffect(() => {
    fetchStats();
    fetchHotels();
  }, []);

  const fetchHotels = async () => {
    const { data } = await supabase
      .from('t_hoteles')
      .select('nombre')
      .eq('activo', true)
      .order('nombre', { ascending: true });
    
    if (data) setHotels(data.map(h => h.nombre));
  };

  useEffect(() => {
    fetchPeople();
  }, [genderFilter, hotelFilter, activeOnly, currentPage, debouncedSearch]);

  useEffect(() => {
    setCurrentPage(1);
  }, [genderFilter, hotelFilter, activeOnly, debouncedSearch]);

  const fetchStats = async () => {
    const today = new Date().toISOString().split('T')[0];
    
    // 1. Nuevos registros hoy
    const { count: todayCount } = await supabase
      .from('t_psc')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today);
    
    // 2. Intervenciones pendientes (ingresos activos sin entrevista)
    const { count: pendingCount } = await supabase
      .from('t_ingresos')
      .select('*', { count: 'exact', head: true })
      .eq('entrevista', false)
      .eq('finalizado', false);

    // 3. Personas activas
    const { count: activeCount } = await supabase
      .from('t_psc')
      .select('*', { count: 'exact', head: true })
      .eq('activo', true);

    // 4. Personas inactivas
    const { count: inactiveCount } = await supabase
      .from('t_psc')
      .select('*', { count: 'exact', head: true })
      .eq('activo', false);

    // 5. Total global PSC
    const { count: globalTotal } = await supabase
      .from('t_psc')
      .select('*', { count: 'exact', head: true });

    // 6. Personas hoy en hoteles (sin fecha de egreso)
    const { data: hotelData } = await supabase
      .from('t_hospedaje')
      .select('id_psc')
      .is('fecha_egreso', null);
    
    // Contar IDs de PSC únicos en hoteles
    const uniqueHotelPsc = hotelData ? new Set(hotelData.map(h => h.id_psc)).size : 0;
    
    setStatsData({ 
      todayCount: todayCount || 0,
      activeCount: activeCount || 0,
      inactiveCount: inactiveCount || 0,
      pendingInterventions: pendingCount || 0,
      globalTotal: globalTotal || 0,
      inHotelCount: uniqueHotelPsc
    });
  };

  const fetchPeople = async () => {
    setLoading(true);
    
    let query = supabase
      .from('t_psc')
      .select('*', { count: 'exact' });

    // Aplicar búsqueda en el servidor
    if (debouncedSearch) {
      query = query.or(`nombre.ilike.%${debouncedSearch}%,apellido.ilike.%${debouncedSearch}%,dni.ilike.%${debouncedSearch}%`);
    }

    // Filtrar por género
    if (genderFilter !== 'Género (Todos)') {
      if (genderFilter === 'Masculino') query = query.eq('genero', 'Varon');
      else if (genderFilter === 'Femenino') query = query.eq('genero', 'Mujer');
      else if (genderFilter === 'No Binario') query = query.in('genero', ['Mujer Trans', 'varon Trans', 'Prefiero no decirlo']);
      else query = query.eq('genero', genderFilter);
    }
    
    // Filtrar por hotel
    if (hotelFilter !== 'Hotel (Todos)') {
      // Buscamos los PSC que tienen un ingreso activo en ese hotel
      const { data: pscInHotel } = await supabase
        .from('t_ingresos')
        .select('id_psc, t_hospedaje!inner(hotel)')
        .eq('activo', true)
        .eq('finalizado', false)
        .eq('t_hospedaje.hotel', hotelFilter);
      
      const ids = pscInHotel?.map(i => i.id_psc) || [];
      if (ids.length === 0) {
        setPeople([]);
        setTotalCount(0);
        setLoading(false);
        return;
      }
      query = query.in('id', ids);
    }
    
    // Filtrar por estado activo
    if (activeOnly) {
      query = query.eq('activo', true);
    }

    // Paginación y ordenamiento
    const from = (currentPage - 1) * pageSize;
    const to = from + pageSize - 1;
    
    const { data: pscData, count, error } = await query
      .order('apellido', { ascending: true })
      .range(from, to);

    if (error) {
      console.error('Error fetching PSC:', error);
    } else if (pscData) {
      setTotalCount(count || 0);
      
      // Fetch active admissions to show hotel info for current page only
      const pscIds = pscData.map(p => p.id);
      const { data: activeIngresos } = await supabase
        .from('t_ingresos')
        .select(`
          id_psc,
          t_hospedaje(hotel)
        `)
        .in('id_psc', pscIds)
        .eq('activo', true)
        .eq('finalizado', false);

      const formattedData = pscData.map((p: any) => {
        const ingresoActivo = activeIngresos?.find(i => i.id_psc === p.id);
        const hotel = (ingresoActivo?.t_hospedaje as any)?.[0]?.hotel || 'Sin Hotel';

        return {
          id_psc: p.id,
          nombre: p.nombre,
          apellido: p.apellido,
          dni: p.dni,
          genero: p.genero,
          activo: p.activo,
          hotel_actual: hotel
        };
      });
      setPeople(formattedData);
    }
    setLoading(false);
  };

  const filteredPeople = people;

  const handleViewProfile = (id_psc: number) => {
    navigate(`/psc/${id_psc}`);
  };

  return (
    <Layout>
      <div className="p-10 max-w-7xl w-full mx-auto space-y-8 font-body">
        {/* Hero Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-primary/60 mb-2 block">Administración Central</span>
            <h2 className="text-4xl font-extrabold text-on-surface leading-tight font-headline">Listado de Personas en Situación de Calle</h2>
          </div>
          <div className="flex items-center gap-3">
            <button className="bg-surface-container-high text-on-surface px-5 py-2.5 rounded-lg flex items-center gap-2 font-semibold hover:bg-surface-variant transition-colors shadow-sm">
              <span className="material-symbols-outlined">download</span>
              Exportar Excel
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Total Registrados */}
          <div className="bg-surface-container p-5 rounded-3xl space-y-2 border border-outline-variant/10 shadow-sm relative overflow-hidden">
            <p className="text-on-surface-variant font-bold text-xs uppercase tracking-widest">Total Padrón</p>
            <h3 className="text-3xl font-extrabold text-on-surface">{statsData.globalTotal}</h3>
            <p className="text-on-surface-variant text-[10px] uppercase font-bold tracking-tight">Personas registradas</p>
            <span className="material-symbols-outlined absolute -right-3 -bottom-3 text-on-surface/[0.03] text-7xl pointer-events-none">groups</span>
          </div>

          {/* Activos */}
          <div className="bg-primary p-5 rounded-3xl relative overflow-hidden group shadow-md border border-primary/20">
            <div className="relative z-10 space-y-1">
              <p className="text-primary-container font-bold text-xs uppercase tracking-widest">Activos</p>
              <h3 className="text-3xl font-extrabold text-white">{statsData.activeCount}</h3>
              <div className="w-full bg-primary-container/30 h-1 rounded-full mt-2">
                <div 
                  className="bg-white h-full rounded-full transition-all duration-1000" 
                  style={{ width: `${(statsData.activeCount / (statsData.globalTotal || 1)) * 100}%` }}
                ></div>
              </div>
              <p className="text-primary-container text-[10px] font-bold uppercase">{( (statsData.activeCount / (statsData.globalTotal || 1)) * 100).toFixed(1)}% del total</p>
            </div>
            <span className="material-symbols-outlined absolute -right-3 -bottom-3 text-white/10 text-7xl pointer-events-none">person_check</span>
          </div>
          
          {/* Inactivos */}
          <div className="bg-white p-5 rounded-3xl space-y-2 border border-outline-variant/10 shadow-sm relative overflow-hidden">
            <p className="text-on-surface-variant font-bold text-xs uppercase tracking-widest">Inactivos</p>
            <h3 className="text-3xl font-extrabold text-on-surface">{statsData.inactiveCount}</h3>
            <p className="text-on-surface-variant text-[10px] uppercase font-bold">Registro histórico</p>
            <span className="material-symbols-outlined absolute -right-3 -bottom-3 text-on-surface/[0.03] text-7xl pointer-events-none">person_off</span>
          </div>

          {/* Pendientes */}
          <div className="bg-tertiary-fixed p-5 rounded-3xl space-y-2 relative overflow-hidden shadow-sm border border-tertiary-fixed-dim/20">
            <p className="text-on-tertiary-fixed font-bold text-xs uppercase tracking-widest">Pendientes</p>
            <h3 className="text-3xl font-extrabold text-on-tertiary-fixed">{statsData.pendingInterventions.toString().padStart(2, '0')}</h3>
            <p className="text-on-tertiary-fixed-variant text-[10px] font-bold uppercase">Sin entrevista final</p>
            <span className="material-symbols-outlined absolute -right-3 -bottom-3 text-on-tertiary-fixed/[0.05] text-7xl pointer-events-none">assignment_late</span>
          </div>

          {/* En Hoteles */}
          <div className="bg-secondary-fixed p-5 rounded-3xl space-y-2 relative overflow-hidden shadow-sm border border-secondary-fixed-dim/20">
            <p className="text-on-secondary-fixed font-bold text-xs uppercase tracking-widest">En Hoteles</p>
            <h3 className="text-3xl font-extrabold text-on-secondary-fixed">{statsData.inHotelCount}</h3>
            <p className="text-on-secondary-fixed-variant text-[10px] font-bold uppercase">Alojamiento activo</p>
            <span className="material-symbols-outlined absolute -right-3 -bottom-3 text-on-secondary-fixed/[0.05] text-7xl pointer-events-none">hotel</span>
          </div>
        </section>

        {/* Search and Filter Bar */}
        <section className="bg-surface-container-low p-6 rounded-2xl space-y-6 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Search Input */}
            <div className="lg:col-span-8 relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline">search</span>
              <input 
                className="w-full pl-12 pr-4 py-3 bg-white border-none rounded-xl focus:ring-2 focus:ring-primary/20 transition-all shadow-sm placeholder:text-outline-variant font-medium" 
                placeholder="Buscar por Nombre, Apellido o DNI..." 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {/* Filters Grid */}
            <div className="lg:col-span-4 flex flex-wrap items-center gap-4">
              <div className="relative flex-1">
                <select 
                  className="w-full appearance-none bg-white border-none pl-4 pr-10 py-3 rounded-xl shadow-sm font-medium text-sm focus:ring-2 focus:ring-primary/20 cursor-pointer"
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value)}
                >
                  <option>Género (Todos)</option>
                  <option>Masculino</option>
                  <option>Femenino</option>
                  <option>No Binario</option>
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline pointer-events-none">keyboard_arrow_down</span>
              </div>
              <div className="relative flex-1">
                <select 
                  className="w-full appearance-none bg-white border-none pl-4 pr-10 py-3 rounded-xl shadow-sm font-medium text-sm focus:ring-2 focus:ring-primary/20 cursor-pointer"
                  value={hotelFilter}
                  onChange={(e) => setHotelFilter(e.target.value)}
                >
                  <option>Hotel (Todos)</option>
                  {hotels.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline pointer-events-none">keyboard_arrow_down</span>
              </div>
              <label className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl shadow-sm cursor-pointer hover:bg-slate-50 transition-colors">
                <span className="text-sm font-medium text-on-surface-variant">Solo activos</span>
                <div className="relative inline-flex items-center">
                  <input 
                    checked={activeOnly} 
                    onChange={(e) => setActiveOnly(e.target.checked)}
                    className="sr-only peer" 
                    type="checkbox"
                  />
                  <div className="w-10 h-5 bg-slate-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-secondary"></div>
                </div>
              </label>
            </div>
          </div>
          
          {/* Active Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <span className="text-xs font-bold text-outline uppercase mr-2">Filtros aplicados:</span>
            {activeOnly && (
              <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium">
                Estado: Activo
                <button onClick={() => setActiveOnly(false)} className="material-symbols-outlined text-sm leading-none">close</button>
              </div>
            )}
            {hotelFilter !== 'Hotel (Todos)' && (
              <div className="flex items-center gap-2 bg-secondary/10 text-secondary px-3 py-1.5 rounded-full text-sm font-medium">
                Hotel: {hotelFilter}
                <button onClick={() => setHotelFilter('Hotel (Todos)')} className="material-symbols-outlined text-sm leading-none">close</button>
              </div>
            )}
            <button 
              onClick={() => {
                setGenderFilter('Género (Todos)');
                setHotelFilter('Hotel (Todos)');
                setActiveOnly(true);
              }}
              className="text-primary text-sm font-bold ml-2 hover:underline"
            >
              Restablecer
            </button>
          </div>
          
          <div className="flex items-center justify-between mt-4 px-2">
            <span className="text-sm font-bold text-on-surface-variant">
              Resultados encontrados: <span className="text-primary">{totalCount}</span>
            </span>
          </div>
        </section>

        {/* Data Table Section */}
        <section className="bg-white rounded-3xl overflow-hidden shadow-sm border border-outline-variant/10">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container text-on-surface-variant">
                  <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Nombre Completo</th>
                  <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">DNI</th>
                  <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Género</th>
                  <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Hotel Actual</th>
                  <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-center">Estado</th>
                  <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container-low">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-on-surface-variant font-medium">
                      <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                        <span>Cargando registros del sistema...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredPeople.length > 0 ? (
                  filteredPeople.map((p) => (
                    <tr key={p.id_psc} className="hover:bg-surface-container-low transition-colors group">
                      <td className="px-6 py-5 font-bold text-on-surface tracking-tight">
                        {p.nombre} {p.apellido}
                      </td>
                      <td className="px-6 py-5 text-on-surface-variant font-mono text-sm">{p.dni}</td>
                      <td className="px-6 py-5 text-on-surface-variant text-sm">{p.genero || '---'}</td>
                      <td className="px-6 py-5 text-on-surface-variant text-sm font-medium">{p.hotel_actual}</td>
                      <td className="px-6 py-5 text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase border ${
                          p.activo 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                            : 'bg-slate-50 text-slate-400 border-slate-100'
                        }`}>
                          {p.activo ? 'ACTIVO' : 'INACTIVO'}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button 
                          onClick={() => handleViewProfile(p.id_psc)}
                          className="inline-flex items-center gap-2 text-primary font-bold hover:bg-primary/5 px-4 py-2 rounded-xl transition-all active:scale-95"
                        >
                          Ver Detalle
                          <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-on-surface-variant font-medium">
                      No se encontraron personas con los criterios de búsqueda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination Footer */}
          <div className="px-6 py-6 border-t border-surface-container flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-on-surface-variant font-medium">
              Mostrando <span className="text-on-surface font-bold">{Math.min(totalCount, (currentPage - 1) * pageSize + 1)} - {Math.min(totalCount, currentPage * pageSize)}</span> de <span className="text-on-surface font-bold">{totalCount}</span> registros
            </p>
            <nav className="flex items-center gap-1">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-surface-container-high transition-colors text-outline disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              
              {/* Pagination Numbers (Simple version) */}
              {[...Array(Math.min(5, Math.ceil(totalCount / pageSize)))].map((_, i) => {
                const pageNum = i + 1;
                // Basic logic to show pages around current page could be added here, 
                // but for now 1-5 is fine if we have few pages, or just fixed for now.
                return (
                  <button 
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-10 h-10 flex items-center justify-center rounded-lg font-bold transition-all ${
                      currentPage === pageNum 
                        ? 'bg-primary text-white shadow-md shadow-primary/20' 
                        : 'hover:bg-surface-container-high text-outline'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              {Math.ceil(totalCount / pageSize) > 5 && <span className="px-2">...</span>}

              <button 
                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalCount / pageSize), prev + 1))}
                disabled={currentPage >= Math.ceil(totalCount / pageSize)}
                className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-surface-container-high transition-colors text-outline disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </nav>
          </div>
        </section>
      </div>

      {/* FAB */}
      <button 
        onClick={() => navigate('/psc/nuevo')}
        className="fixed bottom-10 right-10 bg-primary text-white p-5 rounded-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all z-50 flex items-center gap-3"
      >
        <span className="material-symbols-outlined">person_add</span>
        <span className="font-bold tracking-tight">Nueva Persona</span>
      </button>
    </Layout>
  );
};

export default PSCList;
