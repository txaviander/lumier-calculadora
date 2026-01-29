# Log de Decisiones Técnicas

> Este archivo documenta las decisiones técnicas importantes del proyecto para evitar repetir errores y mantener consistencia.

---

## 28/01/2026 - NO Unificar Sistemas de Base de Datos

### Contexto
El proyecto tiene dos sistemas de datos:
- **Sistema Antiguo**: Tablas `projects` + `project_versions` (usado por `/calculadora/page.tsx`)
- **Sistema Nuevo**: Tablas `projects_v2` + `calculator_snapshots` (usado por el wizard y hooks)

Se intentó unificar cambiando la lista de calculadora para que usara `projects_v2` en lugar de `projects`.

### Opciones Consideradas

1. **Opción A: Cambiar lista a usar projects_v2**
   - Pros: Un solo sistema, datos más modernos
   - Contras: Proyectos antiguos desaparecen (están en `projects`), rompe funcionalidad de borrar, URLs incompatibles

2. **Opción B: Cambiar wizard para guardar en projects**
   - Pros: Compatibilidad con lista existente
   - Contras: Requiere adaptar estructura de datos del wizard

3. **Opción C: Mantener ambos sistemas separados** (ELEGIDA)
   - Pros: No rompe nada existente, migración gradual posible
   - Contras: Duplicación de código, confusión potencial

### Decisión Final
Se eligió **Opción C** porque intentar unificar causó múltiples errores:
- 404 en rutas de proyectos
- Solo 4 proyectos visibles (los nuevos de `projects_v2`)
- Delete no funcionaba (diferentes tablas)
- Parpadeo/flickering por re-renders infinitos

### Consecuencias
- La lista en `/calculadora/page.tsx` DEBE usar `getProjectsWithMetrics()` que consulta `projects`
- El wizard en `/calculadora/nueva` guarda en `projects_v2` pero estos proyectos NO aparecen en la lista principal
- Para ver proyectos del wizard, se necesita una ruta/página separada
- **NO intentar cambiar esto sin un plan de migración completo**

### Archivos Afectados
- `app/calculadora/page.tsx` - DEBE usar sistema antiguo
- `hooks/useProjects.ts` - Usa sistema nuevo (projects_v2)
- `lib/supabase.ts` - Define funciones para sistema antiguo

---

## 28/01/2026 - Anti-Pattern de useEffect con Objetos como Dependencias

### Contexto
El hook `useProjects` tenía un bug que causaba parpadeo infinito en la UI.

### Problema
```typescript
// MALO - objeto nuevo en cada render
function useProjects({ filters = {} }) {
  useEffect(() => {
    fetchProjects()
  }, [filters])  // ❌ filters es nuevo objeto cada vez
}
```

### Solución Correcta
```typescript
// BUENO - referencia estable
const EMPTY_FILTERS = {}

function useProjects({ filters = EMPTY_FILTERS }) {
  const filtersKey = useMemo(() => JSON.stringify(filters), [filters])

  useEffect(() => {
    fetchProjects()
  }, [filtersKey])  // ✅ solo cambia si el contenido cambia
}
```

### Lección Aprendida
- NUNCA usar objetos literales como valores por defecto de parámetros en hooks
- Usar `useMemo` o refs para estabilizar referencias
- Considerar usar `JSON.stringify` para comparar objetos complejos

---

## 27/01/2026 - Sistema de Calidad de Reforma: Estrellas vs Tipos

### Contexto
Excel original usa escala 1-5 estrellas para calidad de reforma. Sprint 1 introduce tipos textuales.

### Opciones Consideradas

1. **Mantener estrellas (1-5)**
   - Pros: Consistente con Excel, usuarios familiarizados
   - Contras: Menos descriptivo, mapping manual a costes

2. **Cambiar a tipos textuales** (basica/media/integral/lujo)
   - Pros: Más claro, expandible, consistente con Sprint 1
   - Contras: Rompe compatibilidad con datos existentes

### Decisión Final
Mantener AMBOS:
- Sistema antiguo usa `calidad: number` (1-5)
- Sistema nuevo usa `renovation_type: RenovationType`

### Mapping
```typescript
const CALIDAD_TO_TYPE: Record<number, RenovationType> = {
  1: 'basica',
  2: 'basica',
  3: 'media',
  4: 'integral',
  5: 'lujo'
}
```

### Archivos Afectados
- `lib/supabase.ts` - CalculatorData.calidad
- `lib/types.ts` - RenovationType
- `components/calculator/wizard/Step2Financial.tsx` - Selector de estrellas

---

## 26/01/2026 - Fórmulas de Cálculo del Excel

### Contexto
Las fórmulas de la calculadora deben replicar exactamente el Excel de Lumier.

### Decisión
Documentar todas las fórmulas en `MANUAL_CALCULOS.md` y replicarlas en:
1. `lib/supabase.ts` - Función `calculateMetricsFromData()`
2. Funciones RPC de Supabase (para sistema nuevo)

### Fórmulas Clave
```
ITP/AJD = Precio Compra × 2%
Inscripción = 145.2€ + (Precio Compra × 0.08%) + (Precio Compra × 0.05%)
Honorarios Compra = Precio Compra × %Intermediación × 1.21 (IVA)
Plusvalía = Precio Venta × 0.267%
```

### Archivos Afectados
- `lib/supabase.ts` - calculateMetricsFromData()
- `MANUAL_CALCULOS.md` - Documentación completa

---

## 25/01/2026 - Autenticación Restringida a @lumier.es

### Contexto
Solo empleados de Lumier deben poder acceder a la plataforma.

### Decisión
Usar Google OAuth con restricción de dominio configurada en Supabase:
- Solo emails terminados en `@lumier.es` pueden registrarse
- Configurado en Supabase Dashboard > Authentication > Providers

### Consecuencias
- No es posible testing con emails personales
- Necesario crear usuarios de prueba con @lumier.es
- Considerar añadir whitelist para desarrollo futuro

---

## 24/01/2026 - Estructura de Rutas: [projectSlug] vs [projectId]

### Contexto
Decidir cómo identificar proyectos en las URLs.

### Opciones Consideradas

1. **UUID (projectId)**
   - Pros: Único, no requiere generación
   - Contras: URLs feas, difíciles de compartir

2. **Slug generado** (ELEGIDA)
   - Pros: URLs legibles, SEO-friendly
   - Contras: Requiere generación, posibles colisiones

### Decisión Final
Usar slugs para el sistema antiguo, UUIDs para el nuevo:
- `/calculadora/[projectSlug]` - Sistema antiguo con slugs
- `projects_v2.project_id` - UUIDs para sistema nuevo

### Implementación
```typescript
function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
  const suffix = Math.random().toString(36).substring(2, 8)
  return `${base}-${suffix}`
}
```

---

## Template para Nuevas Decisiones

```markdown
## [FECHA] - [Título de la Decisión]

### Contexto
[Por qué surgió la necesidad de decidir]

### Opciones Consideradas
1. **Opción A:** [descripción]
   - Pros: [lista]
   - Contras: [lista]

2. **Opción B:** [descripción]
   - Pros: [lista]
   - Contras: [lista]

### Decisión Final
Se eligió [opción] porque [razón].

### Consecuencias
- [Qué implica esta decisión]
- [Qué queda limitado]
- [Qué se gana]

### Archivos Afectados
- [Lista de archivos/módulos]
```
