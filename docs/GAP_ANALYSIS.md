# Análisis GAP: Calculadora Actual vs Sprint 1

## Resumen Ejecutivo

Este documento identifica las diferencias entre el estado actual de la aplicación Lumier Brain y los requisitos del Sprint 1 (Calculadora 2.0 + Comité de Inversión).

---

## 1. Base de Datos

### Estado Actual
| Tabla | Campos | Propósito |
|-------|--------|-----------|
| `projects` | id, slug, name, description, created_at | Proyectos básicos |
| `project_versions` | id, project_id, version, data (JSONB), notes | Versiones con datos en JSON |

### Requerido Sprint 1
| Tabla | Propósito | Estado |
|-------|-----------|--------|
| `user_profiles` | Perfiles con roles del sistema | 🔴 No existe |
| `projects_v2` | Proyectos con campos financieros normalizados | 🔴 No existe |
| `calculator_snapshots` | Histórico de cálculos | 🔴 No existe |
| `project_budgets` | Presupuestos por proyecto | 🔴 No existe |
| `budget_items_catalog` | Catálogo de partidas estándar | 🔴 No existe |
| `budget_line_items` | Líneas de presupuesto detalladas | 🔴 No existe |

### Tipos ENUM Requeridos
| Tipo | Valores | Estado |
|------|---------|--------|
| `user_role` | comercial, project_manager, financiero, diseno, direccion, legal, marketing, rrhh, admin | 🔴 No existe |
| `project_status` | oportunidad, aprobado, en_ejecucion, en_venta, vendido, rechazado | 🔴 No existe |
| `renovation_type` | basica, media, integral, lujo | 🔴 No existe |
| `recommended_action` | comprar, negociar, rechazar | 🔴 No existe |
| `budget_type` | estimado, contratado, real | 🔴 No existe |
| `budget_status` | borrador, aprobado, cerrado | 🔴 No existe |
| `item_category` | demolicion, albanileria, fontaneria, electricidad, carpinteria, pintura, marmoles, climatizacion, equipamiento, otros | 🔴 No existe |

---

## 2. Funciones RPC (Supabase)

### Estado Actual
- No hay funciones RPC en Supabase
- Cálculos se hacen en el frontend (lib/supabase.ts)

### Requerido Sprint 1
| Función | Propósito | Estado |
|---------|-----------|--------|
| `calculate_capex_estimate` | Calcular CAPEX por m² y tipo reforma | 🔴 No existe |
| `calculate_project_metrics` | Calcular márgenes, ROI, break-even | 🔴 No existe |
| `approve_project` | Aprobar proyecto (con validación rol) | 🔴 No existe |
| `reject_project` | Rechazar proyecto (con validación rol) | 🔴 No existe |
| `get_dashboard_stats` | Estadísticas para dashboard | 🔴 No existe |

---

## 3. Autenticación y Roles

### Estado Actual
- ✅ Google OAuth funcionando
- ✅ Restricción a dominio @lumier.es
- 🔴 No hay sistema de roles
- 🔴 No hay perfiles de usuario

### Requerido Sprint 1
- ✅ Google OAuth (ya implementado)
- ✅ Restricción dominio (ya implementado)
- 🔴 Sistema de roles con permisos
- 🔴 Tabla user_profiles
- 🔴 Trigger para crear perfil automático
- 🔴 RLS basado en roles

---

## 4. Interfaz de Usuario

### Páginas Actuales
| Ruta | Componente | Funcionalidad |
|------|------------|---------------|
| `/` | Redirect | Redirige a dashboard |
| `/calculadora` | Lista | Lista de proyectos |
| `/calculadora/[slug]` | Detalle | Calculadora completa por proyecto |

### Páginas Requeridas Sprint 1
| Ruta | Funcionalidad | Estado |
|------|---------------|--------|
| `/oportunidades` | Lista de oportunidades con filtros | 🔴 No existe |
| `/oportunidades/nueva` | Wizard 3 pasos para nueva evaluación | 🔴 No existe |
| `/oportunidades/[id]` | Detalle de oportunidad | 🔴 No existe |
| `/comite` | Comité de Inversión (aprobar/rechazar) | 🔴 No existe |

---

## 5. Componentes UI

### Componentes Actuales
- ✅ DashboardLayout (sidebar, header)
- ✅ Header con navegación
- ✅ Sidebar colapsable
- ✅ AppsGrid para dashboard
- ✅ AuthProvider
- ✅ ProtectedRoute

