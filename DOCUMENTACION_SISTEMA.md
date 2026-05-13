# Documentación del Sistema: Gestión PSC (V2)

Este documento centraliza el funcionamiento técnico y operativo del sistema de gestión de Personas en Situación de Calle (PSC), enfocándose en la infraestructura sobre el esquema `v2`.

## 1. El Dashboard (Panel de Estadísticas)

El dashboard superior proporciona una vista rápida del estado del padrón. Los datos se calculan dinámicamente cada vez que se carga el listado.

### Métrica: Total Padrón
*   **Origen**: Tabla `v2.t_psc`.
*   **Lógica**: Conteo total de filas en la tabla.
*   **Significado**: Volumen histórico de personas registradas en la base de datos.

### Métrica: Activos
*   **Origen**: Tabla `v2.t_psc` (Filtro: `activo = true`).
*   **Lógica**: Personas con seguimiento vigente.
*   **Visual**: Incluye un porcentaje calculado sobre el total para medir la "carga activa" del sistema.

### Métrica: Inactivos
*   **Origen**: Tabla `v2.t_psc` (Filtro: `activo = false`).
*   **Lógica**: Personas que han egresado del programa o cuya ficha se ha cerrado por diversos motivos.

### Métrica: Pendientes
*   **Origen**: Tabla `v2.t_ingresos`.
*   **Lógica**: Cantidad de ingresos donde `entrevista = false` y `finalizado = false`.
*   **Significado**: Indica cuántas personas han sido ingresadas pero aún no tienen su entrevista técnica/social cargada. Es un KPI de eficiencia administrativa.

### Métrica: En Hoteles
*   **Origen**: Tabla `v2.t_hospedaje`.
*   **Lógica**: Conteo de `id_psc` únicos que tienen un registro con `fecha_egreso IS NULL`.
*   **Significado**: Personas que están ocupando una plaza de hotel hoy.

---

## 2. Estructura de Datos (Esquema V2)

El sistema utiliza un esquema relacional para garantizar la integridad de la información.

### Tablas Principales
*   **`v2.t_psc`**: Entidad principal (Nombre, Apellido, DNI, Género, Estado Activo).
*   **`v2.t_hoteles`**: Listado maestro de establecimientos (ID, Nombre).
*   **`v2.t_hospedaje`**: Historial de alojamientos. Relaciona a una persona (`id_psc`) con un hotel (`id_hotel`).
*   **`v2.t_ingresos`**: Registro de entradas al sistema y estado de entrevistas.

---

## 3. Próximas Actualizaciones (Hoja de Ruta)

Este documento se actualizará a medida que se implementen nuevas funcionalidades:
- [ ] **Filtro Avanzado por Hotel**: Permitirá filtrar el listado principal para ver solo las personas alojadas en un hotel específico del listado maestro.
- [ ] **Integración de Entrevistas**: Pantalla detallada para completar los datos pendientes.
- [ ] **Reportes de Ocupación**: Estadísticas por cada uno de los 14 hoteles oficiales.

---

> [!NOTE]
> Toda la lógica de negocio se procesa sobre el esquema **`v2`**. Nunca se debe operar directamente sobre el esquema `public` para mantener la consistencia de este sistema.
