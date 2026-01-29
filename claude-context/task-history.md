# Historial de Tareas Claude Code

> Este archivo documenta las sesiones de trabajo con Claude Code para mantener contexto entre conversaciones.

---

## 28/01/2026 - Sesión 2 (Tarde) - REVERT

### Objetivo de la sesión
Arreglar que los proyectos guardados desde el wizard no aparecían en la lista de calculadora.

### Completado
- [x] Identificado el problema: wizard guarda en `projects_v2`, lista lee de `projects`
- [x] **REVERTIDO** todos los cambios después de causar múltiples errores

### Intentado pero NO funcionó
- [ ] **Cambiar lista a usar projects_v2**
  - **Error:** 404 en rutas de proyectos, solo 4 proyectos visibles, delete roto
  - **Por qué falló:** URLs incompatibles, datos en tablas diferentes
  - **NO volver a intentar porque:** Requiere migración de datos completa

- [ ] **Crear ruta /calculadora/proyecto/[projectId]**
  - **Error:** No solucionó el problema de raíz
  - **Por qué falló:** Solo parcheaba síntomas, no la causa

- [ ] **Anti-flickering en useProjects**
  - **Error:** Aunque técnicamente correcto, fue parte del revert general
  - **Por qué falló:** No era el problema principal

### Dejado para siguiente sesión
- [ ] Decidir estrategia de unificación de sistemas
- [ ] Implementar migración de datos si se decide unificar
- [ ] O crear vista separada para proyectos de wizard

### Archivos revertidos
- `app/calculadora/page.tsx` - Vuelve a usar `getProjectsWithMetrics()`
- `hooks/useProjects.ts` - Vuelve a estado original
- `components/calculator/wizard/Step2Financial.tsx` - UI original
- `app/calculadora/proyecto/[projectId]/page.tsx` - ELIMINADO

### Aprendizajes
- **NUNCA** cambiar de sistema de datos sin plan de migración
- Hacer commits pequeños y verificar en producción antes de continuar
- Probar la aplicación completa después de cada cambio significativo
- Mantener ambos sistemas separados es mejor que romper uno

### Git
- Commit final: `f103a1e feat(ui): add brain circuit icon for collapsed sidebar`
- Todos los commits posteriores fueron revertidos

---

## 28/01/2026 - Sesión 1 (Mañana) - Bug del Spinner

### Objetivo de la sesión
Arreglar bug donde el wizard se quedaba en spinner infinito en Step 3.

### Completado
- [x] Identificado el bug: fórmulas de cálculo fallaban con valores undefined
- [x] Añadido valores por defecto y validaciones
- [x] Replicado fórmulas exactas del Excel de Lumier
- [x] Commit: `8e61242 fix(calculator): resolve infinite spinner bug and replicate Excel formulas`

### Archivos modificados
- `components/calculator/wizard/Step3Summary.tsx` - Validaciones y valores default
- `lib/supabase.ts` - Fórmulas corregidas

### Aprendizajes
- Siempre validar inputs antes de cálculos
- Usar `|| 0` para valores numéricos que pueden ser undefined
- Las fórmulas deben documentarse claramente

---

## 27/01/2026 - Sprint 1 Features

### Objetivo de la sesión
Implementar funcionalidades del Sprint 1: Wizard, Comité de Inversión, Perfiles.

### Completado
- [x] Wizard de 3 pasos para nueva oportunidad
- [x] Página del Comité de Inversión
- [x] Sistema de perfiles de usuario
- [x] Subida de avatar
- [x] Flujo completo de ciclo de vida de ofertas

### Archivos creados
- `app/calculadora/nueva/page.tsx`
- `app/comite-inversion/page.tsx`
- `app/usuarios/page.tsx`
- `app/perfil/page.tsx`
- `components/calculator/wizard/*`
- `components/investment-committee/*`
- `components/users/*`
- `hooks/useProjects.ts`
- `hooks/useCalculator.ts`
- `hooks/useUserProfile.ts`
- `hooks/useUsers.ts`
- `lib/types.ts`

### Commits principales
- `588a053 feat(sprint1): add user profiles panel and calculator wizard`
- `2996ba1 feat(sprint1): add Investment Committee and profile avatar upload`
- `5b11615 feat: implement complete offer lifecycle workflow`

---

## 26/01/2026 - Mejoras UI Calculadora

### Objetivo de la sesión
Rediseñar la vista de proyecto de calculadora para mejor usabilidad.

### Completado
- [x] Rediseño de KeyMetrics para mejor jerarquía visual
- [x] Nueva matriz de sensibilidad
- [x] P&L summary con layout vertical
- [x] KPIs con sticky header
- [x] Renombrar a "Calculadora de Oportunidades"
- [x] Columnas ordenables en lista

### Commits principales
- `fdf7c37 feat(calculator): rediseño completo de la vista de proyecto`
- `c63c619 feat(calculator): rename to Calculadora de Oportunidades`
- `f5bd20a fix(calculator): redesign KeyMetrics header`

---

## 25/01/2026 - Dashboard y Navegación

### Objetivo de la sesión
Añadir dashboard de aplicaciones y mejorar la navegación.

### Completado
- [x] Sidebar colapsable
- [x] Breadcrumbs
- [x] Grid de aplicaciones
- [x] Página de login con nuevo diseño

### Commits principales
- `5038e2a feat(login): nuevo diseño de página de login`
- `5a2b299 feat: añadir dashboard de aplicaciones y mejorar navegación`
- `5076f9e feat(dashboard): sidebar colapsable y mejoras de UI`

---

## Template para Nuevas Sesiones

```markdown
## [FECHA] - Sesión [Número]

### Objetivo de la sesión
[Qué se quería lograr]

### Completado
- [x] [Tarea específica] - [archivo modificado]
- [x] [Tarea específica] - [archivo modificado]

### Intentado pero NO funcionó
- [ ] [Qué se intentó]
  - **Error:** [descripción del error]
  - **Por qué falló:** [análisis]
  - **NO volver a intentar porque:** [razón]

### Dejado para siguiente sesión
- [ ] [Tarea pendiente]
- [ ] [Tarea pendiente]

### Archivos modificados
- `path/file.js` - [qué se cambió]
- `path/file2.js` - [qué se cambió]

### Aprendizajes
- [Insight técnico importante]
- [Patrón que funcionó bien]

### Git
- Commits: [lista de commits relevantes]
```
