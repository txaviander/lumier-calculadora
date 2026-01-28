# Changelog - Lumier Brain Platform

> Formato: [Fecha] - [Tipo] - [Descripción]
> Tipos: FEAT (nueva funcionalidad), FIX (arreglo), REFACTOR, DOCS, BREAKING (cambio incompatible)

## [Sin versión] - Fase 1 (Desarrollo)

---

### 28/01/2026 - REVERT - Reversión de cambios de unificación de sistemas

**Módulo:** Calculadora
**Commit:** `f103a1e`

**Cambios:**
- Revertidos todos los intentos de unificar sistemas de datos
- La lista de calculadora vuelve a usar `getProjectsWithMetrics()` (tabla `projects`)
- El wizard sigue guardando en `projects_v2` (separado)

**Motivo:**
Intentar cambiar la lista para usar `projects_v2` causó:
- 404 en rutas de proyectos
- Solo 4 proyectos visibles
- Delete no funcionaba
- Parpadeo infinito en UI

**Lección aprendida:**
NO unificar sistemas sin plan de migración de datos completo.

---

### 28/01/2026 - FIX - Resolver bug del spinner infinito

**Módulo:** Calculadora > Wizard
**Commit:** `8e61242`
**Archivos:**
- `components/calculator/wizard/Step3Summary.tsx`
- `lib/supabase.ts`

**Cambios:**
- Añadidos valores por defecto para campos numéricos undefined
- Corregidas fórmulas de cálculo para manejar edge cases
- Replicadas fórmulas exactas del Excel de Lumier

**Bug resuelto:**
El wizard se quedaba en spinner infinito al llegar al Step 3 cuando algunos campos estaban vacíos.

---

### 27/01/2026 - FEAT - Sistema completo de ciclo de vida de ofertas

**Módulo:** Calculadora, Comité de Inversión
**Commit:** `5b11615`
**Archivos:**
- `components/calculator/SubmitToCIModal.tsx`
- `app/comite-inversion/page.tsx`

**Cambios:**
- Botón "Presentar al CI" en detalle de proyecto
- Modal de confirmación con resumen
- Vista de CI con aprobar/rechazar
- Estados: oportunidad → oferta_autorizada → oferta_presentada → etc.

---

### 27/01/2026 - FEAT - Visualización completa de estados CI

**Módulo:** Calculadora
**Commit:** `9f9eb38`
**Archivos:**
- `components/calculator/ProjectHeader.tsx`

**Cambios:**
- Badge de estado con colores semánticos
- Timeline visual del ciclo de vida
- Información del comercial asignado

---

### 27/01/2026 - FEAT - Comité de Inversión y perfiles

**Módulo:** Sprint 1
**Commit:** `2996ba1`
**Archivos:**
- `app/comite-inversion/page.tsx`
- `app/perfil/page.tsx`
- `components/investment-committee/*`

**Cambios:**
- Página del Comité de Inversión
- Sistema de perfiles de usuario
- Subida de avatar a Supabase Storage
- Roles: comercial, pm, financiero, direccion, etc.

---

### 27/01/2026 - FEAT - Panel de usuarios y wizard

**Módulo:** Sprint 1
**Commit:** `588a053`
**Archivos:**
- `app/usuarios/page.tsx`
- `app/calculadora/nueva/page.tsx`
- `components/calculator/wizard/*`
- `components/users/*`
- `hooks/useProjects.ts`
- `hooks/useCalculator.ts`
- `lib/types.ts`

**Cambios:**
- Wizard de 3 pasos para nueva oportunidad
- Panel de gestión de usuarios
- Hooks para CRUD de proyectos v2
- Tipos TypeScript para Sprint 1

---

### 26/01/2026 - FEAT - Rediseño completo de vista de proyecto

**Módulo:** Calculadora
**Commit:** `fdf7c37`
**Archivos:**
- `components/calculator/KeyMetrics.tsx`
- `components/calculator/SensitivityMatrix.tsx`
- `components/calculator/ProfitLossSummary.tsx`

**Cambios:**
- Matriz de sensibilidad interactiva
- KPIs con mejor jerarquía visual
- P&L summary con layout vertical
- Sticky header para KPIs

---

### 26/01/2026 - FEAT - Renombrar a Calculadora de Oportunidades

**Módulo:** Calculadora
**Commit:** `c63c619`
**Archivos:**
- `app/calculadora/page.tsx`

**Cambios:**
- Renombrado de "Calculadora" a "Calculadora de Oportunidades"
- Columnas ordenables en la lista
- Mejor visualización de métricas

---

### 25/01/2026 - FEAT - Dashboard y navegación mejorada

**Módulo:** Dashboard
**Commits:** `5a2b299`, `5076f9e`, `3b9aafb`
**Archivos:**
- `components/dashboard/*`
- `app/layout.tsx`

**Cambios:**
- Sidebar colapsable
- Breadcrumbs de navegación
- Grid de aplicaciones
- Iconos de Lucide React

---

### 25/01/2026 - FEAT - Nuevo diseño de login

**Módulo:** Auth
**Commit:** `5038e2a`
**Archivos:**
- `components/LoginPage.tsx`
- `public/images/*`

**Cambios:**
- Diseño moderno con imagen de fondo
- Logo de Lumier
- Botón de Google OAuth

---

### 24/01/2026 - FIX - Corrección de fórmulas

**Módulo:** Calculadora
**Commits:** `f302ecd`, `e3682e0`, `4d400f8`
**Archivos:**
- `lib/supabase.ts`

**Cambios:**
- ITP/AJD = 2% (no 6%)
- Fórmulas de arquitectura corregidas
- Inscripción escritura = 145.2€ + 0.08% + 0.05%

---

## Próximos Cambios Planificados

### Sprint 2 - Control Económico de Obra
- [ ] Presupuestos detallados por partidas
- [ ] Seguimiento de gastos reales vs estimados
- [ ] Integración con proveedores

### Sprint 3 - (Por definir)
- [ ] Reporting avanzado
- [ ] Exportación a Excel/PDF
- [ ] Notificaciones

---

## Cómo Añadir Entradas

```markdown
### [FECHA] - [TIPO] - [Descripción breve]

**Módulo:** [nombre del módulo]
**Commit:** `[hash corto]`
**Archivos:**
- `path/to/file.ts`
- `path/to/file2.ts`

**Cambios:**
- [Descripción detallada]
- [Lo que permite hacer ahora]

**Dependencias:** (opcional)
- [Si depende de otra feature]

**Testing:**
- [x] Probado manualmente
- [ ] Tiene tests automatizados
```
