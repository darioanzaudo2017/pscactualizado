import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface OpcionesState {
  [categoria: string]: string[];
}

let cachedOpciones: OpcionesState | null = null;

export const useOpciones = () => {
  const [opciones, setOpciones] = useState<OpcionesState>(cachedOpciones || {});
  const [loading, setLoading] = useState(!cachedOpciones);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cachedOpciones) {
      setLoading(false);
      return;
    }

    const fetchOpciones = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('t_opciones')
          .select('categoria, valor')
          .eq('activo', true)
          .order('orden', { ascending: true });

        if (error) throw error;

        const transformed = (data || []).reduce((acc: OpcionesState, item) => {
          if (!acc[item.categoria]) {
            acc[item.categoria] = [];
          }
          acc[item.categoria].push(item.valor);
          return acc;
        }, {});

        cachedOpciones = transformed;
        setOpciones(transformed);
      } catch (err: any) {
        console.error('Error fetching opciones:', err);
        setError(err.message || 'Error al cargar opciones');
      } finally {
        setLoading(false);
      }
    };

    fetchOpciones();
  }, []);

  return { opciones, loading, error };
};
