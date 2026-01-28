# LUMIER BRAIN - Sprint 1: Calculadora 2.0 + Comité de Inversión

## Resumen Ejecutivo

Este Sprint transforma la calculadora actual en un sistema completo de evaluación de oportunidades inmobiliarias con:

1. **Calculadora 2.0**: Wizard de 3 pasos con cálculos automáticos de CAPEX, márgenes y ROI
2. **Histórico de evaluaciones**: Todas las evaluaciones se guardan en Supabase
3. **Flujo de aprobación**: Comité de Inversión para aprobar/rechazar oportunidades
4. **Sistema de roles**: Diferentes permisos según el rol del usuario
5. **Diseño responsive**: Funciona perfectamente en móvil

## Estado Actual del Proyecto

> **Última verificación**: 28 de enero de 2026

### Lo que YA existe:
- ✅ Login con Google OAuth (@lumier.es)
- ✅ Dashboard con aplicaciones
- ✅ Calculadora básica funcional (guarda en `projects` + `project_versions`)
- ✅ Supabase configurado
- ✅ Deploy en Vercel → **brain.lumier.es**
- ✅ **Todas las tablas del Sprint 1 creadas** (verificado en Supabase)
- ✅ **Todas las funciones RPC creadas** (verificado en Supabase)
- ✅ Hooks: useProjects, useCalculator, useUserProfile, useUsers
- ✅ Componentes: CalculatorForm, wizard, KeyMetrics, SensitivityMatrix
- ✅ Componentes Comité: ApprovalModal, RejectionModal, OpportunityReviewCard

### Lo que FALTA por probar/completar:
- ⏳ Probar flujo completo en producción (brain.lumier.es)
- ⏳ Corregir posibles errores de integración frontend ↔ Supabase
- ⏳ Configurar RLS en 3 tablas UNRESTRICTED
- ⏳ Testing responsive en móvil

## Estructura de Documentación

```
docs/
├── SPRINT1_README.md          # Este archivo
├── PROJECT_CONTEXT.md         # Contexto completo del proyecto
├── GAP_ANALYSIS.md            # Diferencias entre actual y requerido
├── IMPLEMENTATION_PLAN.md     # Plan paso a paso
├── sql/
│   ├── 01_user_profiles.sql   # Tabla de perfiles de usuario
│   ├── 02_projects_v2.sql     # Nueva tabla projects con todos los campos
│   ├── 03_calculator_snapshots.sql
│   ├── 04_budgets.sql
│   └── 05_rpc_functions.sql   # Funciones RPC incluyendo calculate_capex
└── components/
    └── specs/                 # Especificaciones de componentes
```

## Fórmulas de Cálculo

### CAPEX (Coste de reforma)
Se calcula llamando a la función RPC de Supabase:
```javascript
supabase.rpc('calculate_capex_estimate', { p_size_m2, p_renovation_type })
```

### Margen Bruto
```
Margen Bruto (€) = Precio Venta - Precio Compra - CAPEX
Margen Bruto (%) = (Margen Bruto € / Precio Venta) × 100
```

### Margen Neto
```
Gastos adicionales = 20% del (Precio Compra + CAPEX)
Margen Neto (€) = Margen Bruto € - Gastos adicionales
Margen Neto (%) = (Margen Neto € / Precio Venta) × 100
```

### ROI
```
ROI (%) = (Margen Neto € / (Precio Compra + CAPEX)) × 100
```

### Recomendación (colores semáforo)
```
SI Margen Neto (%) >= 18% → "comprar" (verde)
SI Margen Neto (%) >= 14% → "negociar" (amarillo)
SI Margen Neto (%) < 14% → "rechazar" (rojo)
```

## Roles del Sistema

| Rol | Permisos |
|-----|----------|
| `comercial` | Crear evaluaciones, ver sus oportunidades |
| `project_manager` | Ver proyectos asignados |
| `financiero` | Ver todo, aprobar/rechazar en comité |
| `direccion` | Ver todo, aprobar/rechazar en comité |
| `admin` | Acceso total |

## Orden de Implementación

1. ~~**Día 1-2**: Ejecutar scripts SQL + crear hooks~~ ✅ COMPLETADO
2. ~~**Día 3-5**: Componente CalculatorForm (wizard 3 pasos)~~ ✅ COMPLETADO
3. ~~**Día 6-7**: OpportunitiesList (tabla + filtros)~~ ✅ COMPLETADO
4. ~~**Día 8-10**: InvestmentCommittee~~ ✅ COMPLETADO
5. ~~**Día 11**: Componentes comunes~~ ✅ COMPLETADO
6. **Día 12**: Testing y refinamiento ← **ESTAMOS AQUÍ**

## Cómo Continuar el Desarrollo

1. Lee `docs/PROJECT_CONTEXT.md` para contexto completo
2. Revisa `docs/GAP_ANALYSIS.md` para entender qué falta
3. Ejecuta los scripts SQL en orden (carpeta `docs/sql/`)
4. Sigue `docs/IMPLEMENTATION_PLAN.md` paso a paso

## Notas Importantes

- Usar TypeScript
- Formato de moneda: `1.000.000 €` (sin decimales)
- Loading states en TODOS los botones
- Manejo de errores con toast notifications
- Diseño responsive (probar en Chrome DevTools)

## Contacto

Proyecto: Lumier Brain
Propietario: Javi (@lumier.es)
Stack: Next.js 14 + TypeScript + Supabase + Tailwind CSS
