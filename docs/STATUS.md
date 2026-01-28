# LUMIER BRAIN - Estado del Proyecto

> **Última actualización**: 28 de enero de 2026
> **Actualizado por**: Claude (sesión con Javi)

---

## 🚀 Estado Actual: SPRINT 1 - Base de Datos Completa

### Resumen Ejecutivo

La infraestructura del Sprint 1 está **100% configurada**. Las tablas y funciones RPC de Supabase están creadas y funcionando. El siguiente paso es probar los flujos de la aplicación y corregir posibles errores en el frontend.

---

## ✅ Componentes Verificados

### Hosting y Dominio
| Componente | Estado | Notas |
|------------|--------|-------|
| Vercel | ✅ Activo | Proyecto desplegado |
| Dominio | ✅ Configurado | **brain.lumier.es** (cambiado desde calculadora.lumier.es el 28/01/2026) |
| SSL | ✅ Activo | HTTPS automático |

### Base de Datos (Supabase)

#### Tablas Existentes
| Tabla | Estado | RLS | Notas |
|-------|--------|-----|-------|
| `user_profiles` | ✅ | ✅ | Perfiles con roles |
| `projects_v2` | ✅ | ✅ | Proyectos Sprint 1 |
| `calculator_snapshots` | ✅ | ✅ | Historial de cálculos |
| `project_budgets` | ✅ | ✅ | Presupuestos |
| `budget_items_catalog` | ✅ | ✅ | Catálogo partidas |
| `budget_line_items` | ✅ | ✅ | Líneas de presupuesto |
| `projects` | ✅ | ✅ | Tabla original |
| `project_versions` | ✅ | ✅ | Versiones originales |
| `opportunities` | ✅ | ⚠️ UNRESTRICTED | Revisar RLS |
| `historial_parametros` | ✅ | ⚠️ UNRESTRICTED | Revisar RLS |
| `parametros_calculadora` | ✅ | ⚠️ UNRESTRICTED | Revisar RLS |

#### Funciones RPC
| Función | Estado | Propósito |
|---------|--------|-----------|
| `calculate_capex_estimate` | ✅ | Calcula coste reforma por m² y tipo |
| `calculate_project_metrics` | ✅ | Calcula márgenes, ROI, break-even |
| `approve_project` | ✅ | Aprobar oportunidad (dirección/financiero) |
| `reject_project` | ✅ | Rechazar oportunidad con motivo |
| `get_dashboard_stats` | ✅ | Estadísticas dashboard |
| `generate_project_code` | ✅ | Genera códigos LUM-2025-XXX |
| `create_pending_user` | ✅ | Crear usuarios pendientes |
| `handle_new_user` | ✅ | Trigger nuevo usuario |
| `registrar_cambio_parametro` | ✅ | Historial de parámetros |
| `set_snapshot_version` | ✅ | Versionar snapshots |
| `update_budget_totals` | ✅ | Actualizar totales presupuesto |
| `validar_motivo_rechazo` | ✅ | Validar motivos de rechazo |

### Autenticación
| Componente | Estado | Notas |
|------------|--------|-------|
| Google OAuth | ✅ | Restringido a @lumier.es |
| Supabase Auth | ✅ | Integrado |

---

## ⚠️ Pendientes Identificados

### Alta Prioridad
1. **Revisar RLS en 3 tablas** - `opportunities`, `historial_parametros`, `parametros_calculadora` están UNRESTRICTED
2. **Probar flujo completo** - Login → Calculadora → Guardar → Comité

### Media Prioridad
3. **Testing responsive** - Verificar en móvil
4. **Datos de prueba** - Crear usuarios y oportunidades de ejemplo

### Baja Prioridad
5. **Documentar APIs** - Endpoints y funciones RPC
6. **Optimizar queries** - Revisar índices si hay lentitud

---

## 📅 Historial de Sesiones

### 28 de enero de 2026 (Sesión 2)
**Acciones realizadas:**
- ✅ Eliminada sección de perfil de usuario del sidebar (nombre y rol ya no se muestran)
- ✅ Nuevo icono de cerebro minimalista cuando el sidebar está colapsado (reemplaza la "L")
- ✅ Arreglada la carga de oportunidades en Comité de Inversión:
  - Query simplificada para evitar errores de foreign key
  - Carga de datos del comercial de forma separada
  - Mejor manejo de errores con mensajes más descriptivos

**Archivos modificados:**
- `components/dashboard/DashboardSidebar.tsx` - Icono cerebro + eliminado perfil usuario
- `app/comite-inversion/page.tsx` - Query robusta para cargar proyectos

### 28 de enero de 2026 (Sesión 1)
**Acciones realizadas:**
- ✅ Cambio de dominio: `calculadora.lumier.es` → `brain.lumier.es`
- ✅ Verificación de tablas en Supabase (todas las del Sprint 1 existen)
- ✅ Verificación de funciones RPC (todas creadas y funcionando)
- ✅ Identificación de 3 tablas sin RLS (UNRESTRICTED)
- ✅ Creación de este archivo de estado (STATUS.md)

**Próxima sesión debería:**
- Probar la aplicación en brain.lumier.es
- Verificar que el Comité de Inversión carga correctamente
- Configurar RLS en tablas UNRESTRICTED

---

## 🔗 URLs Importantes

| Recurso | URL |
|---------|-----|
| **Aplicación (Producción)** | https://brain.lumier.es |
| **Vercel Dashboard** | https://vercel.com/[tu-cuenta]/lumier-calculadora |
| **Supabase Dashboard** | https://supabase.com/dashboard/project/[tu-proyecto] |
| **Repositorio** | (añadir si existe en GitHub) |

---

## 📁 Estructura de Documentación

```
docs/
├── STATUS.md                  # ← Este archivo (estado actual)
├── SPRINT1_README.md          # Resumen del Sprint 1
├── PROJECT_CONTEXT.md         # Contexto general del proyecto
├── GAP_ANALYSIS.md            # Análisis de diferencias
├── IMPLEMENTATION_PLAN.md     # Plan de implementación
└── sql/                       # Scripts SQL (ya ejecutados)
    ├── 01_user_profiles.sql
    ├── 02_projects_v2.sql
    ├── 03_calculator_snapshots.sql
    ├── 04_budgets.sql
    ├── 05_rpc_functions.sql
    ├── 06_seed_users.sql
    └── 07_add_offer_states.sql
```

---

## 👤 Contacto

- **Propietario**: Javi (javier@lumier.es)
- **Stack**: Next.js 14 + TypeScript + Supabase + Tailwind CSS
- **Proyecto**: Lumier Brain - Herramientas internas para Lumier
