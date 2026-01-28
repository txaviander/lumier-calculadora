# Contexto del Proyecto - Lumier Brain

## Sobre Lumier

**Lumier** es una promotora inmobiliaria de lujo en Madrid que:
- Factura ~30M€/año
- Gestiona ~15 proyectos de rehabilitación anuales
- Compra, rehabilita y vende viviendas de lujo
- Objetivo: 60% margen bruto, 20% margen neto

## Arquitectura Técnica

### Stack Tecnológico
- **Frontend**: Next.js 14 (App Router) + TypeScript
- **Estilos**: Tailwind CSS
- **Backend/DB**: Supabase (PostgreSQL + Auth)
- **Deploy**: Vercel
- **Autenticación**: Google OAuth (restringido a @lumier.es)

### Estructura de Carpetas Actual
```
lumier-calculadora/
├── app/
│   ├── calculadora/
│   │   └── [projectSlug]/
│   │       └── page.tsx      # Calculadora actual (detalle proyecto)
│   ├── auth/
│   │   └── callback/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx              # Redirect a dashboard
├── components/
│   ├── AuthProvider.tsx
│   ├── Header.tsx
│   ├── LoginPage.tsx
│   ├── LumierLogo.tsx
│   ├── ProtectedRoute.tsx
│   └── dashboard/            # Componentes del dashboard
│       ├── AppCard.tsx
│       ├── AppsGrid.tsx
│       ├── DashboardHeader.tsx
│       ├── DashboardLayout.tsx
│       ├── DashboardSidebar.tsx
│       └── index.ts
├── lib/
│   ├── auth.ts
│   ├── config.ts
│   ├── database.sql          # Schema actual (básico)
│   ├── supabase.ts           # Cliente + tipos + funciones
│   └── utils.ts
├── docs/                     # Documentación Sprint 1
└── public/
    └── images/
```

### Base de Datos Actual (Supabase)

> **Estado**: ✅ SPRINT 1 COMPLETO (verificado 28/01/2026)

**Tablas existentes (todas creadas):**
1. `user_profiles` - ✅ Perfiles con roles
2. `projects_v2` - ✅ Tabla extendida con todos los campos financieros
3. `calculator_snapshots` - ✅ Histórico de cálculos
4. `project_budgets` - ✅ Presupuestos
5. `budget_items_catalog` - ✅ Catálogo de partidas
6. `budget_line_items` - ✅ Líneas de presupuesto
7. `projects` - ✅ Proyectos básicos (original)
8. `project_versions` - ✅ Versiones con datos en JSONB (original)
9. `opportunities` - ✅ (⚠️ sin RLS)
10. `historial_parametros` - ✅ (⚠️ sin RLS)
11. `parametros_calculadora` - ✅ (⚠️ sin RLS)

**Funciones RPC (todas creadas):**
- `calculate_capex_estimate` - Calcula CAPEX por m² y tipo reforma
- `calculate_project_metrics` - Márgenes, ROI, break-even
- `approve_project` / `reject_project` - Flujo de aprobación
- `get_dashboard_stats` - Estadísticas
- `generate_project_code` - Códigos LUM-2025-XXX
- + 8 triggers auxiliares

### Variables de Entorno (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

## Flujo de Usuario Actual

1. Usuario accede a la app
2. Si no está logueado → LoginPage (Google OAuth)
3. Si está logueado → Dashboard con apps
4. Click en "Calculadora" → Lista de proyectos
5. Click en proyecto → Detalle con calculadora completa

## Flujo de Usuario Sprint 1

1. Usuario accede → Login con Google
2. Dashboard → Click "Calculadora"
3. **Nueva evaluación**: Wizard 3 pasos
   - Paso 1: Datos del inmueble
   - Paso 2: Datos financieros
   - Paso 3: Resultados + guardar
4. **Ver oportunidades**: Lista con filtros
5. **Comité de Inversión** (solo dirección/financiero): Aprobar/rechazar

## Diferencias Clave: Calculadora Actual vs Sprint 1

| Aspecto | Actual | Sprint 1 |
|---------|--------|----------|
| Cálculo CAPEX | Fórmulas locales por calidad (1-5 estrellas) | RPC de Supabase por tipo reforma |
| Estructura datos | JSONB en `project_versions` | Tablas normalizadas |
| Roles | No hay roles | Sistema completo de roles |
| Flujo aprobación | No existe | Comité de Inversión |
| Snapshots | Versiones manuales | Histórico automático |
| Recomendación | Colores por margen % | comprar/negociar/rechazar |

## Decisiones de Diseño

### ¿Por qué mantener ambos sistemas?
La calculadora actual funciona y tiene usuarios. El Sprint 1 introduce un modelo diferente. Mantenerlos separados permite:
1. No romper lo existente
2. Migrar gradualmente
3. Comparar resultados

### Estrategia de Migración
1. Sprint 1 se desarrolla como módulo nuevo (`/oportunidades`)
2. Calculadora actual sigue en `/calculadora`
3. Una vez probado, se puede migrar

### URLs Propuestas
- `/calculadora` → Calculadora actual (mantener)
- `/oportunidades` → Nueva lista de oportunidades
- `/oportunidades/nueva` → Wizard nueva evaluación
- `/oportunidades/[id]` → Detalle de oportunidad
- `/comite` → Comité de Inversión

## Información del Usuario

- **Nombre**: Javi
- **Rol en Lumier**: Director
- **Email**: javier@lumier.es
- **Contexto**: 45 años, Madrid, real estate developer, no técnico pero quiere aprender

## Próximos Sprints (Referencia)

- **Sprint 2**: Control Económico de Obra
- **Sprint 3**: (por definir)
