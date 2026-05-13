import React, { useState } from 'react';
import Layout from '../components/Layout';
import { useDashboard } from '../hooks/useDashboard';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, BarChart, Bar, CartesianGrid
} from 'recharts';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-surface-container rounded-2xl ${className}`} />
);

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [filtros, setFiltros] = useState({ desde: '', hasta: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const { data, loading, error } = useDashboard(filtros);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/psc?search=${searchTerm}`);
    }
  };

  const handleClearFilters = () => {
    setFiltros({ desde: '', hasta: '' });
  };

  return (
    <Layout>
      <div className="flex-1 p-8 md:p-12 max-w-7xl mx-auto w-full space-y-12">
        
        {/* HERO SEARCH SECTION (PRESERVED) */}
        <section className="flex flex-col items-center justify-center text-center space-y-8 pt-8 animation-fade-in">
          <div className="space-y-2">
            <h2 className="text-4xl md:text-5xl font-black text-primary tracking-tight font-headline">Sistema de Gestión Unificado</h2>
            <p className="text-on-surface-variant text-lg max-w-2xl mx-auto font-medium">
              Centralice la información y optimice la asistencia ciudadana con herramientas de búsqueda inteligente.
            </p>
          </div>
          
          <form onSubmit={handleSearch} className="w-full max-w-3xl relative group">
            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none transition-transform group-focus-within:scale-110">
              <span className="material-symbols-outlined text-outline text-3xl">search</span>
            </div>
            <input 
              className="w-full h-20 pl-16 pr-6 bg-white text-xl rounded-2xl shadow-2xl shadow-primary/10 border-none focus:ring-4 focus:ring-primary/10 transition-all placeholder:text-outline-variant font-medium font-body" 
              placeholder="Buscar por DNI o nombre" 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute inset-y-0 right-4 flex items-center">
              <kbd className="hidden md:inline-flex items-center px-3 py-1 bg-surface-container-high rounded-lg text-xs font-bold text-outline uppercase tracking-wider">
                Enter
              </kbd>
            </div>
          </form>

          <div className="flex flex-wrap justify-center gap-4">
            <button 
              onClick={() => navigate('/psc/add')}
              className="px-8 py-4 bg-gradient-to-br from-primary to-primary-container text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary/25 hover:scale-[1.05] transition-all active:scale-95"
            >
              <span className="material-symbols-outlined">person_add</span>
              Agregar persona
            </button>
            <button className="px-8 py-4 bg-surface-container-high text-primary rounded-xl font-bold flex items-center gap-2 hover:bg-surface-container-highest transition-all active:scale-95 shadow-sm">
              <span className="material-symbols-outlined">bolt</span>
              Registro rápido
            </button>
          </div>
        </section>

        {/* SECTION 1: DATE FILTERS */}
        <section className="premium-card !p-6 flex flex-col md:flex-row items-end gap-6 shadow-sm border border-outline-variant">
          <div className="flex-1 w-full space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-primary px-1">Fecha Desde</label>
            <input 
              type="date" 
              value={filtros.desde}
              onChange={(e) => setFiltros(prev => ({ ...prev, desde: e.target.value }))}
              className="w-full bg-surface-container border-none rounded-xl px-4 py-3 font-bold text-on-surface focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex-1 w-full space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-primary px-1">Fecha Hasta</label>
            <input 
              type="date" 
              value={filtros.hasta}
              onChange={(e) => setFiltros(prev => ({ ...prev, hasta: e.target.value }))}
              className="w-full bg-surface-container border-none rounded-xl px-4 py-3 font-bold text-on-surface focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleClearFilters}
              className="px-6 py-3.5 bg-surface-container-high text-on-surface-variant rounded-xl font-bold hover:bg-surface-container-highest transition-all"
            >
              Limpiar
            </button>
            <button className="px-6 py-3.5 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all active:scale-[0.98]">
              Aplicar Filtro
            </button>
          </div>
        </section>

        {/* SECTION 2: KPI CARDS */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          {loading ? (
            Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-44" />)
          ) : (
            <>
              <KpiCard 
                title="Personas Activas" 
                value={data.kpis?.activos} 
                icon="people" 
                color="bg-primary" 
              />
              <KpiCard 
                title="En Hotel" 
                value={data.kpis?.personas_en_hotel} 
                icon="hotel" 
                color="bg-secondary" 
              />
              <KpiCard 
                title="Sin Alojamiento" 
                value={data.kpis?.personas_sin_hotel} 
                icon="location_off" 
                color="bg-red-500" 
              />
              <KpiCard 
                title="Sin Entrevista" 
                value={data.kpis?.sin_entrevista} 
                icon="assignment_late" 
                color="bg-orange-500" 
                badge="Pendiente"
                badgeColor="bg-orange-100 text-orange-700"
              />
              <KpiCard 
                title="Pendientes Aprob." 
                value={data.kpis?.pendientes_aprobacion} 
                icon="pending_actions" 
                color="bg-amber-500" 
                badge="Urgente"
                badgeColor="bg-red-100 text-red-700"
              />
              <KpiCard 
                title="Total Histórico" 
                value={data.kpis?.total_ingresos} 
                icon="history" 
                color="bg-slate-700" 
              />
            </>
          )}
        </section>

        {/* SECTION 3: EVOLUTION CHART */}
        <section className="premium-card !p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-on-surface flex items-center gap-3">
              <span className="w-1.5 h-6 bg-primary rounded-full"></span>
              Evolución Mensual de Ingresos
            </h3>
          </div>
          <div className="h-[350px] w-full">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.ingresosPorMes}>
                  <defs>
                    <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="mes_label" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold'}}
                  />
                  <Area type="monotone" dataKey="total_ingresos" name="Ingresos" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorIngresos)" />
                  <Area type="monotone" dataKey="activos" name="Activos" stroke="#10b981" strokeWidth={3} fill="transparent" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        {/* SECTION 4: CHARTS GRID */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Columna Izquierda */}
          <div className="space-y-8">
            <ChartPanel title="Distribución por Género" loading={loading}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.genero}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="total"
                    nameKey="label"
                  >
                    {data.genero.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </ChartPanel>

            <ChartPanel title="Causas de Situación de Calle" loading={loading}>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={data.causasCalle} layout="vertical" margin={{ left: 40, right: 20 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="label" type="category" width={120} axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                  <Tooltip />
                  <Bar dataKey="total" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </ChartPanel>

            <ChartPanel title="Sustancias de Consumo" loading={loading}>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={data.consumo} layout="vertical" margin={{ left: 40, right: 20 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="label" type="category" width={100} axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                  <Tooltip />
                  <Bar dataKey="total" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </ChartPanel>
          </div>

          {/* Columna Derecha */}
          <div className="space-y-8">
            <ChartPanel title="Vulneraciones Detectadas" loading={loading}>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={data.vulneraciones} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="total" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </ChartPanel>

            <ChartPanel title="Condición de Empleo" loading={loading}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.empleo} layout="vertical" margin={{ left: 40, right: 20 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="label" type="category" width={120} axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                  <Tooltip />
                  <Bar dataKey="total" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </ChartPanel>

            <ChartPanel title="Nivel Educativo" loading={loading}>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={data.educacion} layout="vertical" margin={{ left: 40, right: 20 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="label" type="category" width={120} axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                  <Tooltip />
                  <Bar dataKey="total" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </ChartPanel>
          </div>
        </section>

        {/* SECTION 5: TABLES GRID */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-12">
          
          <div className="space-y-8">
            <ChartPanel title="Ocupación por Hotel" loading={loading}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-outline-variant">
                      <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Hotel / Dispositivo</th>
                      <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-center">Activos</th>
                      <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-center">Días Promedio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.porHotel.map((h, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 font-bold text-on-surface text-sm">{h.hotel}</td>
                        <td className="py-4 text-center">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${
                            h.personas_activas > 20 ? 'bg-red-100 text-red-700' : 
                            h.personas_activas > 10 ? 'bg-amber-100 text-amber-700' : 
                            'bg-green-100 text-green-700'
                          }`}>
                            {h.personas_activas}
                          </span>
                        </td>
                        <td className="py-4 text-center font-medium text-slate-500 text-sm">
                          {Math.round(h.promedio_dias_hospedado)} días
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ChartPanel>

            <ChartPanel title="Tiempo en Programa" loading={loading}>
              <div className="space-y-6">
                {data.tiempoPrograma.map((t, i) => {
                  const max = Math.max(...data.tiempoPrograma.map(x => x.total));
                  const percent = (t.total / max) * 100;
                  return (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between items-end">
                        <div>
                          <span className="text-xs font-black text-on-surface uppercase tracking-tight">{t.rango}</span>
                          <p className="text-[10px] font-bold text-on-surface-variant uppercase">{Math.round(t.promedio_dias)} días prom.</p>
                        </div>
                        <span className="text-sm font-black text-primary">{t.total} pers.</span>
                      </div>
                      <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                        <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </ChartPanel>
          </div>

          <ChartPanel title="Motivos de Egreso (Histórico)" loading={loading}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-outline-variant">
                    <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Motivo</th>
                    <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-center">Total</th>
                    <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant text-right">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.egreso.map((e, i) => {
                    const totalSum = data.egreso.reduce((acc, curr) => acc + curr.total, 0);
                    const percent = totalSum > 0 ? (e.total / totalSum) * 100 : 0;
                    return (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 font-bold text-on-surface text-sm">{e.label}</td>
                        <td className="py-4 text-center font-black text-on-surface">{e.total}</td>
                        <td className="py-4 text-right">
                          <span className="text-xs font-black text-primary bg-primary/5 px-2 py-1 rounded-lg">
                            {percent.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </ChartPanel>
        </section>

      </div>
    </Layout>
  );
};

// UI COMPONENTS

const KpiCard = ({ title, value, icon, color, badge, badgeColor }: any) => (
  <div className="premium-card !p-6 flex flex-col justify-between h-44 group shadow-sm hover:border-primary/20 transition-all">
    <div className="flex justify-between items-start">
      <div className={`p-3 ${color.replace('bg-', 'bg-')}/10 rounded-xl`}>
        <span className={`material-symbols-outlined ${color.replace('bg-', 'text-')} text-3xl`}>{icon}</span>
      </div>
      {badge && (
        <span className={`text-[10px] font-black uppercase tracking-widest ${badgeColor} px-2 py-1 rounded-full animate-pulse`}>
          {badge}
        </span>
      )}
    </div>
    <div>
      <div className="text-3xl font-black text-on-surface tracking-tight">{value ?? '0'}</div>
      <div className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mt-1">{title}</div>
    </div>
  </div>
);

const ChartPanel = ({ title, children, loading }: any) => (
  <div className="premium-card !p-8 shadow-sm">
    <div className="flex items-center justify-between mb-8">
      <h3 className="text-sm font-black text-on-surface uppercase tracking-widest flex items-center gap-3">
        <span className="w-1 h-4 bg-primary/40 rounded-full"></span>
        {title}
      </h3>
    </div>
    {loading ? <Skeleton className="h-64 w-full" /> : children}
  </div>
);

export default Dashboard;
