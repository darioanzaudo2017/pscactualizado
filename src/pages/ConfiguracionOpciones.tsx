import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';

interface Opcion {
  id: string | number;
  categoria: string;
  valor: string;
  orden: number;
  activo: boolean;
}

interface Hotel {
  id: string | number;
  nombre: string;
  activo: boolean;
}

const CATEGORIES = [
  { id: 'de_donde_demanda', label: 'De donde demanda' },
  { id: 'genero', label: 'Género' },
  { id: 'tipo_dni', label: 'Tipo DNI' },
  { id: 'lugar_origen', label: 'Lugar de origen' },
  { id: 'condicion_empleo', label: 'Condición de empleo' },
  { id: 'tipo_oficio', label: 'Tipo de oficio' },
  { id: 'nivel_educativo', label: 'Nivel educativo' },
  { id: 'tiempo_consumo', label: 'Tiempo de consumo' },
  { id: 'tipo_consumo', label: 'Tipo de consumo' },
  { id: 'causa_situacion_calle', label: 'Causa situación de calle' },
  { id: 'instituciones_pasadas', label: 'Instituciones pasadas' },
  { id: 'enfermedad_cronica', label: 'Enfermedad crónica' },
  { id: 'lugar_tratamiento_enf', label: 'Lugar tratamiento enfermedad' },
  { id: 'lugar_tratamiento_sm', label: 'Lugar tratamiento salud mental' },
  { id: 'area_derivacion', label: 'Área de derivación' },
  { id: 'hoteles', label: 'Hoteles / Dispositivos' }
];