### Componentes Requeridos Sprint 1
| Componente | Propósito | Estado |
|------------|-----------|--------|
| `OpportunityWizard` | Wizard 3 pasos | 🔴 No existe |
| `Step1PropertyData` | Datos del inmueble | 🔴 No existe |
| `Step2FinancialData` | Datos financieros | 🔴 No existe |
| `Step3Results` | Resultados y guardar | 🔴 No existe |
| `OpportunityList` | Lista con filtros | 🔴 No existe |
| `OpportunityCard` | Tarjeta de oportunidad | 🔴 No existe |
| `InvestmentCommittee` | Panel de aprobación | 🔴 No existe |
| `MetricsPanel` | Panel de métricas | 🔴 No existe |
| `CapexBreakdown` | Desglose de CAPEX | 🔴 No existe |
| `RoleGuard` | Protección por rol | 🔴 No existe |

---

## 6. Lógica de Negocio

### Cálculo de CAPEX

**Actual (frontend):**
```typescript
// En lib/supabase.ts - usa sistema de 1-5 estrellas
// Multiplicadores por categoría y calidad
```

**Requerido (RPC Supabase):**
```sql
-- Tipos de reforma: basica, media, integral, lujo
-- Precios base por m² con multiplicador
-- basica: ~400€/m², media: ~700€/m², integral: ~1000€/m², lujo: ~1500€/m²
```

### Cálculo de Márgenes

**Actual:**
- Margen Bruto = Venta - Compra - CAPEX
- No considera gastos adicionales consistentemente

**Requerido:**
- Margen Bruto = Venta - Compra - CAPEX
- Gastos Adicionales = 20% × (Compra + CAPEX)
- Margen Neto = Bruto - Gastos Adicionales
- ROI = (Margen Neto / (Compra + CAPEX)) × 100

### Sistema de Recomendación

**Actual:**
- Colores por rango de margen
- No hay recomendación explícita

**Requerido:**
- Margen Neto ≥ 18% → "Comprar" (verde)
- Margen Neto 14-18% → "Negociar" (amarillo)
- Margen Neto < 14% → "Rechazar" (rojo)

---

## 7. Flujos de Usuario

### Flujo Actual
1. Login → Dashboard → Calculadora → Seleccionar proyecto → Ver cálculos

### Flujo Sprint 1
1. Login → Dashboard
2. **Nueva Oportunidad**: Dashboard → Wizard (3 pasos) → Guardar
3. **Ver Oportunidades**: Dashboard → Lista → Filtrar → Detalle
4. **Comité** (solo dirección/financiero): Dashboard → Comité → Aprobar/Rechazar

---

## 8. Políticas de Seguridad (RLS)

### Actual
- RLS básico en projects
- No hay control por roles

### Requerido
| Tabla | Política | Roles |
|-------|----------|-------|
| user_profiles | Ver todos | Todos autenticados |
| user_profiles | Editar propio | Usuario propietario |
| projects_v2 | Ver todos | Todos autenticados |
| projects_v2 | Crear | Todos autenticados |
| projects_v2 | Editar | Creador, comercial asignado, dirección, financiero, admin |
| projects_v2 | Aprobar/Rechazar | dirección, financiero, admin |
| calculator_snapshots | Ver/Crear | Todos autenticados |

---

## 9. Resumen de Brechas

### Crítico (Bloquea Sprint 1)
1. 🔴 Crear tablas de base de datos (6 tablas)
2. 🔴 Crear tipos ENUM (7 tipos)
3. 🔴 Crear funciones RPC (5 funciones)
4. 🔴 Implementar sistema de roles

### Alto (Funcionalidad Core)
5. 🔴 Crear página /oportunidades con lista
6. 🔴 Crear wizard de nueva evaluación
7. 🔴 Crear página de Comité de Inversión
8. 🔴 Implementar RoleGuard para protección

### Medio (UX/Mejoras)
9. 🔴 Diseño responsive móvil
10. 🔴 Filtros y búsqueda en lista
11. 🔴 Histórico de snapshots por proyecto
12. 🔴 Dashboard con estadísticas

### Bajo (Nice to have)
13. 🟡 Exportar a PDF
14. 🟡 Notificaciones
15. 🟡 Comparador de versiones

---

## 10. Estimación de Esfuerzo

| Área | Esfuerzo | Prioridad |
|------|----------|-----------|
| Base de datos (SQL) | 2-3 horas | P0 |
| Tipos TypeScript | 1-2 horas | P0 |
| Cliente Supabase | 2-3 horas | P0 |
| Wizard (3 pasos) | 6-8 horas | P1 |
| Lista oportunidades | 3-4 horas | P1 |
| Comité inversión | 3-4 horas | P1 |
| Sistema roles | 2-3 horas | P1 |
| Tests | 4-6 horas | P2 |
| Responsive | 2-3 horas | P2 |

**Total estimado: 25-36 horas de desarrollo**

---

## Próximos Pasos

Ver `IMPLEMENTATION_PLAN.md` para el plan detallado de implementación.
