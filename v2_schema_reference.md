# V2 Schema Reference (Source of Truth)

This reference is based on the official `v2` schema SQL. All frontend code must use these names strictly.

## Table: `t_psc`
- `id` (PK)
- `nombre`, `apellido`, `dni`, `tipo_dni`, `genero`, `fecha_nacimiento`
- `foto_dni_frente`, `foto_dni_dorso`
- `tiene_dni`, `activo`, `expulsado`, `gravedad_expulsion`
- `casa_abierta`, `fecha_casa_abierta`, `id_operativo`

## Table: `t_entrevista`
- `id` (PK)
- `id_psc` (FK), `id_ingreso` (FK)
- `de_donde_demanda`, `fecha_entrevista`
- `direccion`, `barrio`, `coordenada`, `obs_direccion`
- `acepta_alojamiento`, `hotel`, `obs_hotel`, `foto_negativa_alojamiento`
- `dias_sit_calle`, `lugar_origen`, `comentarios_lugar_origen`
- `condicion_empleo`, `tipo_oficio`, `nivel_educativo`, `curso_oficio`, `obs_oficio`
- `diagnostico_salud_mental`, `tratamiento_salud_mental`, `comentarios_salud_mental`
- `enfermedad_cronica`, `tipo_enf_cronica`, `tratamiento_enf_cronica`, `comentarios_enf_cronica`
- `tiempo_consumo`, `realizo_tratamiento`, `comentarios_consumo`
- `judicializado`, `vul_educacion`, `vul_laboral`, `vul_vincular`, `vul_salud`, `vul_identidad`
- **JSONB Domains**: `tipo_consumo`, `causa_situacion_calle`, `motivo_atencion`, `instituciones_pasadas`, `lugar_tratamiento_sm`, `lugar_tratamiento_enf`
- `obs_lugar_tratamiento`, `url_informe`

## Table: `t_ingresos`
- `id` (PK)
- `id_psc` (FK), `id_entrevista` (FK)
- `activo`, `aprobado`, `precarga`, `entrevista`, `finalizado`
- `fecha_ingreso`, `fecha_finalizacion`
- `motivo_final`, `gravedad`

## Table: `t_salud`
- `id` (PK)
- `id_psc` (FK), `id_ingreso` (FK)
- `fecha`, `ficha_medica`, `gestion_medicamentos`, `turno_clinico`, `turno_salud_mental`, `turno_tratamiento_consumo`, `internacion_clinica`, `internacion_salud_mental`
- `observaciones`, `imagen_url`

## Table: `t_hospedaje`
- `id` (PK)
- `id_psc` (FK), `id_ingreso` (FK)
- `hotel`, `de_donde_viene`, `num_habitacion`, `fecha_ingreso`, `fecha_egreso`, `dias_hospedado`, `observaciones`

## Table: `t_educacion`
- `id` (PK)
- `id_psc` (FK), `id_ingreso` (FK)
- `fecha`, `cursos_oficio`, `terminalidad_educativa`, `color`, `observaciones`, `imagen_url`

## Table: `t_laboral`
- `id` (PK)
- `id_psc` (FK), `id_ingreso` (FK)
- `fecha`, `confeccion_cv`, `servidores_urbanos`, `emprendimiento`, `art_empleo`, `ayuda_economica`, `monto`, `observaciones`, `imagen_url`

## Table: `t_historial`
- `id` (PK)
- `id_psc` (FK), `id_ingreso` (FK)
- `fecha`, `color`, `descripcion`
- `id_hospedaje`, `id_salud`, `id_laboral`, `id_educacion`, `id_notas`, `id_casa_abierta`