export const ConfiguracionOpciones: React.FC = () => {
  const { profile } = useAuth();
  const [selectedCategoryId, setSelectedCategoryId] = useState(CATEGORIES[0].id);
  const [opciones, setOpciones] = useState<Opcion[]>([]);
  const [hoteles, setHoteles] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newValue, setNewValue] = useState('');
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const isAdmin = profile?.rol === 'admin';

  useEffect(() => {
    if (isAdmin) {
      if (selectedCategoryId === 'hoteles') {
        fetchHoteles();
      } else {
        fetchOpciones(selectedCategoryId);
      }
    }
  }, [selectedCategoryId, isAdmin]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchOpciones = async (categoria: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('t_opciones')
        .select('*')
        .eq('categoria', categoria)
        .order('orden', { ascending: true });

      if (error) throw error;
      setOpciones(data || []);
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchHoteles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('t_hoteles')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) throw error;
      setHoteles(data || []);
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newValue.trim()) return;
    setSaving(true);

    try {
      if (selectedCategoryId === 'hoteles') {
        const { data, error } = await supabase
          .from('t_hoteles')
          .insert([{ nombre: newValue, activo: true }])
          .select()
          .single();

        if (error) throw error;
        setHoteles(prev => [...prev, data].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      } else {
        const maxOrden = opciones.length > 0 ? Math.max(...opciones.map(o => o.orden)) : 0;
        const { data, error } = await supabase
          .from('t_opciones')
          .insert([{ 
            categoria: selectedCategoryId, 
            valor: newValue, 
            orden: maxOrden + 1, 
            activo: true 
          }])
          .select()
          .single();

        if (error) throw error;
        setOpciones(prev => [...prev, data]);
      }
      setNewValue('');
      showToast('Agregado correctamente');
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActivo = async (id: string | number, currentStatus: boolean) => {
    const table = selectedCategoryId === 'hoteles' ? 't_hoteles' : 't_opciones';
    
    // Optimistic update
    if (selectedCategoryId === 'hoteles') {
      setHoteles(prev => prev.map(h => h.id === id ? { ...h, activo: !currentStatus } : h));
    } else {
      setOpciones(prev => prev.map(o => o.id === id ? { ...o, activo: !currentStatus } : o));
    }

    try {
      const { error } = await supabase
        .from(table)
        .update({ activo: !currentStatus })
        .eq('id', id);

      if (error) throw error;
    } catch (error: any) {
      // Revert on error
      if (selectedCategoryId === 'hoteles') {
        setHoteles(prev => prev.map(h => h.id === id ? { ...h, activo: currentStatus } : h));
      } else {
        setOpciones(prev => prev.map(o => o.id === id ? { ...o, activo: currentStatus } : o));
      }
      showToast(error.message, 'error');
    }
  };

  const handleUpdateValue = async (id: string | number) => {
    if (!editValue.trim()) return;
    const table = selectedCategoryId === 'hoteles' ? 't_hoteles' : 't_opciones';
    const field = selectedCategoryId === 'hoteles' ? 'nombre' : 'valor';

    setSaving(true);
    try {
      const { error } = await supabase
        .from(table)
        .update({ [field]: editValue })
        .eq('id', id);

      if (error) throw error;

      if (selectedCategoryId === 'hoteles') {
        setHoteles(prev => prev.map(h => h.id === id ? { ...h, nombre: editValue } : h));
      } else {
        setOpciones(prev => prev.map(o => o.id === id ? { ...o, valor: editValue } : o));
      }
      setEditingId(null);
      showToast('Actualizado correctamente');
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReorder = async (index: number, direction: 'up' | 'down') => {
    if (selectedCategoryId === 'hoteles') return; // Hotels are sorted alphabetically
    
    const newOpciones = [...opciones];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newOpciones.length) return;

    const currentItem = newOpciones[index];
    const targetItem = newOpciones[targetIndex];

    // Swap order values
    const tempOrden = currentItem.orden;
    currentItem.orden = targetItem.orden;
    targetItem.orden = tempOrden;

    // Sort locally
    newOpciones.sort((a, b) => a.orden - b.orden);
    setOpciones(newOpciones);

    try {
      const { error: error1 } = await supabase
        .from('t_opciones')
        .update({ orden: currentItem.orden })
        .eq('id', currentItem.id);
      
      const { error: error2 } = await supabase
        .from('t_opciones')
        .update({ orden: targetItem.orden })
        .eq('id', targetItem.id);

      if (error1 || error2) throw (error1 || error2);
    } catch (error: any) {
      // Revert isn't trivial here, so we just re-fetch for simplicity or show error
      fetchOpciones(selectedCategoryId);
      showToast('Error al reordenar: ' + error.message, 'error');
    }
  };

  if (!isAdmin) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center p-8 bg-white rounded-3xl shadow-xl border border-red-100">
            <span className="material-symbols-outlined text-red-500 text-6xl mb-4">lock</span>
            <h2 className="text-2xl font-black text-on-surface">Acceso Denegado</h2>
            <p className="text-on-surface-variant mt-2">Esta sección es solo para administradores.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col md:flex-row h-full overflow-hidden bg-surface">
        {/* Sidebar de Categorías */}
        <aside className="w-full md:w-72 bg-white border-r border-outline-variant flex flex-col h-full">
          <div className="p-6 border-b border-outline-variant">
            <h2 className="text-xl font-black text-primary flex items-center gap-2">
              <span className="material-symbols-outlined">settings</span>
              Configuración
            </h2>
          </div>
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-all flex items-center justify-between group ${
                  selectedCategoryId === cat.id 
                    ? 'bg-primary text-white shadow-md shadow-primary/20' 
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-primary'
                }`}
              >
                <span>{cat.label}</span>
                <span className={`material-symbols-outlined text-sm opacity-0 group-hover:opacity-100 transition-opacity ${
                  selectedCategoryId === cat.id ? 'opacity-100' : ''
                }`}>
                  chevron_right
                </span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Contenido Principal */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-on-surface tracking-tight">
                {CATEGORIES.find(c => c.id === selectedCategoryId)?.label}
              </h1>
              <p className="text-on-surface-variant font-medium">
                {selectedCategoryId === 'hoteles' 
                  ? 'Gestione los hoteles y dispositivos de alojamiento disponibles.' 
                  : 'Administre las opciones que aparecen en el formulario de entrevista.'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative group">
                <input
                  type="text"
                  placeholder={`Nueva opción...`}
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="pl-4 pr-12 py-3 bg-white border border-outline-variant rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold text-sm w-64"
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                />
                <button
                  onClick={handleAdd}
                  disabled={saving || !newValue.trim()}
                  className="absolute right-2 top-1.5 p-1.5 bg-primary text-white rounded-lg hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                </button>
              </div>
            </div>
          </header>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              <p className="text-on-surface-variant font-bold animate-pulse text-sm uppercase tracking-widest">Cargando datos...</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {(selectedCategoryId === 'hoteles' ? hoteles : opciones).length === 0 && (
                <div className="text-center py-20 bg-white rounded-[32px] border-2 border-dashed border-outline-variant">
                  <span className="material-symbols-outlined text-outline text-5xl mb-2">inventory_2</span>
                  <p className="text-on-surface-variant font-medium">No hay opciones registradas en esta categoría.</p>
                </div>
              )}

              {(selectedCategoryId === 'hoteles' ? hoteles : opciones).map((item, index) => {
                const isOpcion = 'valor' in item;
                const value = isOpcion ? (item as Opcion).valor : (item as Hotel).nombre;
                const id = item.id;
                const activo = item.activo;

                return (
                  <div 
                    key={id}
                    className={`premium-card !p-4 flex items-center gap-4 group hover:translate-x-1 ${
                      !activo ? 'opacity-60 grayscale-[0.5]' : ''
                    }`}
                  >
                    {!isOpcion ? null : (
                      <div className="flex flex-col gap-1">
                        <button 
                          onClick={() => handleReorder(index, 'up')}
                          disabled={index === 0}
                          className="p-1 hover:bg-surface-container rounded-md disabled:opacity-20 transition-colors"
                        >
                          <span className="material-symbols-outlined text-lg">expand_less</span>
                        </button>
                        <button 
                          onClick={() => handleReorder(index, 'down')}
                          disabled={index === opciones.length - 1}
                          className="p-1 hover:bg-surface-container rounded-md disabled:opacity-20 transition-colors"
                        >
                          <span className="material-symbols-outlined text-lg">expand_more</span>
                        </button>
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      {editingId === id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            autoFocus
                            className="flex-1 py-1 px-2 border-b-2 border-primary focus:outline-none font-bold text-on-surface"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleUpdateValue(id);
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                          />
                          <button onClick={() => handleUpdateValue(id)} className="text-green-600 hover:scale-110"><span className="material-symbols-outlined">check</span></button>
                          <button onClick={() => setEditingId(null)} className="text-red-600 hover:scale-110"><span className="material-symbols-outlined">close</span></button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <p className="font-bold text-on-surface truncate">{value}</p>
                          <button 
                            onClick={() => {
                              setEditingId(id);
                              setEditValue(value);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-outline hover:text-primary"
                          >
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="flex flex-col items-end">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${activo ? 'text-primary' : 'text-outline'}`}>
                          {activo ? 'Activo' : 'Inactivo'}
                        </span>
                        <button
                          onClick={() => handleToggleActivo(id, activo)}
                          className={`relative w-12 h-6 rounded-full transition-colors duration-300 flex items-center ${
                            activo ? 'bg-primary' : 'bg-outline-variant'
                          }`}
                        >
                          <div className={`absolute w-4 h-4 bg-white rounded-full transition-transform duration-300 shadow-sm ${
                            activo ? 'translate-x-7' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl shadow-2xl z-50 flex items-center gap-3 animate-slide-up ${
          toast.type === 'success' ? 'bg-primary text-white' : 'bg-red-600 text-white'
        }`}>
          <span className="material-symbols-outlined">
            {toast.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span className="font-bold text-sm tracking-wide">{toast.message}</span>
        </div>
      )}
    </Layout>
  );
};

export default ConfiguracionOpciones;
