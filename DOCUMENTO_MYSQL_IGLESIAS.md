# Documento de Análisis del Proyecto "Casa Viva" y Base de Datos MySQL

## 1. Resumen Ejecutivo y Análisis del Proyecto

**Casa Viva** es una plataforma de gestión eclesiástica y comunitaria (*Church Management System*) desarrollada originalmente con **React 18**, **TypeScript** y **Vite 5**.

### 1.1 Estado Actual de la Arquitectura
- **Capa Cliente:** Frontend SPA completo y reactivo con navegación mediante `react-router-dom`.
- **Persistencia:** Integrada directamente con MySQL 8.0 a través de una API en Express (`server/`), con fallback local en `localStorage`.
- **Multisede (Multi-tenant):** Toda la información está segmentada por iglesia (`churchId`). Actualmente el sistema modela iglesias reales del Centro y barrios de Mérida, Yucatán (Catedral de San Ildefonso, San Cristóbal, Santa Lucía, Fátima, Itzimná, etc.).
- **Seguridad basada en Roles (RBAC):**
  - `administrador`: Control total del sistema, cambio de sedes y gestión de usuarios.
  - `pastor`: Visión pastoral, eventos, miembros, reportes y finanzas.
  - `secretario`: Gestión de miembros, asistencia, eventos y avisos.
  - `tesorero`: Control de finanzas, donaciones y reportes financieros.
  - `coordinador`: Registro de asistencias y actividades de ministerios.

---

## 2. Modelo Relacional en MySQL (`iglesias`)

El modelo de datos se encuentra normalizado en **Tercera Forma Normal (3NF)** con integridad referencial, índices y llaves foráneas.

### 2.1 Tablas Diseñadas
1. **`churches`**: Sedes de iglesias, datos geográficos (coordenadas de Mérida), contacto, reseñas históricas y variables visuales de color.
2. **`church_schedules`**: Horarios regulares de misas/cultos por sede (1 a N).
3. **`church_history_timeline`**: Cronología de hitos históricos por sede (1 a N).
4. **`users`**: Cuentas con contraseñas seguras, rol RBAC y pertenencia a sede.
5. **`password_resets`**: Códigos temporales con vigencia de 15 minutos para recuperación de acceso.
6. **`members`**: Registro general de feligreses activos/inactivos, datos de contacto y notas pastorales.
7. **`ministries`**: Ministerios o departamentos (Alabanza, Jóvenes, Acción Social, etc.), coordinados por un miembro.
8. **`ministry_members`**: Tabla pivote para relación N:M entre ministerios y miembros.
9. **`events`**: Cultos, misas, reuniones y actividades pastorales con estado (`programado`, `finalizado`, `cancelado`).
10. **`attendance_records`**: Cabecera de la lista de asistencia por evento y fecha, con registro de quién la capturó.
11. **`attendance_details`**: Detalle individual de presentes y ausentes por evento evaluado.
12. **`donations`**: Ofrendas, diezmos y aportaciones en MXN, anónimas o vinculadas a un miembro, clasificadas por método de pago.
13. **`announcements`**: Boletines y avisos parroquiales con opción de fijado (*pinned*).

### 2.2 Vistas Incluidas
- `v_event_attendance_summary`: Calcula automáticamente el conteo de presentes, ausentes y el porcentaje (%) de asistencia de cada evento.
- `v_monthly_donations`: Agrupación financiera mensual por concepto y método de pago.
- `v_members_with_ministries`: Listado de feligreses con sus ministerios concatenados.

---

## 3. Scripts Incluidos

* **`schema_iglesias.sql`**: Definición completa de tablas, restricciones de integridad referencial, llaves foráneas, índices y vistas.
* **`seed_data.sql`**: Datos semilla iniciales para Mérida: 10 iglesias, 180 feligreses, 50 ministerios, 150 eventos, asistencias, 340 donaciones y usuarios de prueba.
