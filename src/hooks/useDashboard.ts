import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface KpiGenerales {
  total_ingresos: number;
  activos: number;
  finalizados: number;
  pendientes_aprobacion: number;
  sin_entrevista: number;
  personas_unicas: number;
  personas_en_hotel: number;
  personas_sin_hotel: number;
}

export interface IngresoMes {
  mes: string;
  mes_label: string;
  total_ingresos: number;
  finalizados: number;
  activos: number;
}

export interface PersonaHotel {
  hotel: string;
  personas_activas: number;
  promedio_dias_hospedado: number;
}

export interface ItemConteo {
  label: string;
  total: number;
}

export interface TiempoPrograma {
  rango: string;
  orden: number;
  total: number;
  promedio_dias: number;
}

export interface DashboardData {
  kpis: KpiGenerales | null;
  ingresosPorMes: IngresoMes[];
  porHotel: PersonaHotel[];
  genero: ItemConteo[];
  causasCalle: ItemConteo[];
  consumo: ItemConteo[];
  vulneraciones: ItemConteo[];
  empleo: ItemConteo[];
  educacion: ItemConteo[];
  egreso: ItemConteo[];
  tiempoPrograma: TiempoPrograma[];
}

interface FiltroFecha {
  desde: string | null;
  hasta: string | null;
}

export const useDashboard = (filtros: FiltroFecha) => {
  const [data, setData] = useState<DashboardData>({
    kpis: null,
    ingresosPorMes: [],
    porHotel: [],
    genero: [],
    causasCalle: [],
    consumo: [],
    vulneraciones: [],
    empleo: [],
    educacion: [],
    egreso: [],
    tiempoPrograma: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rpcParams = {
        desde: filtros.desde || null,
        hasta: filtros.hasta || null
      };

      // qMes sigue siendo una vista
      let qMes = supabase.from('vista_ingresos_por_mes').select('*').order('mes', { ascending: true });
      if (filtros.desde) qMes = qMes.gte('mes', filtros.desde);
      if (filtros.hasta) qMes = qMes.lte('mes', filtros.hasta);

      const [
        resKpis,
        resMes,
        resHotel,
        resGenero,
        resCausas,
        resConsumo,
        resVul,
        resEmpleo,
        resEducacion,
        resEgreso,
        resTiempo
      ] = await Promise.all([
        supabase.rpc('fn_kpis', rpcParams),
        qMes,
        supabase.rpc('fn_personas_por_hotel', rpcParams),
        supabase.rpc('fn_genero', rpcParams),
        supabase.rpc('fn_causas_calle', rpcParams),
        supabase.rpc('fn_consumo', rpcParams),
        supabase.rpc('fn_vulneraciones', rpcParams),
        supabase.rpc('fn_condicion_empleo', rpcParams),
        supabase.rpc('fn_nivel_educativo', rpcParams),
        supabase.rpc('fn_motivos_egreso', rpcParams),
        supabase.rpc('fn_tiempo_en_programa', rpcParams)
      ]);

      // Verificación de errores en las respuestas RPC
      const errors = [
        resKpis.error, resMes.error, resHotel.error, resGenero.error, 
        resCausas.error, resConsumo.error, resVul.error, resEmpleo.error, 
        resEducacion.error, resEgreso.error, resTiempo.error
      ].filter(e => e !== null);

      if (errors.length > 0) {
        console.error('Errores en RPC:', errors);
        // No lanzamos error para permitir que se muestre lo que sí cargó
      }

      setData({
        kpis: Array.isArray(resKpis.data) ? resKpis.data[0] : (resKpis.data || null),
        ingresosPorMes: resMes.data || [],
        porHotel: resHotel.data || [],
        genero: (resGenero.data || []).map((i: any) => ({ label: i.genero, total: i.total })),
        causasCalle: (resCausas.data || []).map((i: any) => ({ label: i.causa, total: i.total })),
        consumo: (resConsumo.data || []).map((i: any) => ({ label: i.sustancia, total: i.total })),
        vulneraciones: (resVul.data || []).map((i: any) => ({ label: i.vulneracion, total: i.total })),
        empleo: (resEmpleo.data || []).map((i: any) => ({ label: i.condicion, total: i.total })),
        educacion: (resEducacion.data || []).map((i: any) => ({ label: i.nivel, total: i.total })),
        egreso: (resEgreso.data || []).map((i: any) => ({ label: i.motivo, total: i.total })),
        tiempoPrograma: (resTiempo.data || []).sort((a: any, b: any) => a.orden - b.orden)
      });

    } catch (err: any) {
      console.error('Error loading dashboard:', err);
      setError(err.message || 'Error al cargar los indicadores');
    } finally {
      setLoading(false);
    }
  }, [filtros.desde, filtros.hasta]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return { data, loading, error, refetch: fetchDashboard };
};
